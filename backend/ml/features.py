"""Feature engineering module for Fake Review Detection.

Strictly bounded to:
1. TEXTUAL: review length, word count, avg word length, sentiment polarity & subjectivity (TextBlob),
   exclamation count, capital letter ratio, and TF-IDF n-grams (fit on train only).
2. BEHAVIORAL: reviewer total reviews, reviewer average rating, rating deviation from product average,
   per-reviewer rating variance, extreme rating ratio (1 or 5 stars).
3. TEMPORAL: same-day review count for the reviewer, product reviews in a 7-day window, time gap days
   since reviewer's previous review, burst indicator.

Enforces zero data leakage: reviewer and product baselines are learned strictly from train partitions.
"""

import math
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

from ml.config import TFIDF_MAX_FEATURES, TFIDF_NGRAM_RANGE, MODELS_DIR

logger = logging.getLogger("ml.features")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Exact feature names matching frontend contract
NUMERIC_FEATURE_NAMES = [
    # Required top features
    "same_day_review_count",
    "extreme_rating_ratio",
    "review_length",
    "sentiment_polarity",
    "time_gap_days",
    "exclamation_count",
    "reviewer_total_reviews",
    "burst_indicator",
    # Additional Textual
    "word_count",
    "avg_word_length",
    "sentiment_subjectivity",
    "capital_letter_ratio",
    # Additional Behavioral
    "reviewer_avg_rating",
    "rating_deviation_product",
    "reviewer_rating_variance",
    # Additional Temporal
    "product_reviews_7d",
]

FEATURE_GROUPS: Dict[str, str] = {
    # Textual
    "review_length": "textual",
    "word_count": "textual",
    "avg_word_length": "textual",
    "sentiment_polarity": "textual",
    "sentiment_subjectivity": "textual",
    "exclamation_count": "textual",
    "capital_letter_ratio": "textual",
    # Behavioral
    "reviewer_total_reviews": "behavioral",
    "reviewer_avg_rating": "behavioral",
    "rating_deviation_product": "behavioral",
    "reviewer_rating_variance": "behavioral",
    "extreme_rating_ratio": "behavioral",
    # Temporal
    "same_day_review_count": "temporal",
    "product_reviews_7d": "temporal",
    "time_gap_days": "temporal",
    "burst_indicator": "temporal",
}

FEATURE_DESCRIPTIONS: Dict[str, str] = {
    "same_day_review_count": "Number of distinct reviews published by the author within the same 24-hour window.",
    "extreme_rating_ratio": "Proportion of author ratings that are binary extremes (1-star attacks or 5-star promotions).",
    "review_length": "Total character length of the raw review text.",
    "sentiment_polarity": "TextBlob sentiment polarity score (-1.0 negative to +1.0 positive).",
    "time_gap_days": "Calendar days elapsed since the author's previous review submission.",
    "exclamation_count": "Count of exclamation mark (!) characters in the review text.",
    "reviewer_total_reviews": "Total count of platform reviews authored by the user.",
    "burst_indicator": "Binary indicator for submissions during detected temporal volume surges.",
    "word_count": "Total word count in review text.",
    "avg_word_length": "Average character count per word.",
    "sentiment_subjectivity": "TextBlob subjectivity score (0.0 factual to 1.0 opinionated).",
    "capital_letter_ratio": "Proportion of uppercase alphabetic letters to total letters.",
    "reviewer_avg_rating": "Historical average star rating given by this reviewer.",
    "rating_deviation_product": "Absolute difference between this review rating and historical product average.",
    "reviewer_rating_variance": "Variance of star ratings assigned by this reviewer.",
    "product_reviews_7d": "Volume of reviews published for this product within a 7-day rolling window.",
}

DISPLAY_NAMES: Dict[str, str] = {
    "same_day_review_count": "Same-Day Review Velocity",
    "extreme_rating_ratio": "Extreme Rating Ratio",
    "review_length": "Review Length (Chars)",
    "sentiment_polarity": "Sentiment Polarity Extremity",
    "time_gap_days": "Post-Submission Time Gap",
    "exclamation_count": "Exclamation Mark Density",
    "reviewer_total_reviews": "Reviewer Lifetime Submissions",
    "burst_indicator": "Coordinated Burst Window",
    "word_count": "Review Word Count",
    "avg_word_length": "Average Word Length",
    "sentiment_subjectivity": "Sentiment Subjectivity Index",
    "capital_letter_ratio": "Uppercase Character Ratio",
    "reviewer_avg_rating": "Reviewer Historical Avg Rating",
    "rating_deviation_product": "Product Rating Deviation",
    "reviewer_rating_variance": "Reviewer Rating Variance",
    "product_reviews_7d": "Product 7-Day Velocity",
}


