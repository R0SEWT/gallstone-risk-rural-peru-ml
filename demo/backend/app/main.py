"""FastAPI app for the gallstone rural-adaptation demo."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import predictor
from .schemas import (
    BioimpedanceRequest,
    BioimpedanceResponse,
    ExplainResponse,
    PredictRequest,
    PredictResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor.load_artifacts()
    yield


app = FastAPI(
    title="Gallstone rural-adaptation demo",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://gallstone.rosewt.dev",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": predictor.is_model_loaded(),
        "explainer_loaded": predictor.is_explainer_loaded(),
    }


@app.get("/model/info")
def model_info() -> dict:
    metrics = predictor.get_metrics()
    if metrics is None:
        raise HTTPException(status_code=404, detail="Metrics not available")
    return metrics


@app.post("/predict/rural", response_model=PredictResponse)
def predict_rural(payload: PredictRequest) -> PredictResponse:
    prob, risk = predictor.predict(payload.features)
    return PredictResponse(probability=prob, risk_level=risk)


@app.post("/explain/rural", response_model=ExplainResponse)
def explain_rural(payload: PredictRequest) -> ExplainResponse:
    shap_values, base_value = predictor.explain(payload.features)
    return ExplainResponse(shap_values=shap_values, base_value=base_value)


@app.post("/generate/bioimpedance", response_model=BioimpedanceResponse)
def generate_bioimpedance(payload: BioimpedanceRequest) -> BioimpedanceResponse:
    features = predictor.generate_bioimpedance(
        age=payload.age,
        gender=payload.gender,
        height=payload.height,
        weight=payload.weight,
        bmi=payload.bmi,
    )
    return BioimpedanceResponse(features=features)
