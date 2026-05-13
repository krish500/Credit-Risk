import io
import json
import math
import pickle
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from explainer import explain, heuristic_explanation
from features import engineer_features
from home_credit_csv import is_home_credit_application_train, iter_loan_applications_from_kaggle
from schemas import (
    BatchPredictionRow,
    GlobalImportancePayload,
    GlobalImportanceRow,
    LoanApplication,
    ModelInfoResponse,
    ModelMetricsPayload,
    PredictRequest,
    PredictionResponse,
    ShapFactor,
    Thresholds,
)


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "model" / "model.pkl"
EXPLAINER_PATH = ROOT / "model" / "explainer.pkl"
METRICS_PATH = ROOT / "model" / "metrics.json"
GLOBAL_IMPORTANCE_PATH = ROOT / "model" / "global_importance.json"

app = FastAPI(title="Credit Risk Scoring Engine", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_pickle(path: Path):
    if not path.exists():
        return None
    with path.open("rb") as handle:
        return pickle.load(handle)


def _load_json(path: Path):
    if not path.exists():
        return None
    with path.open(encoding="utf-8-sig") as handle:
        return json.load(handle)


MODEL = _load_pickle(MODEL_PATH)
EXPLAINER = _load_pickle(EXPLAINER_PATH)


def _mode() -> str:
    return "trained_model" if MODEL is not None else "heuristic_fallback"


def probability_to_score(probability: float) -> int:
    return int(max(300, min(850, round(850 - (probability * 450)))))


def score_to_decision(score: int, thresholds: Thresholds):
    if thresholds.deny >= thresholds.approve:
        raise ValueError("The deny threshold must be lower than approve threshold.")
    if score >= thresholds.approve:
        return "approve", "app is above the configured approval threshold."
    if score >= thresholds.deny:
        return "review", "app is between approval and denial thresholds."
    return "deny", "app is below the configured denial threshold."


def _heuristic_probability(x_row: pd.DataFrame) -> float:
    explanation = heuristic_explanation(x_row)
    logit = -2.4 + sum(explanation["shap_values"])
    return 1 / (1 + math.exp(-logit))


def _predict_one(application: LoanApplication, thresholds: Thresholds) -> PredictionResponse:
    row = pd.DataFrame([application.model_dump()])
    features = engineer_features(row)

    probability = _heuristic_probability(features) if MODEL is None else float(MODEL.predict_proba(features)[0][1])
    score = probability_to_score(probability)
    decision, reason = score_to_decision(score, thresholds)
    explanation = explain(EXPLAINER, features)

    return PredictionResponse(
        probability=round(probability, 4),
        score=score,
        decision=decision,
        decision_reason=reason,
        top_factors=[ShapFactor(**factor) for factor in explanation["top_factors"]],
        shap_base_value=float(explanation["base_value"]),
        all_shap_values=explanation["shap_values"],
        all_feature_names=explanation["feature_names"],
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": _mode(),
        "has_metrics": METRICS_PATH.exists(),
        "has_global_importance": GLOBAL_IMPORTANCE_PATH.exists(),
    }


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    metrics_raw = _load_json(METRICS_PATH)
    global_raw = _load_json(GLOBAL_IMPORTANCE_PATH)
    metrics = ModelMetricsPayload.model_validate(metrics_raw) if metrics_raw else None
    global_importance = None
    if global_raw and isinstance(global_raw.get("features"), list):
        global_importance = GlobalImportancePayload(
            method=str(global_raw.get("method", "mean_abs_shap")),
            sample_rows=int(global_raw.get("sample_rows", 0)),
            features=[GlobalImportanceRow(**row) for row in global_raw["features"]],
        )
    return ModelInfoResponse(mode=_mode(), metrics=metrics, global_importance=global_importance)


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictRequest):
    try:
        return _predict_one(request.application, request.thresholds)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/batch", response_model=list[BatchPredictionRow])
async def batch_score(
    file: UploadFile = File(...),
    approve: int = 700,
    deny: int = 580,
    max_rows: int = 500,
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")

    raw = await file.read()
    df = pd.read_csv(io.BytesIO(raw))
    thresholds = Thresholds(approve=approve, deny=deny)
    cap = min(max(1, max_rows), 5000)

    if is_home_credit_application_train(df):
        pairs = iter_loan_applications_from_kaggle(df, max_rows=cap, utilization="stable")
        if not pairs:
            raise HTTPException(
                status_code=400,
                detail="Kaggle-style CSV detected but no rows survived mapping (need income, loan amount, and standard columns).",
            )
        return [_batch_row(row_id, application, thresholds) for row_id, application in pairs]

    rows: list[BatchPredictionRow] = []
    for index, record in df.head(cap).iterrows():
        try:
            application = LoanApplication(**record.to_dict())
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Row {index}: expected demo columns (age, income, …) or a Kaggle application_train.csv. {exc}",
            ) from exc
        rows.append(_batch_row(int(index), application, thresholds))

    return rows


def _batch_row(row_id: int, application: LoanApplication, thresholds: Thresholds) -> BatchPredictionRow:
    prediction = _predict_one(application, thresholds)
    return BatchPredictionRow(row_id=row_id, **prediction.model_dump())
