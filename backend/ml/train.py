"""
StockSense AI — ML Training Script
====================================
Downloads 3–5 years of NSE stock OHLCV data via yfinance, engineers
technical-indicator features, labels each day as BUY (1) or SELL (0)
based on the 5-day forward return, and trains a Random Forest classifier.

Usage
-----
  pip install -r requirements.txt
  python train.py [--symbols RELIANCE.NS TCS.NS ...] [--period 5y] [--horizon 5]

The trained model is saved as  backend/ml/model.joblib  and a JSON
metadata file (feature names, training date, evaluation metrics) is
saved as  backend/ml/model_meta.json.
"""

import argparse
import json
import os
import warnings
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, precision_score, recall_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ─── Defaults ──────────────────────────────────────────────────────────────────
DEFAULT_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS",
    "ICICIBANK.NS", "HINDUNILVR.NS", "ITC.NS", "WIPRO.NS",
    "AXISBANK.NS", "BAJFINANCE.NS", "KOTAKBANK.NS", "SBIN.NS",
    "MARUTI.NS", "TITAN.NS", "NESTLEIND.NS",
]

FEATURE_COLS = [
    "rsi",
    "price_to_ma50",    # price / 50-day SMA  (>1 = above MA)
    "price_to_ma200",   # price / 200-day SMA (>1 = above MA, golden/death cross)
    "ema12_to_ema26",   # EMA-12 / EMA-26     (MACD ratio)
    "macd_norm",        # (EMA12 - EMA26) / price  (normalised MACD)
    "change_pct",       # today's % change
    "sentiment_score",  # proxy: +1 if change>0 else -1 (news unavailable offline)
]

MODEL_PATH = Path(__file__).parent / "model.joblib"
META_PATH  = Path(__file__).parent / "model_meta.json"


# ─── Technical indicators ───────────────────────────────────────────────────────

def calc_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    return 100 - 100 / (1 + rs)


def calc_ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    close = df["Close"]

    df["rsi"]           = calc_rsi(close)
    df["ma50"]          = close.rolling(50).mean()
    df["ma200"]         = close.rolling(200).mean()
    df["ema12"]         = calc_ema(close, 12)
    df["ema26"]         = calc_ema(close, 26)

    df["price_to_ma50"]  = close / df["ma50"]
    df["price_to_ma200"] = close / df["ma200"]
    df["ema12_to_ema26"] = df["ema12"] / df["ema26"]
    df["macd_norm"]      = (df["ema12"] - df["ema26"]) / close
    df["change_pct"]     = close.pct_change() * 100
    # Sentiment proxy (sign of today's return; replace with real NLP score if available)
    df["sentiment_score"] = np.sign(df["change_pct"])

    return df


# ─── Label creation ─────────────────────────────────────────────────────────────

def add_label(df: pd.DataFrame, horizon: int = 5) -> pd.DataFrame:
    """BUY (1) if price is higher `horizon` trading days from now, else SELL (0)."""
    df["forward_return"] = df["Close"].shift(-horizon) / df["Close"] - 1
    df["label"] = (df["forward_return"] > 0).astype(int)
    return df


# ─── Data pipeline ───────────────────────────────────────────────────────────────

def build_dataset(symbols: list[str], period: str, horizon: int) -> pd.DataFrame:
    frames = []
    for symbol in symbols:
        try:
            print(f"  Downloading {symbol}…")
            raw = yf.download(symbol, period=period, progress=False, auto_adjust=True)
            if raw.empty or len(raw) < 250:
                print(f"    ⚠️  Skipping {symbol} — insufficient data ({len(raw)} rows)")
                continue
            # Flatten multi-level columns produced by yfinance ≥ 0.2.x
            if isinstance(raw.columns, pd.MultiIndex):
                raw.columns = raw.columns.get_level_values(0)
            df = raw[["Close", "Open", "High", "Low", "Volume"]].copy()
            df = add_features(df)
            df = add_label(df, horizon)
            df["symbol"] = symbol
            frames.append(df)
            print(f"    ✅ {len(df)} rows")
        except Exception as exc:
            print(f"    ❌ Error for {symbol}: {exc}")

    if not frames:
        raise RuntimeError("No data collected — check your symbols and internet connection.")

    combined = pd.concat(frames)
    # Drop rows with NaN features or labels (first ~200 rows per symbol, last `horizon` rows)
    combined = combined.dropna(subset=FEATURE_COLS + ["label"])
    print(f"\nTotal samples after cleaning: {len(combined):,}")
    return combined


# ─── Train / evaluate ────────────────────────────────────────────────────────────

def train(symbols: list[str], period: str, horizon: int) -> None:
    print("\n📥 Collecting data…")
    data = build_dataset(symbols, period, horizon)

    # Chronological train/test split — NO data leakage
    # Sort by date globally, use last 20% as test set
    data = data.sort_index()
    split_idx = int(len(data) * 0.8)
    train_df = data.iloc[:split_idx]
    test_df  = data.iloc[split_idx:]

    X_train = train_df[FEATURE_COLS]
    y_train = train_df["label"]
    X_test  = test_df[FEATURE_COLS]
    y_test  = test_df["label"]

    print(f"\n🏋️  Training set : {len(X_train):,} samples  (label balance: {y_train.mean():.2%} BUY)")
    print(f"🧪 Test set      : {len(X_test):,}  samples  (label balance: {y_test.mean():.2%} BUY)")

    # Pipeline: impute → scale → Random Forest
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     RandomForestClassifier(
            n_estimators=300,
            max_depth=8,
            min_samples_leaf=20,
            class_weight="balanced",   # handles slight class imbalance
            random_state=42,
            n_jobs=-1,
        )),
    ])

    print("\n🔧 Fitting model…")
    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    prec   = precision_score(y_test, y_pred, zero_division=0)
    rec    = recall_score(y_test, y_pred, zero_division=0)
    print("\n📊 Evaluation on held-out test set:")
    print(classification_report(y_test, y_pred, target_names=["SELL", "BUY"], zero_division=0))

    # Persist
    joblib.dump(pipeline, MODEL_PATH)
    meta = {
        "trained_at":    datetime.utcnow().isoformat() + "Z",
        "symbols":       symbols,
        "period":        period,
        "horizon_days":  horizon,
        "features":      FEATURE_COLS,
        "train_samples": int(len(X_train)),
        "test_samples":  int(len(X_test)),
        "precision_buy": round(float(prec), 4),
        "recall_buy":    round(float(rec), 4),
        "model_version": "1.0.0",
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"\n✅ Model saved  → {MODEL_PATH}")
    print(f"✅ Metadata     → {META_PATH}")
    print(f"   Precision (BUY): {prec:.2%}  |  Recall (BUY): {rec:.2%}")


# ─── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train StockSense ML buy/sell model")
    parser.add_argument("--symbols", nargs="+", default=DEFAULT_SYMBOLS,
                        help="yfinance ticker symbols (e.g. RELIANCE.NS TCS.NS)")
    parser.add_argument("--period",  default="5y",
                        help="yfinance period string: 1y, 3y, 5y (default: 5y)")
    parser.add_argument("--horizon", type=int, default=5,
                        help="Forward-return horizon in trading days (default: 5)")
    args = parser.parse_args()

    train(args.symbols, args.period, args.horizon)
