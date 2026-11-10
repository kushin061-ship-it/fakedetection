"""End-to-end Machine Learning Pipeline Runner.

Executes all pipeline phases in sequence:
1. Synthetic Data Generation (if dataset not present)
2. Preprocessing & Stratified Train/Val/Test Split
3. Exploratory Data Analysis (EDA)
4. Feature Engineering (Zero-Leakage Pipeline)
5. Model Training & Cross-Validation Tuning (5 Models)
6. Evaluation & Error Case Mining
7. Global SHAP Explainability Extraction
8. Association Pattern Mining & Suspicious Reviewer Profiling

All serialized models, metadata, and JSON artifacts are written to `backend/models/`.
"""

import argparse
import logging
import sys
import time
from pathlib import Path

import pandas as pd
import numpy as np

from ml.config import (
    RAW_DATA_FILE,
    PROCESSED_DATA_DIR,
    MODELS_DIR,
    RANDOM_STATE,
    DATASET_NAME,
    RANDOM_SEARCH_ITER,
)
from ml.synthetic import generate_synthetic_dataset
from ml.preprocess import load_and_preprocess_dataset, ensure_nltk_assets
from ml.eda import compute_eda_metrics
from ml.features import FullFeaturePipeline
from ml.train import train_all_models
from ml.evaluate import evaluate_all_models
from ml.explain import compute_global_shap
from ml.patterns import identify_suspicious_reviewers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml.run_pipeline")


