"""
StockSense AI — ML Prediction Service (v2.0)
=============================================
FastAPI microservice that loads the trained Random Forest model and
exposes a  POST /predict  endpoint consumed by the Node.js backend.

Improvements over v1.0:
  ✅ HOLD signal when confidence < 0.6 (configurable via HOLD_THRESHOLD env var)
  ✅ 11 features: adds RSI zones, volatility, momentum
  ✅ Feature importance — top-3 contributing features returned per prediction
  ✅ Human-readable explanation text per prediction
  ✅ Structured logging for all predictions and model metrics
  ✅ /metrics endpoint exposes training metadata

Start:
  uvicorn ml_service:app --host 0.0.0.0 --port 8001

Environment variables:
  MODEL_PATH      — path to model.joblib  (default: ./model.joblib)
  HOLD_THRESHOLD  — min confidence to emit BUY/SELL (default: 0.60)
"""

import json
import logging
import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Logging setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml_service")

# ─── Configuration ───────────────────────────────────────────────────────────────

MODEL_PATH     = Path(os.getenv("MODEL_PATH", Path(__file__).parent / "model.joblib"))
META_PATH      = Path(__file__).parent / "model_meta.json"
HOLD_THRESHOLD = float(os.getenv("HOLD_THRESHOLD", "0.60"))

# ─── Load model and metadata once at startup ────────────────────────────────────

try:
    _pipeline = joblib.load(MODEL_PATH)
    logger.info("ML model loaded from %s", MODEL_PATH)
except FileNotFoundError:
    raise RuntimeError(
        f"model.joblib not found at {MODEL_PATH}. "
        "Run  python generate_model.py  (demo) or  python train.py  (production)."
    )

_meta: dict = {}
if META_PATH.exists():
    _meta = json.loads(META_PATH.read_text())
    logger.info(
        "Model v%s | accuracy=%.2f%% | precision(BUY)=%.2f%% | recall(BUY)=%.2f%%",
        _meta.get("model_version", "?"),
        _meta.get("accuracy", 0) * 100,
        _meta.get("precision_buy", 0) * 100,
        _meta.get("recall_buy", 0) * 100,
    )

FEATURE_COLS = _meta.get("features", [
    "rsi", "price_to_ma50", "price_to_ma200", "ema12_to_ema26",
    "macd_norm", "change_pct", "sentiment_score",
    "rsi_overbought", "rsi_oversold", "volatility", "momentum",
])

