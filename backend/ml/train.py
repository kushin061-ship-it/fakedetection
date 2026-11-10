"""Model training and cross-validation comparison module.

Trains and tunes 5 classifiers:
1. Logistic Regression (baseline)
2. Multinomial Naive Bayes
3. Random Forest
4. XGBoost
5. LightGBM

Handles class imbalance with class weights.
Tunes models using Stratified 5-Fold CV and selects the best model by validation F1 score.
"""

import time
import logging
from typing import Dict, Any, Tuple, List, Optional
from pathlib import Path

import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, RandomizedSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from ml.config import RANDOM_STATE, CV_FOLDS, RANDOM_SEARCH_ITER, MODELS_DIR

logger = logging.getLogger("ml.train")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Model definitions matching frontend mock IDs and names
MODEL_SPECS = [
    {
        "id": "xgboost",
        "name": "XGBoost",
        "displayName": "XGBoost (Champion)",
        "type": "Gradient Boosted Trees",
    },
    {
        "id": "lightgbm",
        "name": "LightGBM",
        "displayName": "LightGBM",
        "type": "Gradient Boosted Trees",
    },
    {
        "id": "random_forest",
        "name": "Random Forest",
        "displayName": "Random Forest",
        "type": "Ensemble Trees",
    },
    {
        "id": "logistic_regression",
        "name": "Logistic Regression",
        "displayName": "Logistic Regression",
        "type": "Linear Model",
    },
    {
        "id": "naive_bayes",
        "name": "Naive Bayes",
        "displayName": "Multinomial Naive Bayes",
        "type": "Probabilistic Model",
    },
]