def run_pipeline(sample_size: int = None, n_iter: int = None) -> None:
    """Execute complete ML pipeline end to end."""
    start_time = time.time()
    logger.info("=" * 70)
    logger.info("STARTING FAKE REVIEW DETECTION END-TO-END PIPELINE")
    logger.info(f"Target dataset: {DATASET_NAME}")
    if sample_size:
        logger.info(f"Using sample size: {sample_size} records")
    logger.info("=" * 70)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # Step 1: Ensure Dataset / Generate Synthetic Data
    # -------------------------------------------------------------
    if not RAW_DATA_FILE.exists() or (sample_size and sample_size < 20000 and not RAW_DATA_FILE.exists()):
        logger.info(f"Raw data file '{RAW_DATA_FILE}' not found. Generating synthetic dataset...")
        rows_to_gen = sample_size if (sample_size and sample_size > 0) else 20000
        generate_synthetic_dataset(num_rows=rows_to_gen, fake_ratio=0.18, output_path=RAW_DATA_FILE)
    else:
        logger.info(f"Using existing raw dataset at: {RAW_DATA_FILE}")

    # -------------------------------------------------------------
    # Step 2: Preprocessing and Stratified Split
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 2: Data Preprocessing and Stratified Split (70/15/15)...")
    logger.info("-" * 50)
    train_df, val_df, test_df, metadata = load_and_preprocess_dataset(
        raw_csv_path=RAW_DATA_FILE,
        dataset_name=DATASET_NAME,
    )

    if sample_size and len(train_df) + len(val_df) + len(test_df) > sample_size:
        logger.info(f"Subsampling splits to total ~{sample_size} rows for rapid turnaround...")
        train_n = int(sample_size * 0.70)
        val_n = int(sample_size * 0.15)
        test_n = int(sample_size * 0.15)
        train_df = train_df.groupby("label", group_keys=False).apply(
            lambda x: x.sample(n=min(len(x), int(train_n * len(x)/len(train_df))), random_state=RANDOM_STATE)
        ).reset_index(drop=True)
        val_df = val_df.groupby("label", group_keys=False).apply(
            lambda x: x.sample(n=min(len(x), int(val_n * len(x)/len(val_df))), random_state=RANDOM_STATE)
        ).reset_index(drop=True)
        test_df = test_df.groupby("label", group_keys=False).apply(
            lambda x: x.sample(n=min(len(x), int(test_n * len(x)/len(test_df))), random_state=RANDOM_STATE)
        ).reset_index(drop=True)
        logger.info(f"Subsampled -> Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # -------------------------------------------------------------
    # Step 3: Exploratory Data Analysis (EDA)
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 2 (cont): Computing EDA Distributions (models/eda.json)...")
    logger.info("-" * 50)
    full_df = pd.concat([train_df, val_df, test_df], ignore_index=True)
    compute_eda_metrics(full_df, dataset_name=DATASET_NAME)

    # -------------------------------------------------------------
    # Step 4: Feature Engineering (No Leakage)
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 3: Building & Fitting Zero-Leakage Feature Pipeline...")
    logger.info("-" * 50)
    feature_pipeline = FullFeaturePipeline()
    feature_pipeline.fit(train_df)
    feature_pipeline.save(MODELS_DIR / "feature_pipeline.joblib")

    logger.info("Transforming train, val, and test partitions...")
    X_train = feature_pipeline.transform(train_df)
    y_train = train_df["label"].values.astype(int)

    X_val = feature_pipeline.transform(val_df)
    y_val = val_df["label"].values.astype(int)

    X_test = feature_pipeline.transform(test_df)
    y_test = test_df["label"].values.astype(int)

    feature_names = feature_pipeline.feature_names_
    logger.info(f"Feature extraction complete. Feature matrix shape: {X_train.shape}")

    # -------------------------------------------------------------
    # Step 5: Model Training & Tuning
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 4: Training and Tuning 5 Classifiers with 5-Fold Stratified CV...")
    logger.info("-" * 50)
    search_iters = n_iter or (2 if sample_size else RANDOM_SEARCH_ITER)
    trained_models, best_model_id, timings = train_all_models(
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        feature_names=feature_names,
        n_iter=search_iters,
    )

    # -------------------------------------------------------------
    # Step 6: Test Set Evaluation & Error Extraction
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 4 (cont): Test Set Evaluation, ROC Curves & Error Case Extraction...")
    logger.info("-" * 50)
    eval_results, error_results = evaluate_all_models(
        trained_models=trained_models,
        best_model_id=best_model_id,
        X_test=X_test,
        y_test=y_test,
        test_df=test_df,
        feature_names=feature_names,
        timings=timings,
        dataset_name=DATASET_NAME,
    )

    # -------------------------------------------------------------
    # Step 7: SHAP Global Explainability
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 5: Computing Global TreeSHAP Feature Attributions...")
    logger.info("-" * 50)
    champion_estimator = trained_models[best_model_id]
    compute_global_shap(
        model=champion_estimator,
        X_sample=X_test,
        feature_names=feature_names,
        dataset_name=DATASET_NAME,
    )

    # -------------------------------------------------------------
    # Step 8: Suspicious-Pattern Mining & Reviewer Profiling
    # -------------------------------------------------------------
    logger.info("-" * 50)
    logger.info("PHASE 6: Suspicious Pattern Mining (FP-Growth/Apriori) & Reviewer Profiling...")
    logger.info("-" * 50)
    identify_suspicious_reviewers(
        df=full_df,
        dataset_name=DATASET_NAME,
        output_dir=MODELS_DIR,
    )

    total_time = round(time.time() - start_time, 2)
    logger.info("=" * 70)
    logger.info(f"PIPELINE COMPLETED SUCCESSFULLY IN {total_time}s!")
    logger.info(f"Champion Model: {best_model_id.upper()}")
    logger.info(f"Artifacts generated in: {MODELS_DIR}")
    for item in MODELS_DIR.iterdir():
        size_kb = round(item.stat().st_size / 1024, 1)
        logger.info(f"  - {item.name} ({size_kb} KB)")
    logger.info("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Run complete Fake Review ML Pipeline.")
    parser.add_argument(
        "--sample",
        type=int,
        default=None,
        help="Subsample dataset to N rows for quick test runs (e.g. --sample 3000)",
    )
    parser.add_argument(
        "--n_iter",
        type=int,
        default=None,
        help="Number of RandomizedSearchCV iterations per model",
    )
    args = parser.parse_args()
    run_pipeline(sample_size=args.sample, n_iter=args.n_iter)


if __name__ == "__main__":
    main()