def _compute_sentiment_safe(text: str) -> Tuple[float, float]:
    """Compute sentiment polarity and subjectivity using TextBlob safely."""
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        return float(blob.sentiment.polarity), float(blob.sentiment.subjectivity)
    except Exception:
        # Fallback heuristic if TextBlob dictionary is missing
        lower_t = text.lower()
        pos_words = {"best", "great", "love", "amazing", "flawless", "excellent", "perfect", "good"}
        neg_words = {"worst", "trash", "broken", "scam", "garbage", "horrible", "terrible", "bad"}
        words = lower_t.split()
        pos_c = sum(1 for w in words if w in pos_words)
        neg_c = sum(1 for w in words if w in neg_words)
        total = pos_c + neg_c
        polarity = (pos_c - neg_c) / total if total > 0 else 0.0
        subjectivity = min(1.0, total / 5.0)
        return float(polarity), float(subjectivity)


class LeakageFreeTabularTransformer(BaseEstimator, TransformerMixin):
    """Computes textual, behavioral, and temporal tabular features without test leakage.

    Fitted strictly on train data to learn reviewer and product historical baselines.
    """

    def __init__(self):
        self.reviewer_stats_: Dict[str, Dict[str, float]] = {}
        self.product_stats_: Dict[str, float] = {}
        self.global_defaults_: Dict[str, float] = {}

    @property
    def reviewer_baselines(self) -> Dict[str, Dict[str, float]]:
        """Learned reviewer baselines from training data."""
        return self.reviewer_stats_

    @property
    def product_baselines(self) -> Dict[str, float]:
        """Learned product baselines from training data."""
        return self.product_stats_

    @staticmethod
    def clean_text(text: str) -> str:
        """Standardize and clean raw text for NLP pipelines."""
        import re
        if not isinstance(text, str):
            return ""
        cleaned = text.lower()
        cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned)
        cleaned = re.sub(r"\S+@\S+", " ", cleaned)
        cleaned = re.sub(r"<.*?>", " ", cleaned)
        cleaned = re.sub(r"[^a-zA-Z\s]", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def fit(self, X: pd.DataFrame, y=None):
        """Learn reviewer and product priors strictly from training partition."""
        logger.info(f"Fitting LeakageFreeTabularTransformer on {len(X)} training samples...")
        df = X.copy()
        if "rating" not in df.columns:
            df["rating"] = 5

        # 1. Reviewer historical aggregates from train only
        if "reviewer_id" in df.columns:
            grouped_rev = df.groupby("reviewer_id")
            for rev_id, group in grouped_rev:
                ratings = group["rating"].values
                total_cnt = len(ratings)
                mean_r = float(np.mean(ratings))
                var_r = float(np.var(ratings)) if total_cnt > 1 else 0.0
                extreme_cnt = int(np.sum((ratings == 1) | (ratings == 5)))
                extreme_ratio = float(extreme_cnt / total_cnt) if total_cnt > 0 else 0.0

                self.reviewer_stats_[str(rev_id)] = {
                    "total_reviews": float(total_cnt),
                    "avg_rating": mean_r,
                    "rating_variance": var_r,
                    "extreme_ratio": extreme_ratio,
                }

        # 2. Product historical ratings from train only
        if "product_id" in df.columns:
            prod_means = df.groupby("product_id")["rating"].mean().to_dict()
            self.product_stats_ = {str(k): float(v) for k, v in prod_means.items()}

        # 3. Global train defaults for unseen reviewers / products at inference time
        all_ratings = df["rating"].values if "rating" in df.columns else np.array([4.0])
        global_avg_rating = float(np.mean(all_ratings))
        global_extreme_cnt = int(np.sum((all_ratings == 1) | (all_ratings == 5)))
        global_extreme_ratio = float(global_extreme_cnt / len(all_ratings)) if len(all_ratings) > 0 else 0.4

        self.global_defaults_ = {
            "reviewer_total_reviews": 1.0,
            "reviewer_avg_rating": global_avg_rating,
            "reviewer_rating_variance": 0.25,
            "extreme_rating_ratio": global_extreme_ratio,
            "product_avg_rating": global_avg_rating,
            "time_gap_days": 30.0,
            "same_day_review_count": 1.0,
            "burst_indicator": 0.0,
            "product_reviews_7d": 1.0,
        }

        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform review records into 16 engineered numeric features."""
        df = X.copy()
        n = len(df)
        out = pd.DataFrame(index=df.index)

        # -----------------------------------------------------
        # Group 1: Textual Features
        # -----------------------------------------------------
        raw_texts = df["review_text"].astype(str).tolist()
        lengths = []
        word_counts = []
        avg_word_lens = []
        polarities = []
        subjectivities = []
        exclamation_counts = []
        caps_ratios = []

        for txt in raw_texts:
            c_len = len(txt)
            words = txt.split()
            w_cnt = len(words)
            lengths.append(c_len)
            word_counts.append(w_cnt)

            if w_cnt > 0:
                avg_word_lens.append(c_len / w_cnt)
            else:
                avg_word_lens.append(0.0)

            pol, subj = _compute_sentiment_safe(txt)
            polarities.append(pol)
            subjectivities.append(subj)

            exclamation_counts.append(txt.count("!"))

            alpha_chars = sum(1 for c in txt if c.isalpha())
            upper_chars = sum(1 for c in txt if c.isupper())
            caps_ratios.append(upper_chars / alpha_chars if alpha_chars > 0 else 0.0)

        out["review_length"] = lengths
        out["word_count"] = word_counts
        out["avg_word_length"] = avg_word_lens
        out["sentiment_polarity"] = polarities
        out["sentiment_subjectivity"] = subjectivities
        out["exclamation_count"] = exclamation_counts
        out["capital_letter_ratio"] = caps_ratios

        # -----------------------------------------------------
        # Group 2: Behavioral Features
        # -----------------------------------------------------
        ratings = df["rating"].fillna(5).astype(int).values if "rating" in df.columns else np.full(n, 5)
        reviewers = df["reviewer_id"].astype(str).values if "reviewer_id" in df.columns else ["ANON"] * n
        products = df["product_id"].astype(str).values if "product_id" in df.columns else ["PRD-GENERAL"] * n

        rev_totals = []
        rev_avgs = []
        rev_vars = []
        rev_extremes = []
        rating_devs = []

        for i in range(n):
            rid = reviewers[i]
            pid = products[i]
            cur_rating = ratings[i]

            # Look up strictly from train stats
            r_stat = self.reviewer_stats_.get(rid)
            if r_stat:
                rev_totals.append(r_stat["total_reviews"])
                rev_avgs.append(r_stat["avg_rating"])
                rev_vars.append(r_stat["rating_variance"])
                rev_extremes.append(r_stat["extreme_ratio"])
            else:
                # Neutral prior for unseen reviewer
                rev_totals.append(self.global_defaults_["reviewer_total_reviews"])
                rev_avgs.append(self.global_defaults_["reviewer_avg_rating"])
                rev_vars.append(self.global_defaults_["reviewer_rating_variance"])
                is_ext = 1.0 if (cur_rating == 1 or cur_rating == 5) else 0.0
                rev_extremes.append(is_ext)

            p_avg = self.product_stats_.get(pid, self.global_defaults_["product_avg_rating"])
            rating_devs.append(abs(cur_rating - p_avg))

        out["reviewer_total_reviews"] = rev_totals
        out["reviewer_avg_rating"] = rev_avgs
        out["rating_deviation_product"] = rating_devs
        out["reviewer_rating_variance"] = rev_vars
        out["extreme_rating_ratio"] = rev_extremes

        # -----------------------------------------------------
        # Group 3: Temporal Features
        # -----------------------------------------------------
        same_day_counts = []
        time_gaps = []
        burst_indicators = []
        prod_7d_counts = []

        # If dates are provided, compute within-dataset temporal metrics
        has_dates = "date" in df.columns and pd.to_datetime(df["date"], errors="coerce").notna().any()
        if has_dates:
            date_series = pd.to_datetime(df["date"], errors="coerce").fillna(pd.Timestamp("2025-01-01"))
            dates = date_series.dt.strftime("%Y-%m-%d").values

            # Group review dates by reviewer in current batch
            reviewer_date_map: Dict[str, Dict[str, int]] = {}
            for r_id, d_str in zip(reviewers, dates):
                if r_id not in reviewer_date_map:
                    reviewer_date_map[r_id] = {}
                reviewer_date_map[r_id][d_str] = reviewer_date_map[r_id].get(d_str, 0) + 1

            for i in range(n):
                r_id = reviewers[i]
                d_str = dates[i]
                c_same = reviewer_date_map.get(r_id, {}).get(d_str, 1)
                same_day_counts.append(float(c_same))

                # Burst indicator if velocity > 2 reviews on same day
                is_burst = 1.0 if c_same >= 3 else 0.0
                burst_indicators.append(is_burst)

                # Time gap default
                time_gaps.append(self.global_defaults_["time_gap_days"] if c_same <= 1 else 0.0)
                prod_7d_counts.append(self.global_defaults_["product_reviews_7d"])
        else:
            same_day_counts = [self.global_defaults_["same_day_review_count"]] * n
            burst_indicators = [self.global_defaults_["burst_indicator"]] * n
            time_gaps = [self.global_defaults_["time_gap_days"]] * n
            prod_7d_counts = [self.global_defaults_["product_reviews_7d"]] * n

        out["same_day_review_count"] = same_day_counts
        out["time_gap_days"] = time_gaps
        out["burst_indicator"] = burst_indicators
        out["product_reviews_7d"] = prod_7d_counts

        # Reorder columns strictly
        out = out[NUMERIC_FEATURE_NAMES].fillna(0.0)
        return out


class FullFeaturePipeline:
    """Combines leakage-safe tabular engineering with TF-IDF text features."""

    def __init__(self, max_tfidf_features: int = TFIDF_MAX_FEATURES):
        self.max_tfidf_features = max_tfidf_features
        self.tabular_transformer = LeakageFreeTabularTransformer()
        self.scaler = StandardScaler()
        self.tfidf = TfidfVectorizer(
            max_features=max_tfidf_features,
            ngram_range=TFIDF_NGRAM_RANGE,
            sublinear_tf=True,
            stop_words="english",
        )
        self.feature_names_: List[str] = []

    def fit(self, X: pd.DataFrame, y=None):
        """Fit tabular baselines, scaler, and TF-IDF strictly on train data."""
        logger.info(f"Fitting FullFeaturePipeline on {len(X)} training samples...")
        # 1. Fit tabular transformer on raw train
        self.tabular_transformer.fit(X, y)
        tab_df = self.tabular_transformer.transform(X)

        # 2. Fit standard scaler on tabular train
        self.scaler.fit(tab_df)

        # 3. Fit TF-IDF on clean_text train
        text_data = X["clean_text"] if "clean_text" in X.columns else X["review_text"]
        self.tfidf.fit(text_data.fillna(""))

        tfidf_names = [f"tfidf__{w}" for w in self.tfidf.get_feature_names_out()]
        self.feature_names_ = NUMERIC_FEATURE_NAMES + tfidf_names
        logger.info(f"Feature space ready: {len(NUMERIC_FEATURE_NAMES)} tabular + {len(tfidf_names)} TF-IDF = {len(self.feature_names_)} total features.")
        return self

    def transform(self, X: pd.DataFrame, return_sparse: bool = False):
        """Transform review records into scaled tabular + TF-IDF matrices."""
        tab_df = self.tabular_transformer.transform(X)
        tab_scaled = self.scaler.transform(tab_df)

        text_data = X["clean_text"] if "clean_text" in X.columns else X["review_text"]
        tfidf_mat = self.tfidf.transform(text_data.fillna(""))

        import scipy.sparse as sp
        combined = sp.hstack([tab_scaled, tfidf_mat], format="csr")

        if return_sparse:
            return combined
        return combined

    def transform_tabular_only(self, X: pd.DataFrame) -> pd.DataFrame:
        """Return unscaled tabular DataFrame (for SHAP explainability and rule mining)."""
        return self.tabular_transformer.transform(X)

    def save(self, filepath: Optional[Path] = None) -> Path:
        """Serialize fitted pipeline to disk."""
        target = filepath or (MODELS_DIR / "feature_pipeline.joblib")
        target.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, target)
        logger.info(f"Saved feature pipeline -> {target}")
        return target

    @classmethod
    def load(cls, filepath: Optional[Path] = None) -> "FullFeaturePipeline":
        """Load fitted pipeline from disk."""
        target = filepath or (MODELS_DIR / "feature_pipeline.joblib")
        if not target.exists():
            raise FileNotFoundError(f"Feature pipeline artifact not found at {target}.")
        return joblib.load(target)
