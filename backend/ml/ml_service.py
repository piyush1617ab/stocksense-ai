"""
StockSense AI — ML Prediction Service
======================================
FastAPI microservice that loads the trained Random Forest model and
exposes a  POST /predict  endpoint consumed by the Node.js backend.

Start:
  uvicorn ml_service:app --host 0.0.0.0 --port 8001

Environment variables:
  MODEL_PATH  — path to model.joblib  (default: ./model.joblib)
  PORT        — port to listen on      (default: 8001, overridden by uvicorn arg)
"""

import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Load model once at startup ────────────────────────────────────────────────

MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).parent / "model.joblib"))

try:
    _pipeline = joblib.load(MODEL_PATH)
    print(f"✅ ML model loaded from {MODEL_PATH}")
except FileNotFoundError:
    raise RuntimeError(
        f"model.joblib not found at {MODEL_PATH}. "
        "Run  python generate_model.py  (demo) or  python train.py  (production)."
    )

FEATURE_COLS = [
    "rsi",
    "price_to_ma50",
    "price_to_ma200",
    "ema12_to_ema26",
    "macd_norm",
    "change_pct",
    "sentiment_score",
]

# ─── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="StockSense ML Service",
    version="1.0.0",
    description="Random Forest buy/sell signal predictor for NSE stocks",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # locked down further in production via nginx/API gateway
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Request / response schemas ─────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    All fields except rsi and change_pct are optional.
    Missing values are median-imputed by the sklearn pipeline.
    """
    rsi:              float = Field(..., ge=0, le=100, description="RSI (0–100)")
    price:            float = Field(..., gt=0,          description="Current price (₹)")
    ma50:             float | None = Field(None, gt=0,  description="50-day SMA")
    ma200:            float | None = Field(None, gt=0,  description="200-day SMA")
    ema12:            float | None = Field(None, gt=0,  description="12-day EMA")
    ema26:            float | None = Field(None, gt=0,  description="26-day EMA")
    change_pct:       float        = Field(0.0,          description="Today's % change")
    sentiment_score:  float        = Field(0.0, ge=-1, le=1, description="Sentiment (−1 to +1)")
    symbol:           str | None   = Field(None,         description="Optional — for logging")


class PredictResponse(BaseModel):
    signal:           str          # "BUY" or "SELL"
    confidence:       float        # 0.0–1.0 (probability of the predicted class)
    probabilities:    dict         # {"BUY": float, "SELL": float}
    features_used:    dict         # echo back computed features for transparency
    model_version:    str


# ─── Feature engineering ────────────────────────────────────────────────────────

def build_features(req: PredictRequest) -> np.ndarray:
    """
    Convert the raw request into the 7 normalised features the model expects.
    None values become np.nan — the pipeline's SimpleImputer handles them.
    """
    price = req.price

    price_to_ma50   = (price / req.ma50)  if req.ma50  else np.nan
    price_to_ma200  = (price / req.ma200) if req.ma200 else np.nan

    ema12_to_ema26 = (req.ema12 / req.ema26) if (req.ema12 and req.ema26) else np.nan
    macd_norm      = ((req.ema12 - req.ema26) / price) if (req.ema12 and req.ema26) else np.nan

    return np.array([[
        req.rsi,
        price_to_ma50,
        price_to_ma200,
        ema12_to_ema26,
        macd_norm,
        req.change_pct,
        req.sentiment_score,
    ]])


# ─── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "StockSense ML Service", "model": str(MODEL_PATH)}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        X = build_features(req)
        proba  = _pipeline.predict_proba(X)[0]   # [P(SELL), P(BUY)]
        labels = _pipeline.classes_              # [0, 1]

        # Map class indices → BUY/SELL
        idx_sell = int(np.where(labels == 0)[0][0])
        idx_buy  = int(np.where(labels == 1)[0][0])

        p_buy  = float(proba[idx_buy])
        p_sell = float(proba[idx_sell])

        signal     = "BUY" if p_buy >= p_sell else "SELL"
        confidence = p_buy if signal == "BUY" else p_sell

        features_used = {
            col: (None if np.isnan(v) else round(float(v), 5))
            for col, v in zip(FEATURE_COLS, X[0])
        }

        return PredictResponse(
            signal=signal,
            confidence=round(confidence, 4),
            probabilities={"BUY": round(p_buy, 4), "SELL": round(p_sell, 4)},
            features_used=features_used,
            model_version="1.0.0",
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
