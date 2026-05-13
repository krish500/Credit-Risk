from typing import List, Literal

from pydantic import BaseModel, Field


Decision = Literal["approve", "review", "deny"]

class LoanApplication(BaseModel):
    age: int = Field(..., ge=18, le=80)
    income: float = Field(..., gt=0)
    employment_years: int = Field(..., ge=0, le=60)
    education: Literal["secondary", "higher", "incomplete_higher"]
    loan_amount: float = Field(..., gt=0)
    loan_term: Literal[12, 24, 36, 48, 60]
    loan_purpose: Literal["consumer", "auto", "home", "education"]
    credit_history_years: int = Field(..., ge=0, le=60)
    existing_loans: int = Field(..., ge=0, le=20)
    previous_defaults: int = Field(..., ge=0, le=10)
    credit_utilization: float = Field(..., ge=0, le=1)
    debt_to_income: float = Field(..., ge=0, le=1.5)


class Thresholds(BaseModel):
    approve: int = Field(700, ge=300, le=850)
    deny: int = Field(580, ge=300, le=850)


class PredictRequest(BaseModel):
    application: LoanApplication
    thresholds: Thresholds = Field(default_factory=Thresholds)


class ShapFactor(BaseModel):
    feature: str
    value: float
    shap_value: float
    direction: Literal["increases_risk", "decreases_risk"]
    plain_english: str


class PredictionResponse(BaseModel):
    probability: float
    score: int
    decision: Decision
    decision_reason: str
    top_factors: List[ShapFactor]
    shap_base_value: float
    all_shap_values: List[float]
    all_feature_names: List[str]


class BatchPredictionRow(PredictionResponse):
    row_id: int


class GlobalImportanceRow(BaseModel):
    name: str
    label: str
    importance: float

class GlobalImportancePayload(BaseModel):
    method: str
    sample_rows: int
    features: List[GlobalImportanceRow]


class ModelMetricsPayload(BaseModel):
    trained_at: str | None = None
    dataset: str | None = None
    n_train: int | None = None
    n_test: int | None = None
    auc_roc: float | None = None
    gini: float | None = None
    data_limitations: List[str] | None = None

class ModelInfoResponse(BaseModel):
    mode: Literal["trained_model", "heuristic_fallback"]
    metrics: ModelMetricsPayload | None = None
    global_importance: GlobalImportancePayload | None = None
