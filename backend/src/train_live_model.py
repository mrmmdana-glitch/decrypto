from pathlib import Path
import json
import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split

from feature_builder import LIVE_FEATURE_COLUMNS

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

FEATURES_PATH = DATA_DIR / "wallets_features.csv"
CLASSES_PATH = DATA_DIR / "wallets_classes.csv"

MODEL_PATH = MODELS_DIR / "btc_live_random_forest.joblib"
FEATURE_LIST_PATH = MODELS_DIR / "btc_live_feature_columns.json"
IMPORTANCE_PATH = MODELS_DIR / "btc_live_feature_importance.csv"


def main() -> None:
    os.makedirs(MODELS_DIR, exist_ok=True)

    features = pd.read_csv(FEATURES_PATH)
    classes = pd.read_csv(CLASSES_PATH)

    df = features.merge(classes, on="address")
    df.columns = df.columns.str.strip().str.replace(" ", "_")

    df = df[df["class"].isin([1, 2])].copy()
    df["class"] = df["class"].map({1: 1, 2: 0})

    missing = [c for c in LIVE_FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing expected live columns in training data: {missing}")

    X = df[LIVE_FEATURE_COLUMNS].copy()
    y = df["class"].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    illicit_f1 = f1_score(y_test, y_pred, pos_label=1)
    print(f"\nIllicit class F1-score: {illicit_f1:.4f}")

    joblib.dump(model, MODEL_PATH)

    with open(FEATURE_LIST_PATH, "w", encoding="utf-8") as f:
        json.dump(LIVE_FEATURE_COLUMNS, f, indent=2)

    fi = pd.DataFrame(
        {"feature": LIVE_FEATURE_COLUMNS, "importance": model.feature_importances_}
    ).sort_values("importance", ascending=False)
    fi.to_csv(IMPORTANCE_PATH, index=False)

    print(f"\nSaved model to: {MODEL_PATH}")
    print(f"Saved feature list to: {FEATURE_LIST_PATH}")
    print(f"Saved feature importances to: {IMPORTANCE_PATH}")


if __name__ == "__main__":
    main()