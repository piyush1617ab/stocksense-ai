"""
StockSense AI — Synthetic Model Generator
==========================================
Trains a demo Random Forest classifier on synthetically generated stock
data so the FastAPI service has a working model.joblib without needing
a live internet connection or the full yfinance dataset.

This is intentionally deterministic (fixed random seed) so the output
is reproducible in CI / dev environments.

To re-generate:
  pip install -r requirements.txt
  python generate_model.py
"""

import json
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, precision_score, recall_score
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
]

RNG = np.random.default_rng(42)
N   = 40_000   # synthetic rows


def generate_data(n: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic but financially plausible training samples.

    Feature distributions mirror realistic NSE stock characteristics:
    - RSI clusters around 40–65 (neutral zone) with tails at overbought/oversold
    - price_to_ma50 / price_to_ma200 cluster near 1 with slight upward drift
    - MACD ratio near 0, slightly positive on average (markets drift upward)
    - change_pct daily returns: mean ~0.04%, std ~1.5% (Indian market approximation)
    - sentiment_score: sign of change_pct plus a bit of noise
    """
    rsi          = RNG.normal(52, 14, n).clip(0, 100)
    price_ma50   = RNG.lognormal(0.01, 0.04, n)   # ~1.01 median, right-skewed
    price_ma200  = RNG.lognormal(0.02, 0.06, n)
    ema_ratio    = RNG.lognormal(0.002, 0.008, n)  # ~1.002 median
    macd_norm    = RNG.normal(0.0005, 0.005, n)
    change_pct   = RNG.normal(0.04, 1.5, n)
    sentiment    = np.sign(change_pct) + RNG.normal(0, 0.1, n)
    sentiment    = np.clip(sentiment, -1, 1)

    X = np.column_stack([
        rsi, price_ma50, price_ma200, ema_ratio, macd_norm, change_pct, sentiment
    ])

    # --- Label: BUY if certain conditions are met (replaces forward return) ---
    # The model should learn that:
    #   - Oversold + price below MA → potential bounce → BUY
    #   - Overbought + price well above MAs → risk of pullback → SELL
    # Noise is large enough to keep Bayes accuracy ≈ 65%, label balance ≈ 55/45.
    score = (
        + (50 - rsi) * 0.015           # oversold → positive, overbought → negative
        + (price_ma50 - 1)  * (-4)     # price well above MA → negative signal
        + (price_ma200 - 1) * (-3)     # price well above 200MA → negative
        + (ema_ratio - 1)   *  5       # bullish EMA cross (ratio > 1) → positive
        + macd_norm         * 30       # positive MACD → positive
        + change_pct        * 0.04
        + sentiment         * 0.2
        + RNG.normal(0, 1.2, n)       # calibrated noise
    )
    # Shift threshold so ~55% of samples are BUY (realistic upward market drift)
    threshold = np.percentile(score, 45)
    y = (score > threshold).astype(int)
    return X, y


def main() -> None:
    print("🔧 Generating synthetic training data…")
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
    prec   = precision_score(y_test, y_pred, zero_division=0)
    rec    = recall_score(y_test, y_pred, zero_division=0)

    print("\n📊 Evaluation (synthetic data):")
    print(classification_report(y_test, y_pred, target_names=["SELL", "BUY"], zero_division=0))

    joblib.dump(pipeline, MODEL_PATH)

    meta = {
        "trained_at":    datetime.utcnow().isoformat() + "Z",
        "symbols":       ["synthetic"],
        "period":        "synthetic",
        "horizon_days":  5,
        "features":      FEATURE_COLS,
        "train_samples": int(len(X_train)),
        "test_samples":  int(len(X_test)),
        "precision_buy": round(float(prec), 4),
        "recall_buy":    round(float(rec), 4),
        "model_version": "1.0.0",
        "note":          "Demo model trained on synthetic data. Run train.py with yfinance for production.",
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"\n✅ Demo model saved → {MODEL_PATH}")
    print(f"✅ Metadata saved  → {META_PATH}")
    print(f"   Precision (BUY): {prec:.2%}  |  Recall (BUY): {rec:.2%}")
    print("\n💡 For production, run: python train.py  (requires internet + yfinance)")


if __name__ == "__main__":
    main()
