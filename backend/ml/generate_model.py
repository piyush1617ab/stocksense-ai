"""
StockSense AI — Synthetic Model Generator
==========================================
Trains a demo Random Forest classifier on synthetically generated stock
data so the FastAPI service has a working model.joblib without needing
a live internet connection or the full yfinance dataset.

Feature set (11 features, v2.0):
  rsi, price_to_ma50, price_to_ma200, ema12_to_ema26, macd_norm,
  change_pct, sentiment_score, rsi_overbought, rsi_oversold,
  volatility, momentum

This is intentionally deterministic (fixed random seed) so the output
is reproducible in CI / dev environments.

To re-generate:
  pip install -r requirements.txt
  python generate_model.py
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, precision_score, recall_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODEL_PATH = Path(__file__).parent / "model.joblib"
META_PATH  = Path(__file__).parent / "model_meta.json"

FEATURE_COLS = [
    "rsi",
    "price_to_ma50",
    "price_to_ma200",
    "ema12_to_ema26",
    "macd_norm",
    "change_pct",
    "sentiment_score",
    "rsi_overbought",   # 1 if RSI > 70, else 0
    "rsi_oversold",     # 1 if RSI < 30, else 0
    "volatility",       # 20-day rolling std of daily returns (%)
    "momentum",         # 10-day price rate-of-change (%)
]

RNG = np.random.default_rng(42)
N   = 40_000   # synthetic rows


def generate_data(n: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic but financially plausible training samples.

    Feature distributions mirror realistic NSE stock characteristics:
    - RSI: clusters around 40–65 (neutral zone) with tails at overbought/oversold
    - price_to_ma50 / price_to_ma200: cluster near 1 with slight upward drift
    - MACD ratio near 0, slightly positive on average (markets drift upward)
    - change_pct daily returns: mean ~0.04%, std ~1.5% (Indian market approximation)
    - sentiment_score: sign of change_pct plus a bit of noise
    - rsi_overbought / rsi_oversold: derived from RSI
    - volatility: 20-day rolling std proxy, correlated with abs(change_pct)
    - momentum: 10-day ROC, correlated with change_pct direction
    """
    rsi         = RNG.normal(52, 14, n).clip(0, 100)
    price_ma50  = RNG.lognormal(0.01, 0.04, n)   # ~1.01 median, right-skewed
    price_ma200 = RNG.lognormal(0.02, 0.06, n)
    ema_ratio   = RNG.lognormal(0.002, 0.008, n)  # ~1.002 median
    macd_norm   = RNG.normal(0.0005, 0.005, n)
    change_pct  = RNG.normal(0.04, 1.5, n)

    sentiment = np.sign(change_pct) + RNG.normal(0, 0.1, n)
    sentiment = np.clip(sentiment, -1, 1)

    # RSI zone flags — derived deterministically from rsi
    rsi_overbought = (rsi > 70).astype(float)
    rsi_oversold   = (rsi < 30).astype(float)

    # Volatility: absolute daily move as a rough proxy for 20-day rolling std
    volatility = np.abs(change_pct) * RNG.uniform(0.7, 1.3, n)
    volatility = volatility.clip(0.1, 8.0)  # realistic range: 0.1%–8% daily std

    # Momentum: 10-day ROC correlated with change_pct direction
    momentum = change_pct * RNG.uniform(3, 7, n) + RNG.normal(0, 2, n)
    momentum = momentum.clip(-20, 20)   # realistic range: −20% to +20%

    X = np.column_stack([
        rsi, price_ma50, price_ma200, ema_ratio, macd_norm,
        change_pct, sentiment, rsi_overbought, rsi_oversold,
        volatility, momentum,
    ])

    # --- Label: BUY if certain conditions are met (replaces forward return) ---
    # Financial intuition encoded in the score:
    #   - Oversold RSI → potential bounce → BUY
    #   - Price well above MAs → overextended → SELL
    #   - Bullish EMA crossover → upward momentum → BUY
    #   - Positive MACD → BUY
    #   - High volatility → higher risk, slight SELL bias
    #   - Positive momentum → BUY
    # Calibrated noise keeps Bayes accuracy ≈ 65%, label balance ≈ 55/45.
    score = (
        + (50 - rsi)        * 0.015    # oversold → positive, overbought → negative
        + (price_ma50 - 1)  * (-4)     # well above MA50 → negative
        + (price_ma200 - 1) * (-3)     # well above MA200 → negative
        + (ema_ratio - 1)   *  5       # bullish EMA cross → positive
        + macd_norm         * 30       # positive MACD → positive
        + change_pct        * 0.04
        + sentiment         * 0.2
        + momentum          * 0.05     # positive momentum → slight positive
        + volatility        * (-0.05)  # high volatility → slight negative (risk)
        + RNG.normal(0, 1.2, n)       # calibrated noise
    )
    # Shift threshold so ~55% of samples are BUY (realistic upward market drift)
    threshold = np.percentile(score, 45)
    y = (score > threshold).astype(int)
    return X, y


def main() -> None:
    print("🔧 Generating synthetic training data (v2.0 — 11 features)…")
    X, y = generate_data(N)

    split = int(N * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    print(f"   Train: {len(X_train):,} samples (BUY rate: {y_train.mean():.2%})")
    print(f"   Test : {len(X_test):,}  samples (BUY rate: {y_test.mean():.2%})")

    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     RandomForestClassifier(
            n_estimators=200,
            max_depth=6,
            min_samples_leaf=30,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])

    print("🏋️  Fitting model…")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    prec   = precision_score(y_test, y_pred, zero_division=0)
    rec    = recall_score(y_test, y_pred, zero_division=0)

    print("\n📊 Evaluation (synthetic data):")
    print(classification_report(y_test, y_pred, target_names=["SELL", "BUY"], zero_division=0))

    joblib.dump(pipeline, MODEL_PATH)

    meta = {
        "trained_at":    datetime.now(timezone.utc).isoformat(),
        "symbols":       ["synthetic"],
        "period":        "synthetic",
        "horizon_days":  5,
        "features":      FEATURE_COLS,
        "train_samples": int(len(X_train)),
        "test_samples":  int(len(X_test)),
        "accuracy":      round(float(acc), 4),
        "precision_buy": round(float(prec), 4),
        "recall_buy":    round(float(rec), 4),
        "model_version": "2.0.0",
        "note":          "Demo model trained on synthetic data. Run train.py with yfinance for production.",
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"\n✅ Demo model saved → {MODEL_PATH}")
    print(f"✅ Metadata saved  → {META_PATH}")
    print(f"   Accuracy: {acc:.2%}  |  Precision (BUY): {prec:.2%}  |  Recall (BUY): {rec:.2%}")
    print("\n💡 For production, run: python train.py  (requires internet + yfinance)")


if __name__ == "__main__":
    main()
