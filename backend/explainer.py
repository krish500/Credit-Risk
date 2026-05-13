import math
from typing import Any

import numpy as np
import pandas as pd

from features import FEATURE_COLUMNS


FEATURE_LABELS = {
    "age": "Age",
    "income": "Annual income",
    "employment_years": "Years employed",
    "loan_amount": "Loan amount",
    "loan_term": "Loan term",
    "credit_history_years": "Credit history length",
    "existing_loans": "Existing active loans",
    "previous_defaults": "Previous defaults",
    "credit_utilization": "Credit utilization",
    "debt_to_income": "Debt-to-income ratio",
    "loan_to_income_ratio": "Loan-to-income ratio",
    "income_per_year_employed": "Income stability",
    "is_high_risk_purpose": "High-risk loan purpose",
    "credit_age_to_loan_ratio": "Credit age vs loan term",
    "education_encoded": "Education level",
}


def explain(explainer: Any, x_row: pd.DataFrame) -> dict:
    if explainer is None:
        return heuristic_explanation(x_row)

    shap_values = explainer.shap_values(x_row)
    values = shap_values[0] if isinstance(shap_values, list) else shap_values[0]
    base_value = explainer.expected_value

    if isinstance(base_value, (list, np.ndarray)):
        base_value = float(base_value[1] if len(base_value) > 1 else base_value[0])

    return _format_explanation(float(base_value), values, x_row)


def heuristic_explanation(x_row: pd.DataFrame) -> dict:
    row = x_row.iloc[0]
    weights = {
        "age": max(0, (30 - row["age"]) * 0.04)
        + max(0, (row["age"] - 55) * 0.02)
        - max(0, min(row["age"] - 30, 15)) * 0.015,
        "income": max(-0.8, min(0.9, ((45000 - row["income"]) / 25000) * 0.6)),
        "employment_years": max(-0.45, min(0.55, (3 - row["employment_years"]) * 0.22)),
        "loan_amount": max(-0.2, min(0.35, ((row["loan_amount"] - 15000) / 30000) * 0.25)),
        "loan_term": ((row["loan_term"] - 36) / 12) * 0.06,
        "credit_history_years": max(
            -0.5,
            min(0.5, ((3 - row["credit_history_years"]) * 0.22) - (max(row["credit_history_years"] - 8, 0) * 0.025)),
        ),
        "existing_loans": 0.16 * row["existing_loans"],
        "previous_defaults": 0.9 * row["previous_defaults"],
        "credit_utilization": 2.4 * (row["credit_utilization"] - 0.35),
        "debt_to_income": 2.8 * (row["debt_to_income"] - 0.28),
        "loan_to_income_ratio": 0.9 * (row["loan_to_income_ratio"] - 0.3),
        "income_per_year_employed": 0,
        "is_high_risk_purpose": 0.28 * row["is_high_risk_purpose"],
        "credit_age_to_loan_ratio": 0,
        "education_encoded": {0: 0.08, 1: 0, 2: -0.22}.get(int(row["education_encoded"]), 0),
    }
    values = np.array([weights[column] for column in FEATURE_COLUMNS], dtype=float)
    return _format_explanation(-1.5, values, x_row)


def probability_from_logit(logit: float) -> float:
    return 1 / (1 + math.exp(-logit))


def _format_explanation(base_value: float, values: np.ndarray, x_row: pd.DataFrame) -> dict:
    factors = []
    for index, column in enumerate(FEATURE_COLUMNS):
        shap_value = float(values[index])
        raw_value = float(x_row.iloc[0][column])
        factors.append(
            {
                "feature": FEATURE_LABELS.get(column, column),
                "value": raw_value,
                "shap_value": shap_value,
                "direction": "increases_risk" if shap_value > 0 else "decreases_risk",
                "plain_english": _plain_english(column, raw_value, shap_value),
            }
        )

    factors.sort(key=lambda factor: abs(factor["shap_value"]), reverse=True)
    return {
        "base_value": base_value,
        "shap_values": [float(value) for value in values],
        "feature_names": [FEATURE_LABELS.get(column, column) for column in FEATURE_COLUMNS],
        "top_factors": factors[:5],
    }


def _plain_english(feature: str, value: float, shap_value: float) -> str:
    direction = "raises" if shap_value > 0 else "lowers"
    magnitude = "materially" if abs(shap_value) > 0.08 else "slightly"
    templates = {
        "debt_to_income": f"{'High' if value > 0.4 else 'Manageable'} debt to income ratio {magnitude} {direction} risk",
        "previous_defaults": f"{'Past defaults' if value > 0 else 'Clean default history'} {magnitude} {direction} risk",
        "credit_utilization": f"{'High' if value > 0.7 else 'Moderate'} credit utilization {magnitude} {direction} risk",
        "credit_history_years": f"{'Short' if value < 3 else 'Strong'} credit history {magnitude} {direction} risk",
        "income": f"{'Lower' if value < 35000 else 'Stronger'} income {magnitude} {direction} risk",
        "employment_years": f"{'Limited' if value < 2 else 'Stable'} employment history {magnitude} {direction} risk",
        "loan_to_income_ratio": f"Loan size relative to income {magnitude} {direction} risk",
    }
    return templates.get(feature, f"{FEATURE_LABELS.get(feature, feature)} {magnitude} {direction} risk")
