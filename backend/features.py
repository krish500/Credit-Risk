import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "age",
    "income",
    "employment_years",
    "loan_amount",
    "loan_term",
    "credit_history_years",
    "existing_loans",
    "previous_defaults",
    "credit_utilization",
    "debt_to_income",
    "loan_to_income_ratio",
    "income_per_year_employed",
    "is_high_risk_purpose",
    "credit_age_to_loan_ratio",
    "education_encoded",
]

EDUCATION_MAP = {
    "incomplete_higher": 0,
    "secondary": 1,
    "higher": 2,
}

PURPOSE_HIGH_RISK = {"consumer"}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["loan_to_income_ratio"] = df["loan_amount"] / (df["income"] + 1)
    df["income_per_year_employed"] = df["income"] / (df["employment_years"] + 1)
    df["credit_age_to_loan_ratio"] = df["credit_history_years"] / ((df["loan_term"] / 12) + 1)
    df["is_high_risk_purpose"] = df["loan_purpose"].apply(lambda value: 1 if value in PURPOSE_HIGH_RISK else 0)
    df["education_encoded"] = df["education"].map(EDUCATION_MAP).fillna(0)

    for column in FEATURE_COLUMNS:
        if column not in df:
            df[column] = 0

    result = df[FEATURE_COLUMNS].replace([np.inf, -np.inf], np.nan).fillna(0)
    return result.astype(float)