def train_and_compare_models(
    X_train,
    y_train,
    X_val,
    y_val,
    feature_names: List[str],
    cv_folds: int = CV_FOLDS,
    n_iter: int = RANDOM_SEARCH_ITER,
) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
    """Train and evaluate 5 models using Stratified 5-fold CV.

    Returns:
        (trained_models_dict, best_model_id, training_timings_dict)
    """
    trained_models: Dict[str, Any] = {}
    timings: Dict[str, float] = {}
    val_f1_scores: Dict[str, float] = {}

    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=RANDOM_STATE)

    # Calculate class weight ratio for XGBoost scale_pos_weight
    neg_count = int(np.sum(y_train == 0))
    pos_count = int(np.sum(y_train == 1))
    scale_pos_weight = float(neg_count / max(1, pos_count))

    logger.info(f"Class imbalance ratio (Neg/Pos): {scale_pos_weight:.2f}")

    # 1. XGBoost
    logger.info("Training XGBoost Classifier...")
    t0 = time.time()
    xgb_base = XGBClassifier(
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        scale_pos_weight=scale_pos_weight,
        n_jobs=-1,
    )
    xgb_params = {
        "n_estimators": [100, 150, 200],
        "max_depth": [4, 6, 8],
        "learning_rate": [0.05, 0.08, 0.12],
        "subsample": [0.8, 0.9, 1.0],
    }
    xgb_search = RandomizedSearchCV(
        xgb_base,
        xgb_params,
        n_iter=n_iter,
        cv=cv,
        scoring="f1",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    xgb_search.fit(X_train, y_train)
    trained_models["xgboost"] = xgb_search.best_estimator_
    timings["xgboost"] = round(time.time() - t0, 2)
    val_preds_xgb = trained_models["xgboost"].predict(X_val)
    val_f1_scores["xgboost"] = float(f1_score(y_val, val_preds_xgb))
    logger.info(f"XGBoost Val F1: {val_f1_scores['xgboost']:.4f} (took {timings['xgboost']}s)")

    # 2. LightGBM
    logger.info("Training LightGBM Classifier...")
    t0 = time.time()
    lgb_base = LGBMClassifier(
        random_state=RANDOM_STATE,
        class_weight="balanced",
        verbose=-1,
        n_jobs=-1,
    )
    lgb_params = {
        "n_estimators": [100, 150, 200],
        "max_depth": [4, 6, 8],
        "learning_rate": [0.05, 0.08, 0.12],
        "num_leaves": [15, 31, 63],
    }
    lgb_search = RandomizedSearchCV(
        lgb_base,
        lgb_params,
        n_iter=n_iter,
        cv=cv,
        scoring="f1",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    lgb_search.fit(X_train, y_train)
    trained_models["lightgbm"] = lgb_search.best_estimator_
    timings["lightgbm"] = round(time.time() - t0, 2)
    val_preds_lgb = trained_models["lightgbm"].predict(X_val)
    val_f1_scores["lightgbm"] = float(f1_score(y_val, val_preds_lgb))
    logger.info(f"LightGBM Val F1: {val_f1_scores['lightgbm']:.4f} (took {timings['lightgbm']}s)")

    # 3. Random Forest
    logger.info("Training Random Forest Classifier...")
    t0 = time.time()
    rf_base = RandomForestClassifier(
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=-1,
    )
    rf_params = {
        "n_estimators": [100, 150],
        "max_depth": [10, 15, 20],
        "min_samples_split": [2, 5],
    }
    rf_search = RandomizedSearchCV(
        rf_base,
        rf_params,
        n_iter=min(n_iter, 3),
        cv=cv,
        scoring="f1",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    rf_search.fit(X_train, y_train)
    trained_models["random_forest"] = rf_search.best_estimator_
    timings["random_forest"] = round(time.time() - t0, 2)
    val_preds_rf = trained_models["random_forest"].predict(X_val)
    val_f1_scores["random_forest"] = float(f1_score(y_val, val_preds_rf))
    logger.info(f"Random Forest Val F1: {val_f1_scores['random_forest']:.4f} (took {timings['random_forest']}s)")

    # 4. Logistic Regression (Baseline)
    logger.info("Training Logistic Regression (Baseline)...")
    t0 = time.time()
    lr_base = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=RANDOM_STATE,
    )
    lr_params = {"C": [0.1, 1.0, 5.0]}
    lr_search = RandomizedSearchCV(
        lr_base,
        lr_params,
        n_iter=min(n_iter, 3),
        cv=cv,
        scoring="f1",
        random_state=RANDOM_STATE,
    )
    lr_search.fit(X_train, y_train)
    trained_models["logistic_regression"] = lr_search.best_estimator_
    timings["logistic_regression"] = round(time.time() - t0, 2)
    val_preds_lr = trained_models["logistic_regression"].predict(X_val)
    val_f1_scores["logistic_regression"] = float(f1_score(y_val, val_preds_lr))
    logger.info(f"Logistic Regression Val F1: {val_f1_scores['logistic_regression']:.4f} (took {timings['logistic_regression']}s)")

    # 5. Multinomial Naive Bayes (Requires non-negative inputs)
    logger.info("Training Multinomial Naive Bayes...")
    t0 = time.time()
    from sklearn.base import BaseEstimator, TransformerMixin
    import scipy.sparse as sp

    class NonNegativeClipper(BaseEstimator, TransformerMixin):
        def fit(self, X, y=None):
            return self
        def transform(self, X):
            if sp.issparse(X):
                return X.maximum(0)
            return np.maximum(X, 0)

    nb_pipe = Pipeline([
        ("clipper", NonNegativeClipper()),
        ("nb", MultinomialNB()),
    ])
    nb_params = {"nb__alpha": [0.1, 0.5, 1.0, 2.0]}
    nb_search = RandomizedSearchCV(
        nb_pipe,
        nb_params,
        n_iter=min(n_iter, 3),
        cv=cv,
        scoring="f1",
        random_state=RANDOM_STATE,
    )
    nb_search.fit(X_train, y_train)

    trained_models["naive_bayes"] = nb_search.best_estimator_
    timings["naive_bayes"] = round(time.time() - t0, 2)
    val_preds_nb = trained_models["naive_bayes"].predict(X_val)
    val_f1_scores["naive_bayes"] = float(f1_score(y_val, val_preds_nb))
    logger.info(f"Naive Bayes Val F1: {val_f1_scores['naive_bayes']:.4f} (took {timings['naive_bayes']}s)")

    # Select champion model by validation F1
    best_model_id = max(val_f1_scores, key=val_f1_scores.get)
    logger.info(f"Champion Model: {best_model_id.upper()} with Val F1={val_f1_scores[best_model_id]:.4f}")

    return trained_models, best_model_id, timings


# Alias for pipeline compatibility
train_all_models = train_and_compare_models
