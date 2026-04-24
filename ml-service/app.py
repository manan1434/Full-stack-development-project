"""FastAPI service that classifies expense descriptions into categories."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model.pkl"
CONFIDENCE_THRESHOLD = 0.35
FALLBACK_CATEGORY = "Other"

model_state: dict = {"pipeline": None}


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Model file not found at {MODEL_PATH}. Run `python train.py` first."
        )
    model_state["pipeline"] = joblib.load(MODEL_PATH)
    yield
    model_state["pipeline"] = None


app = FastAPI(title="Expense Categorizer", version="0.1.0", lifespan=lifespan)


class PredictRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    amount: Optional[float] = None


class PredictResponse(BaseModel):
    category: str
    confidence: float


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    pipeline = model_state["pipeline"]
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    probs = pipeline.predict_proba([req.description])[0]
    idx = int(np.argmax(probs))
    confidence = float(probs[idx])
    category = str(pipeline.classes_[idx])

    if confidence < CONFIDENCE_THRESHOLD:
        category = FALLBACK_CATEGORY

    return PredictResponse(category=category, confidence=round(confidence, 4))
