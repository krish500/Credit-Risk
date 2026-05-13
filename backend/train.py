import json
import pickle
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from explainer import FEATURE_LABELS
from features import FEATURE_COLUMNS, engineer_features
from home_credit_csv import transform_kaggle_application_train


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "application_train.csv"
MODEL_DIR = ROOT / "model"

def load_home_credit() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError("Put the Kaggle application_train.csv in backend/data before training.")

    df = pd.read_csv(DATA_PATH)
    return transform_kaggle_application_train(df, utilization="train")

def main() -> None:
    df = load_home_credit()
    x = engineer_features(df)
    y = df["target"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=(y_train == 0).sum() / max((y_train == 1).sum(), 1),
        monotone_constraints=(-1, -1, -1, 1, 1, -1, 1, 1, 1, 1, 1, -1, 1, -1, -1),
        eval_metric="auc",
        random_state=42,
    )
    model.fit(x_train, y_train, eval_set=[(x_test, y_test)], verbose=50)

    probability = model.predict_proba(x_test)[:, 1]
    auc = roc_auc_score(y_test, probability)
    print(f"AUC-ROC: {auc:.4f} | Gini: {(2 * auc - 1):.4f}")

    explainer = shap.TreeExplainer(model)
    MODEL_DIR.mkdir(exist_ok=True)
    with (MODEL_DIR / "model.pkl").open("wb") as handle:
        pickle.dump(model, handle)
    with (MODEL_DIR / "explainer.pkl").open("wb") as handle:
        pickle.dump(explainer, handle)

    gini = float(2 * auc - 1)
    sample_n = min(2000, len(x_test))
    x_sample = x_test.sample(n=sample_n, random_state=42)
    raw_shap = explainer.shap_values(x_sample)
    if isinstance(raw_shap, list):
        shap_matrix = np.asarray(raw_shap[1])
    else:
        shap_matrix = np.asarray(raw_shap)
    mean_abs = np.abs(shap_matrix).mean(axis=0)
    max_m = float(mean_abs.max()) or 1.0
    global_rows = []
    for column, importance in zip(FEATURE_COLUMNS, mean_abs):
        global_rows.append(
            {
                "name": column,
                "label": FEATURE_LABELS.get(column, column),
                "importance": round(100 * float(importance) / max_m, 2),
            }
        )
    global_rows.sort(key=lambda row: row["importance"], reverse=True)

    metrics_payload = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": "Kaggle Home Credit Default Risk - application_train.csv",
        "n_train": int(len(x_train)),
        "n_test": int(len(x_test)),
        "auc_roc": round(float(auc), 4),
        "gini": round(gini, 4),
        "data_limitations": [
            "Only a subset of Home Credit columns is used; multiple form fields are renamed, derived, or proxied for this demo pipeline.",
            "credit_utilization is a blended proxy from external scores, DTI, credit requests, prior default proxy, and stable noise.",
            "previous_defaults is mapped from DEF_30_CNT_SOCIAL_CIRCLE as a non target proxy. It isn't copied from the TARGET label.",
            "existing_loans is mapped from yearly credit bureau request count as a pressure proxy.",
            "debt_to_income uses AMT_ANNUITY over monthly income when AMT_ANNUITY is present.",
            "Monotonic constraints keep obvious demo inputs pointed in the expected direction, like higher DTI raising risk.",
            "loan_purpose and loan_term are partially defaulted for alignment for the UI",
        ],
    }
    with (MODEL_DIR / "metrics.json").open("w", encoding="utf-8") as handle:
        json.dump(metrics_payload, handle, indent=2)
        handle.write("\n")
    with (MODEL_DIR / "global_importance.json").open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "method": "mean_abs_shap",
                "sample_rows": sample_n,
                "features": global_rows,
            },
            handle,
            indent=2,
        )
        handle.write("\n")


if __name__ == "__main__":
    main()
