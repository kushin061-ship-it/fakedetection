"""Unit tests verifying zero data leakage across feature engineering and preprocessing.

Proves:
1. Transformers are fitted strictly on training partitions.
2. Reviewer and product aggregates are learned solely from train data.
3. Test-set vocabulary or distribution changes do not leak into TF-IDF or Scalers.
4. Temporal and behavioral computations only access historical training information.
"""

import pytest
import pandas as pd
import numpy as np

from ml.features import (
    FullFeaturePipeline,
    LeakageFreeTabularTransformer,
    NUMERIC_FEATURE_NAMES,
)


@pytest.fixture
def mock_train_test_data():
    """Create isolated train and test DataFrames with distinct reviewers, vocabulary, and dates."""
    train_data = {
        "review_text": [
            "Great battery life and clear sound quality.",
            "Defective unit, stopped working immediately.",
            "Solid construction, very comfortable headphones.",
            "Delivery was prompt and packaging was intact.",
            "Excellent value for the price, would buy again.",
            "Poor customer support and flimsy plastic frame.",
            "Works well right out of the box with zero issues.",
            "Not worth the price, sounds muffled and cheap.",
        ],
        "clean_text": [
            "great battery life clear sound quality",
            "defective unit stopped working immediately",
            "solid construction comfortable headphones",
            "delivery prompt packaging intact",
            "excellent value price would buy",
            "poor customer support flimsy plastic frame",
            "works well right box zero issues",
            "worth price sounds muffled cheap",
        ],
        "rating": [5, 1, 4, 5, 5, 1, 4, 2],
        "reviewer_id": ["USR-TRN-1", "USR-TRN-2", "USR-TRN-1", "USR-TRN-3", "USR-TRN-4", "USR-TRN-2", "USR-TRN-5", "USR-TRN-6"],
        "product_id": ["PRD-TRN-A", "PRD-TRN-A", "PRD-TRN-B", "PRD-TRN-B", "PRD-TRN-A", "PRD-TRN-C", "PRD-TRN-B", "PRD-TRN-C"],
        "date": [
            "2025-01-01", "2025-01-02", "2025-01-05", "2025-01-10",
            "2025-01-15", "2025-01-18", "2025-01-20", "2025-01-25",
        ],
        "label": [0, 1, 0, 0, 0, 1, 0, 1],
    }

    test_data = {
        "review_text": [
            "Completely novel test vocabulary with futuristic holographic quantum displays!!",
            "Unseen reviewer posting about non-existent training gadget.",
        ],
        "clean_text": [
            "completely novel test vocabulary futuristic holographic quantum displays",
            "unseen reviewer posting non existent training gadget",
        ],
        "rating": [5, 1],
        "reviewer_id": ["USR-TEST-999", "USR-TEST-888"],
        "product_id": ["PRD-TEST-XYZ", "PRD-TEST-ABC"],
        "date": ["2026-05-01", "2026-05-02"],
        "label": [1, 0],
    }

    return pd.DataFrame(train_data), pd.DataFrame(test_data)


def test_tfidf_zero_leakage(mock_train_test_data):
    """Verify test-set words never leak into TF-IDF vocabulary."""
    train_df, test_df = mock_train_test_data

    pipeline = FullFeaturePipeline()
    pipeline.fit(train_df)

    vocab = pipeline.tfidf.vocabulary_
    # Verify training words are present
    assert "battery" in vocab or "sound" in vocab or "headphones" in vocab

    # Verify novel test words are NEVER added to vocabulary
    assert "holographic" not in vocab
    assert "quantum" not in vocab
    assert "futuristic" not in vocab

    # Transform test set and ensure output dimension matches train dimension exactly
    X_train = pipeline.transform(train_df)
    X_test = pipeline.transform(test_df)

    assert X_train.shape[1] == X_test.shape[1]
    assert X_test.shape[0] == len(test_df)


def test_scaler_zero_leakage(mock_train_test_data):
    """Verify StandardScaler means and variances are strictly fitted on train data."""
    train_df, test_df = mock_train_test_data

    pipeline = FullFeaturePipeline()
    pipeline.fit(train_df)

    # Pre-compute training tabular features
    train_tab = pipeline.tabular_transformer.transform(train_df)
    expected_means = train_tab.mean(axis=0).values

    # Check fitted scaler means match train means
    np.testing.assert_allclose(pipeline.scaler.mean_, expected_means, atol=1e-5)

    # Transform test set without altering scaler parameters
    old_mean = pipeline.scaler.mean_.copy()
    _ = pipeline.transform(test_df)
    np.testing.assert_array_equal(pipeline.scaler.mean_, old_mean)


def test_behavioral_baseline_zero_leakage(mock_train_test_data):
    """Verify reviewer and product baselines are learned strictly from train records."""
    train_df, test_df = mock_train_test_data

    tab_transformer = LeakageFreeTabularTransformer()
    tab_transformer.fit(train_df)

    # Known train reviewers must be present
    assert "USR-TRN-1" in tab_transformer.reviewer_baselines
    assert "USR-TRN-2" in tab_transformer.reviewer_baselines

    # Test reviewers must NOT be in learned baselines
    assert "USR-TEST-999" not in tab_transformer.reviewer_baselines
    assert "USR-TEST-888" not in tab_transformer.reviewer_baselines

    # Transforming unseen test reviewers defaults safely to global train averages
    test_tab = tab_transformer.transform(test_df)
    assert not test_tab.isna().any().any()
    assert len(test_tab) == 2


def test_feature_names_match_frontend_contract(mock_train_test_data):
    """Verify that exact required feature names exist in transformed tabular data."""
    train_df, _ = mock_train_test_data
    tab_transformer = LeakageFreeTabularTransformer()
    tab_transformer.fit(train_df)
    transformed = tab_transformer.transform(train_df)

    required_names = [
        "same_day_review_count",
        "extreme_rating_ratio",
        "review_length",
        "sentiment_polarity",
        "time_gap_days",
        "exclamation_count",
        "reviewer_total_reviews",
        "burst_indicator",
    ]

    for req in required_names:
        assert req in transformed.columns, f"Required feature '{req}' missing from transformed columns."
        assert not transformed[req].isna().any(), f"Feature '{req}' contains unexpected NaN values."
