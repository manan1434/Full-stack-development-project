# ML Service — Expense Categorizer

FastAPI microservice that classifies expense descriptions into one of 8 categories:
**Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other**.

Model: `TfidfVectorizer` + `LogisticRegression` pipeline, trained on a small seed dataset (~200 rows).

## Setup

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Train

```bash
python train.py
```

This writes `model.pkl` alongside `app.py` and prints held-out accuracy.

## Run

```bash
uvicorn app:app --reload --port 8000
```

## Endpoints

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /predict`

Request:
```json
{ "description": "Uber ride home", "amount": 250 }
```

Response:
```json
{ "category": "Transport", "confidence": 0.87 }
```

If the classifier's top-class confidence is below `0.35`, the response falls back to `"Other"`.

## Smoke test

```bash
curl -s http://localhost:8000/health
curl -s -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"description":"Zomato dinner"}'
```