# ─── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="StockSense ML Service",
    version="2.0.0",
    description="Random Forest buy/sell/hold signal predictor for NSE stocks",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # lock down further via nginx/API gateway in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Request / response schemas ─────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Required: rsi, price.
    Optional: all others — None values are median-imputed by the sklearn pipeline.
    """
    rsi:             float       = Field(...,  ge=0,  le=100, description="RSI (0–100)")
    price:           float       = Field(...,  gt=0,          description="Current price (₹)")
    ma50:            float | None = Field(None, gt=0,         description="50-day SMA")
    ma200:           float | None = Field(None, gt=0,         description="200-day SMA")
    ema12:           float | None = Field(None, gt=0,         description="12-day EMA")
    ema26:           float | None = Field(None, gt=0,         description="26-day EMA")
    change_pct:      float        = Field(0.0,                description="Today's % change")
    sentiment_score: float        = Field(0.0, ge=-1, le=1,   description="Sentiment (−1 to +1)")
    volatility:      float | None = Field(None, ge=0,         description="20-day rolling std of % returns")
    momentum:        float | None = Field(None,               description="10-day price rate-of-change (%)")
    symbol:          str | None   = Field(None,               description="Optional — for logging")


class TopFeature(BaseModel):
    feature:    str
    importance: float
    label:      str   # human-readable name


class PredictResponse(BaseModel):
    signal:           str          # "BUY", "SELL", or "HOLD"
    confidence:       float        # 0.0–1.0 (probability of the predicted direction)
    probabilities:    dict         # {"BUY": float, "SELL": float}
    top_features:     list[TopFeature]
    explanation:      str          # human-readable reasoning
    features_used:    dict         # computed features echoed back for transparency
    model_version:    str


# ─── Human-readable feature labels ─────────────────────────────────────────────

_FEATURE_LABELS: dict[str, str] = {
    "rsi":            "RSI (momentum)",
    "price_to_ma50":  "Price vs 50-day MA",
    "price_to_ma200": "Price vs 200-day MA",
    "ema12_to_ema26": "EMA crossover ratio",
    "macd_norm":      "MACD (normalised)",
    "change_pct":     "Today's % change",
    "sentiment_score":"News sentiment",
    "rsi_overbought": "RSI overbought zone",
    "rsi_oversold":   "RSI oversold zone",
    "volatility":     "Volatility (20-day)",
    "momentum":       "Momentum (10-day ROC)",
}


# ─── Feature engineering ────────────────────────────────────────────────────────

def build_features(req: PredictRequest) -> np.ndarray:
    """
    Convert the raw request into the feature vector the model expects.
    None values become np.nan — the pipeline's SimpleImputer handles them.
    rsi_overbought / rsi_oversold are always derived from req.rsi.
    """
    price = req.price

    price_to_ma50  = (price / req.ma50)  if req.ma50  else np.nan
    price_to_ma200 = (price / req.ma200) if req.ma200 else np.nan
    ema12_to_ema26 = (req.ema12 / req.ema26)           if (req.ema12 and req.ema26) else np.nan
    macd_norm      = ((req.ema12 - req.ema26) / price) if (req.ema12 and req.ema26) else np.nan

    rsi_overbought = 1.0 if req.rsi > 70 else 0.0
    rsi_oversold   = 1.0 if req.rsi < 30 else 0.0
    volatility     = req.volatility if req.volatility is not None else np.nan
    momentum       = req.momentum   if req.momentum   is not None else np.nan

    # Build in the same order as FEATURE_COLS
    feature_map: dict[str, float] = {
        "rsi":            req.rsi,
        "price_to_ma50":  price_to_ma50,
        "price_to_ma200": price_to_ma200,
        "ema12_to_ema26": ema12_to_ema26,
        "macd_norm":      macd_norm,
        "change_pct":     req.change_pct,
        "sentiment_score":req.sentiment_score,
        "rsi_overbought": rsi_overbought,
        "rsi_oversold":   rsi_oversold,
        "volatility":     volatility,
        "momentum":       momentum,
    }
    return np.array([[feature_map.get(col, np.nan) for col in FEATURE_COLS]]), feature_map


# ─── Explanation text builder ────────────────────────────────────────────────────

def build_explanation(
    req: PredictRequest,
    signal: str,
    confidence: float,
    p_buy: float,
    p_sell: float,
    top_features: list[TopFeature],
) -> str:
    parts: list[str] = []

    if signal == "HOLD":
        parts.append(
            f"No strong edge detected — BUY probability {p_buy:.0%} vs "
            f"SELL {p_sell:.0%} (both below the {HOLD_THRESHOLD:.0%} confidence threshold)."
        )
        parts.append("Consider waiting for a clearer signal before acting.")
    elif signal == "BUY":
        strength = "strong" if confidence >= 0.75 else "moderate"
        parts.append(f"Model signals BUY with {strength} confidence ({confidence:.0%}).")
    else:  # SELL
        strength = "strong" if confidence >= 0.75 else "moderate"
        parts.append(f"Model signals SELL (caution) with {strength} confidence ({confidence:.0%}).")

    # RSI zone reasoning
    if req.rsi < 30:
        parts.append("RSI is in the oversold zone — potential upward reversal.")
    elif req.rsi > 70:
        parts.append("RSI is overbought — elevated pullback risk.")
    else:
        parts.append(f"RSI is neutral at {req.rsi:.0f}.")

    # MA position reasoning
    if req.ma50 is not None:
        pos = "above" if req.price > req.ma50 else "below"
        parts.append(f"Price is {pos} the 50-day moving average.")

    # Top feature reasoning
    if top_features:
        label = top_features[0].label
        parts.append(f"Most influential factor: {label}.")

    return " ".join(parts)


# ─── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":          "ok",
        "service":         "StockSense ML Service",
        "model_version":   _meta.get("model_version", "unknown"),
        "hold_threshold":  HOLD_THRESHOLD,
        "feature_count":   len(FEATURE_COLS),
    }


@app.get("/metrics")
def metrics():
    """Return training metadata and model performance metrics."""
    return _meta if _meta else {"note": "model_meta.json not found"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        X, feature_map = build_features(req)

        proba  = _pipeline.predict_proba(X)[0]
        labels = _pipeline.classes_

        idx_sell = int(np.where(labels == 0)[0][0])
        idx_buy  = int(np.where(labels == 1)[0][0])
        p_buy    = float(proba[idx_buy])
        p_sell   = float(proba[idx_sell])

        # ── HOLD logic ─────────────────────────────────────────────────────────
        best_confidence = max(p_buy, p_sell)
        if best_confidence < HOLD_THRESHOLD:
            signal     = "HOLD"
            confidence = best_confidence
        else:
            signal     = "BUY" if p_buy >= p_sell else "SELL"
            confidence = p_buy if signal == "BUY" else p_sell

        # ── Feature importance (top 3) ─────────────────────────────────────────
        clf         = _pipeline.named_steps["clf"]
        importances = clf.feature_importances_
        ranked      = sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1], reverse=True)
        top_features = [
            TopFeature(
                feature=feat,
                importance=round(float(imp), 4),
                label=_FEATURE_LABELS.get(feat, feat.replace("_", " ").title()),
            )
            for feat, imp in ranked[:3]
        ]

        # ── Explanation text ───────────────────────────────────────────────────
        explanation = build_explanation(req, signal, confidence, p_buy, p_sell, top_features)

        # ── Features used (for transparency) ──────────────────────────────────
        features_used = {
            col: (None if (v is np.nan or (isinstance(v, float) and np.isnan(v))) else round(float(v), 5))
            for col, v in feature_map.items()
        }

        # ── Logging ────────────────────────────────────────────────────────────
        logger.info(
            "predict symbol=%s signal=%s confidence=%.3f p_buy=%.3f p_sell=%.3f top=%s",
            req.symbol or "unknown",
            signal,
            confidence,
            p_buy,
            p_sell,
            top_features[0].feature if top_features else "n/a",
        )

        return PredictResponse(
            signal=signal,
            confidence=round(confidence, 4),
            probabilities={"BUY": round(p_buy, 4), "SELL": round(p_sell, 4)},
            top_features=top_features,
            explanation=explanation,
            features_used=features_used,
            model_version=_meta.get("model_version", "2.0.0"),
        )

    except Exception as exc:
        logger.error("Prediction failed for symbol=%s: %s", req.symbol or "unknown", exc)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
