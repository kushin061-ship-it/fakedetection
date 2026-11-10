"""Preprocessing and data ingestion pipeline for Fake Review Detection.

Handles dataset-agnostic loading, schema mapping, NLTK asset downloading,
text normalization, missing value handling, and leakage-safe 70/15/15 stratified splitting.
"""

import re
import json
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

from ml.config import (
    RAW_DATA_FILE,
    PROCESSED_DATA_DIR,
    COLUMN_MAP,
    LABEL_MAP,
    SPLIT_RATIOS,
    RANDOM_STATE,
    DATASET_NAME,
)

logger = logging.getLogger("ml.preprocess")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def ensure_nltk_assets() -> None:
    """Download required NLTK tokenizers, stopwords, and lemmatizers automatically."""
    try:
        import nltk
        assets = ["punkt", "punkt_tab", "stopwords", "wordnet"]
        for asset in assets:
            try:
                nltk.download(asset, quiet=True)
            except Exception as e:
                logger.warning(f"Could not download NLTK asset '{asset}': {e}")
    except ImportError:
        logger.warning("NLTK not yet installed; skipping asset download.")


def clean_text_content(text: str) -> str:
    """Normalize and clean raw review text for NLP feature extraction.

    Preserves semantic words while stripping URLs, email addresses, and excessive whitespace.
    """
    if not isinstance(text, str):
        return ""

    # Lowercase
    cleaned = text.lower()
    # Remove URLs
    cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned)
    # Remove email addresses
    cleaned = re.sub(r"\S+@\S+", " ", cleaned)
    # Remove HTML tags
    cleaned = re.sub(r"<.*?>", " ", cleaned)
    # Retain alphabetic tokens and basic punctuation
    cleaned = re.sub(r"[^a-zA-Z\s]", " ", cleaned)
    # Collapse multiple whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned


