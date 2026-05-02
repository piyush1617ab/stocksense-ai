# StockSense AI — ML Prediction Service

A Python FastAPI microservice that serves Random Forest buy/sell predictions for NSE stocks. The Node.js backend proxies requests to this service via `POST /api/ml-predict`.

---

## Quick start (demo model — no internet required)

```bash
cd backend/ml

# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate a demo model trained on synthetic data
python generate_model.py

# 3. Start the prediction service
uvicorn ml_service:app --host 0.0.0.0 --port 8001
```

The service will be available at `http://localhost:8001`.

---

## Production model (trained on real NSE data)

```bash
# Download 5 years of data for 15 Nifty stocks, train, and save model
python train.py

# Or customise the stock list and look-ahead horizon:
python train.py --symbols RELIANCE.NS TCS.NS INFY.NS --period 3y --horizon 5
```

Training requires internet access. On a typical laptop it takes 2–5 minutes.

---

## API

### `GET /health`
```json
{ "status": "ok", "service": "StockSense ML Service" }
```

### `POST /predict`
Request body (all fields except `rsi`, `price`, `change_pct` are optional):
```json
{
  "symbol":          "RELIANCE",
  "rsi":             62,
  "price":           2945.60,
  "ma50":            2890.00,
  "ma200":           null,
  "ema12":           null,
  "ema26":           null,
  "change_pct":      1.1,
  "sentiment_score": 0.5
}
```
Response:
```json
{
  "signal":       "BUY",
  "confidence":   0.68,
  "probabilities": { "BUY": 0.68, "SELL": 0.32 },
  "features_used": { "rsi": 62, "price_to_ma50": 1.0192, ... },
  "model_version": "1.0.0"
}
```

---

## Features used by the model

| Feature | Description |
|---|---|
| `rsi` | Relative Strength Index (0–100) |
| `price_to_ma50` | Price ÷ 50-day SMA |
| `price_to_ma200` | Price ÷ 200-day SMA |
| `ema12_to_ema26` | 12-day EMA ÷ 26-day EMA (MACD ratio) |
| `macd_norm` | (EMA12 − EMA26) ÷ price |
| `change_pct` | Today's % change |
| `sentiment_score` | −1 to +1 (from news or sign of return) |

Missing values (`null`) are median-imputed by the sklearn pipeline.

---

## Architecture

```
Frontend (React)
    └─ POST /api/ml-predict
           │
    Node.js backend (Express, port 3001)
           └─ mlPredictor.js  ──→  POST http://localhost:8001/predict
                                        │
                               Python FastAPI (port 8001)
                                        └─ loads model.joblib
                                           └─ RandomForest.predict_proba()
```

The Node.js backend returns `{ mlAvailable: false }` if the Python service is down, allowing the frontend to fall back to rule-based analysis seamlessly.
