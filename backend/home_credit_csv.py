"""
- The Kaggle file does not have the exact credit utilization field my demo needs.
  So I make one up in a consistent way:
  - during training, I generate fake utilization numbers the same way every time: utilization='train'
  - in batch uploads, each applicant gets their own fake number that stays the same if uploaded again: utilization='stable'
"""

from __future__ import annotations

from typing import Literal

import numpy as np
import pandas as pd

from schemas import LoanApplication


def is_home_credit_application_train(df: pd.DataFrame) -> bool:
    cols = {str(c).strip() for c in df.columns}
    return "DAYS_BIRTH" in cols and "AMT_INCOME_TOTAL" in cols and "AMT_CREDIT" in cols


def transform_kaggle_application_train(
    df: pd.DataFrame,
    *,
    utilization: Literal["train", "stable"] = "stable",
) -> pd.DataFrame:
    w = df.copy()
    w.columns = w.columns.str.strip()

    id_for_rng = w["SK_ID_CURR"].to_numpy() if "SK_ID_CURR" in w.columns else np.arange(len(w), dtype=np.int64)

    w = w.rename(
        columns={
            "DAYS_BIRTH": "age_days",
            "AMT_INCOME_TOTAL": "income",
            "DAYS_EMPLOYED": "employment_days",
            "AMT_CREDIT": "loan_amount",
            "AMT_ANNUITY": "annuity",
            "AMT_REQ_CREDIT_BUREAU_YEAR": "bureau_requests_year",
            "DEF_30_CNT_SOCIAL_CIRCLE": "default_history_proxy",
            "EXT_SOURCE_1": "external_score_1",
            "EXT_SOURCE_2": "external_score_2",
            "EXT_SOURCE_3": "external_score_3",
            "NAME_EDUCATION_TYPE": "education",
            "TARGET": "target",
        }
    )

    w["loan_amount"] = w["loan_amount"] / 10
    if "annuity" in w.columns:
        w["annuity"] = w["annuity"] / 10

    w["age"] = (-w["age_days"] / 365).clip(18, 80).astype(int)
    w["employment_years"] = (-w["employment_days"].clip(upper=0) / 365).clip(0, 60).astype(int)
    w["loan_term"] = 36
    w["credit_history_years"] = (w["age"] - 18).clip(lower=0).astype(int)
    if "default_history_proxy" in w.columns:
        w["previous_defaults"] = w["default_history_proxy"].fillna(0).clip(0, 10).astype(int)
    else:
        w["previous_defaults"] = 0

    if "annuity" in w.columns:
        w["debt_to_income"] = (w["annuity"] / (w["income"] / 12 + 1)).clip(0, 1.5)
    else:
        w["debt_to_income"] = ((w["loan_amount"] * 0.03) / (w["income"] / 12 + 1)).clip(0, 1.5)
    if "bureau_requests_year" in w.columns:
        w["existing_loans"] = w["bureau_requests_year"].fillna(0).clip(lower=0, upper=20).astype(int)
    else:
        w["existing_loans"] = 0

    n = len(w)
    if utilization == "train":
        noise = np.random.default_rng(42).normal(0, 0.08, n)
    else:
        noise = np.empty(n, dtype=float)
        for idx in range(n):
            sk = int(id_for_rng[idx]) if np.isfinite(id_for_rng[idx]) else idx
            seed = (42 + abs(hash((sk, idx)))) % (2**32 - 1)
            noise[idx] = float(np.random.default_rng(seed).normal(0, 0.08))

    behavior_utilization = (
        0.25 + 0.08 * w["existing_loans"] + 0.12 * w["previous_defaults"] + 0.25 * w["debt_to_income"] + noise
    ).clip(0.05, 0.95)
    external_scores = [column for column in ["external_score_1", "external_score_2", "external_score_3"] if column in w.columns]
    if external_scores:
        external_utilization = (1 - w[external_scores].mean(axis=1)).fillna(0.5).clip(0.1, 0.9)
        w["credit_utilization"] = (0.55 * external_utilization + 0.45 * behavior_utilization).clip(0.05, 0.95)
    else:
        w["credit_utilization"] = behavior_utilization
    w["education"] = (
        w["education"]
        .map(
            {
                "Higher education": "higher",
                "Secondary / secondary special": "secondary",
                "Incomplete higher": "incomplete_higher",
                "Lower secondary": "secondary",
            }
        )
        .fillna("secondary")
    )
    w["loan_purpose"] = "consumer"

    subset = ["income", "loan_amount"]
    if "target" in w.columns:
        subset.append("target")
    return w.dropna(subset=subset)


def iter_loan_applications_from_kaggle(
    df: pd.DataFrame,
    *,
    max_rows: int,
    utilization: Literal["train", "stable"] = "stable",
) -> list[tuple[int, LoanApplication]]:
    """Up to max_rows from the top of the file after transform + dropna."""
    sliced = df.head(max_rows).copy()
    transformed = transform_kaggle_application_train(sliced, utilization=utilization)
    out: list[tuple[int, LoanApplication]] = []
    for pos, (_, row) in enumerate(transformed.iterrows()):
        if "SK_ID_CURR" in row.index and pd.notna(row["SK_ID_CURR"]):
            row_id = int(row["SK_ID_CURR"])
        else:
            row_id = pos
        app = LoanApplication(
            age=int(row["age"]),
            income=float(row["income"]),
            employment_years=int(row["employment_years"]),
            education=str(row["education"]),
            loan_amount=float(row["loan_amount"]),
            loan_term=int(row["loan_term"]),
            loan_purpose=str(row["loan_purpose"]),
            credit_history_years=int(row["credit_history_years"]),
            existing_loans=int(row["existing_loans"]),
            previous_defaults=int(row["previous_defaults"]),
            credit_utilization=float(row["credit_utilization"]),
            debt_to_income=float(row["debt_to_income"]),
        )
        out.append((row_id, app))
    return out