def load_and_preprocess_dataset(
    raw_csv_path: Optional[Path] = None,
    dataset_name: str = DATASET_NAME,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """Load raw dataset, standardize schema, clean text, and perform stratified 70/15/15 split.

    Returns:
        (train_df, val_df, test_df, metadata_dict)
    """
    ensure_nltk_assets()
    csv_file = raw_csv_path or RAW_DATA_FILE

    if not csv_file.exists():
        raise FileNotFoundError(
            f"Raw dataset file not found at '{csv_file}'. "
            f"Run 'python -m ml.synthetic' or place your CSV at '{csv_file}'."
        )

    logger.info(f"Loading raw dataset from {csv_file}...")
    df = pd.read_csv(csv_file, low_memory=False)
    logger.info(f"Loaded {len(df)} initial rows from {csv_file.name}.")

    # 1. Map columns according to COLUMN_MAP
    rename_dict = {}
    for standard_col, source_col in COLUMN_MAP.items():
        if source_col in df.columns:
            rename_dict[source_col] = standard_col

    df = df.rename(columns=rename_dict)

    # 2. Check essential columns
    if "review_text" not in df.columns:
        raise ValueError(
            f"Required column 'review_text' (mapped from '{COLUMN_MAP.get('review_text')}') "
            f"not found in dataset columns: {list(df.columns)}"
        )
    if "label" not in df.columns:
        raise ValueError(
            f"Required column 'label' (mapped from '{COLUMN_MAP.get('label')}') "
            f"not found in dataset columns: {list(df.columns)}"
        )

    # Detect which feature domains are supported
    has_reviewer = "reviewer_id" in df.columns and df["reviewer_id"].dropna().nunique() > 1
    has_date = "date" in df.columns and df["date"].dropna().nunique() > 1
    has_product = "product_id" in df.columns and df["product_id"].dropna().nunique() > 1

    enabled_groups = ["textual"]
    if has_reviewer:
        enabled_groups.append("behavioral")
    else:
        logger.warning("No valid 'reviewer_id' column found: BEHAVIORAL features disabled (text-only mode).")

    if has_date:
        enabled_groups.append("temporal")
    else:
        logger.warning("No valid 'date' column found: TEMPORAL features disabled.")

    # 3. Clean and map target labels
    df = df.dropna(subset=["review_text", "label"]).copy()
    df["review_text"] = df["review_text"].astype(str)

    # Map labels to 1 (Fake) and 0 (Genuine)
    def map_label(val: Any) -> Optional[int]:
        if val in LABEL_MAP:
            return LABEL_MAP[val]
        str_val = str(val).strip().lower()
        if str_val in LABEL_MAP:
            return LABEL_MAP[str_val]
        try:
            float_val = float(val)
            if float_val in LABEL_MAP:
                return LABEL_MAP[float_val]
        except (ValueError, TypeError):
            pass
        return None

    df["label"] = df["label"].apply(map_label)
    unmapped_count = df["label"].isna().sum()
    if unmapped_count > 0:
        logger.warning(f"Dropping {unmapped_count} rows with unrecognized label values.")
        df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)

    # 4. Handle rating
    if "rating" in df.columns:
        df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(5).astype(int)
        df["rating"] = df["rating"].clip(1, 5)
    else:
        df["rating"] = 5

    # 5. Handle date parsing
    if has_date:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        # Fill missing dates with median or start date
        median_date = df["date"].dropna().median() if not df["date"].dropna().empty else pd.Timestamp("2025-01-01")
        df["date"] = df["date"].fillna(median_date)
    else:
        df["date"] = pd.Timestamp("2025-01-01")

    # 6. Handle reviewer_id and product_id
    if not has_reviewer:
        df["reviewer_id"] = "ANON_REVIEWER"
    else:
        df["reviewer_id"] = df["reviewer_id"].astype(str).fillna("ANON_REVIEWER")

    if not has_product:
        df["product_id"] = "PRD-GENERAL"
    else:
        df["product_id"] = df["product_id"].astype(str).fillna("PRD-GENERAL")

    # 7. Drop duplicate text for same reviewer
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["reviewer_id", "review_text"])
    logger.info(f"Removed {before_dedup - len(df)} duplicate reviews ({len(df)} remaining).")

    # 8. Create cleaned text column
    logger.info("Normalizing and cleaning review text content...")
    df["clean_text"] = df["review_text"].apply(clean_text_content)

    # Filter out empty texts
    df = df[df["clean_text"].str.strip().str.len() > 0].copy()

    # 9. Compute class distribution
    class_counts = df["label"].value_counts().to_dict()
    fake_count = class_counts.get(1, 0)
    genuine_count = class_counts.get(0, 0)
    total_valid = len(df)
    fake_pct = round((fake_count / total_valid) * 100, 2)
    genuine_pct = round((genuine_count / total_valid) * 100, 2)

    logger.info(
        f"Class Distribution: Fake={fake_count} ({fake_pct}%), "
        f"Genuine={genuine_count} ({genuine_pct}%) [Total={total_valid}]"
    )

    # 10. Leakage-Safe Stratified 70/15/15 Split BEFORE Any Transformer Fitting
    train_ratio = SPLIT_RATIOS.get("train", 0.70)
    val_ratio = SPLIT_RATIOS.get("val", 0.15)
    test_ratio = SPLIT_RATIOS.get("test", 0.15)

    # Split train vs temp (val + test)
    temp_ratio = val_ratio + test_ratio
    train_df, temp_df = train_test_split(
        df,
        test_size=temp_ratio,
        stratify=df["label"],
        random_state=RANDOM_STATE,
    )

    # Split temp into val and test
    relative_val_ratio = val_ratio / temp_ratio
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - relative_val_ratio),
        stratify=temp_df["label"],
        random_state=RANDOM_STATE,
    )

    # Reset indices
    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    # Save to data/processed
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    train_path = PROCESSED_DATA_DIR / "train.csv"
    val_path = PROCESSED_DATA_DIR / "val.csv"
    test_path = PROCESSED_DATA_DIR / "test.csv"
    meta_path = PROCESSED_DATA_DIR / "metadata.json"

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    metadata: Dict[str, Any] = {
        "dataset_name": dataset_name,
        "total_rows": total_valid,
        "train_rows": len(train_df),
        "val_rows": len(val_df),
        "test_rows": len(test_df),
        "fake_count": fake_count,
        "genuine_count": genuine_count,
        "fake_percentage": fake_pct,
        "genuine_percentage": genuine_pct,
        "enabled_feature_groups": enabled_groups,
        "has_reviewer_id": has_reviewer,
        "has_date": has_date,
        "has_product_id": has_product,
        "split_ratios": {"train": train_ratio, "val": val_ratio, "test": test_ratio},
        "random_state": RANDOM_STATE,
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, default=str)

    logger.info(
        f"Splits saved -> Train: {len(train_df)}, Val: {len(val_df)}, "
        f"Test: {len(test_df)} to {PROCESSED_DATA_DIR}"
    )

    return train_df, val_df, test_df, metadata


if __name__ == "__main__":
    load_and_preprocess_dataset()
