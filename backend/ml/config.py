"""Dataset-agnostic configuration for Fake Review Detection pipeline."""

import os
from pathlib import Path
from typing import Dict, Any, Optional

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"

# Ensure directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Dataset Identification & Source File
# Switch to custom CSV file name here when dropping in a new dataset
DATASET_NAME: str = "synthetic_demo"
RAW_DATA_FILE: Path = RAW_DATA_DIR / "synthetic_reviews.csv"

# Global Random Seed (per RULES.md)
RANDOM_STATE: int = 42

# Train / Val / Test Stratified Split Ratios
SPLIT_RATIOS: Dict[str, float] = {
    "train": 0.70,
    "val": 0.15,
    "test": 0.15,
}

# Column Mapping from raw CSV headers to normalized internal column names
# Adjust this mapping for different datasets (e.g. Amazon, YelpZip, Deceptive Hotel)
COLUMN_MAP: Dict[str, str] = {
    "review_text": "review_text",
    "rating": "rating",
    "reviewer_id": "reviewer_id",
    "date": "date",
    "label": "label",
    "product_id": "product_id",
}

# Label Mapping to binary integer (1 = Fake, 0 = Genuine)
# Supports common benchmarks: 1/-1, fake/genuine, CG/OR (Computer Generated / Original), Y/N
LABEL_MAP: Dict[Any, int] = {
    # Integer and float forms
    1: 1,
    0: 0,
    -1: 0,
    1.0: 1,
    0.0: 0,
    -1.0: 0,
    # String representations
    "1": 1,
    "0": 0,
    "-1": 0,
    "fake": 1,
    "genuine": 0,
    "cg": 1,
    "or": 0,
    "y": 1,
    "n": 0,
    "yes": 1,
    "no": 0,
    "deceptive": 1,
    "truthful": 0,
    "fraud": 1,
    "authentic": 0,
    "spam": 1,
    "ham": 0,
}

# Feature Engineering Parameters
TFIDF_MAX_FEATURES: int = 5000
TFIDF_NGRAM_RANGE = (1, 2)

# Training Hyperparameter Tuning settings
# Kept fast and efficient for standard laptop execution
CV_FOLDS: int = 5
RANDOM_SEARCH_ITER: int = 4

# Mandatory Legal & Operational Disclaimer
DISCLAIMER_TEXT: str = (
    "Preliminary analytical result. Does not replace human verification or platform-level moderation."
)
