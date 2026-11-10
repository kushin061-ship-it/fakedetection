"""Artifact management service for Fake Review Detection.

Loads all serialized ML models, pipelines, SHAP explainers, and JSON results
once at startup, avoiding any runtime training or re-computation.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

import joblib
from fastapi import HTTPException

from ml.config import MODELS_DIR, DATASET_NAME
from ml.explain import ExplainerService
from ml.features import FullFeaturePipeline

logger = logging.getLogger("app.services.artifacts")


class ArtifactManager:
    """Singleton container managing all pre-trained ML models and evaluation artifacts."""

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or MODELS_DIR
        self.dataset_name: str = DATASET_NAME

        # Loaded objects
        self.best_model = None
        self.best_model_id: str = "xgboost"
        self.feature_pipeline: Optional[FullFeaturePipeline] = None
        self.explainer_service: Optional[ExplainerService] = None

        # Loaded JSON metadata & reports
        self.results: Optional[Dict[str, Any]] = None
        self.errors: Optional[Dict[str, Any]] = None
        self.shap_global: Optional[Dict[str, Any]] = None
        self.patterns: Optional[Dict[str, Any]] = None
        self.reviewers: Optional[Dict[str, Any]] = None
        self.eda: Optional[Dict[str, Any]] = None

        self._is_loaded = False

    def is_loaded(self) -> bool:
        """Check if essential artifacts are loaded in memory."""
        return self._is_loaded

    def ensure_loaded(self) -> None:
        """Verify that artifacts are loaded or raise a 503 Service Unavailable."""
        if not self._is_loaded:
            raise HTTPException(
                status_code=503,
                detail=(
                    "ML model artifacts not loaded. Please run "
                    "'python -m ml.run_pipeline' to train models and generate artifacts."
                ),
            )

    def load_all(self) -> bool:
        """Load all saved models and JSON artifacts from backend/models/."""
        logger.info(f"Loading ML artifacts from {self.models_dir}...")

        best_model_path = self.models_dir / "best_model.joblib"
        pipeline_path = self.models_dir / "feature_pipeline.joblib"
        results_path = self.models_dir / "results.json"
        errors_path = self.models_dir / "errors.json"
        shap_path = self.models_dir / "shap_global.json"
        patterns_path = self.models_dir / "patterns.json"
        reviewers_path = self.models_dir / "reviewers.json"
        eda_path = self.models_dir / "eda.json"

        # Check required files
        required_files = [
            best_model_path,
            pipeline_path,
            results_path,
            errors_path,
            shap_path,
            patterns_path,
            reviewers_path,
            eda_path,
        ]

        missing = [f.name for f in required_files if not f.exists()]
        if missing:
            logger.warning(
                f"Cannot load artifacts; missing files: {missing}. "
                "Run 'python -m ml.run_pipeline' to generate them."
            )
            self._is_loaded = False
            return False

        try:
            # 1. Load best model
            self.best_model = joblib.load(best_model_path)
            logger.info("Loaded champion model.")

            # 2. Load feature pipeline
            self.feature_pipeline = FullFeaturePipeline.load(pipeline_path)
            logger.info("Loaded feature pipeline.")

            # 3. Load Explainer Service
            self.explainer_service = ExplainerService(
                model=self.best_model,
                feature_names=self.feature_pipeline.feature_names_,
            )
            logger.info("Initialized local SHAP ExplainerService.")

            # 4. Load JSON artifacts
            with open(results_path, "r", encoding="utf-8") as f:
                self.results = json.load(f)
                if "dataset" in self.results:
                    self.dataset_name = self.results["dataset"]
                if "summary" in self.results and "bestModel" in self.results["summary"]:
                    self.best_model_id = self.results["summary"]["bestModel"].lower().split()[0]

            with open(errors_path, "r", encoding="utf-8") as f:
                self.errors = json.load(f)

            with open(shap_path, "r", encoding="utf-8") as f:
                self.shap_global = json.load(f)

            with open(patterns_path, "r", encoding="utf-8") as f:
                self.patterns = json.load(f)

            with open(reviewers_path, "r", encoding="utf-8") as f:
                self.reviewers = json.load(f)

            with open(eda_path, "r", encoding="utf-8") as f:
                self.eda = json.load(f)

            self._is_loaded = True
            logger.info("All artifacts successfully loaded into memory.")
            return True

        except Exception as e:
            logger.error(f"Error loading model artifacts: {e}", exc_info=True)
            self._is_loaded = False
            return False


# Global singleton instance
artifact_manager = ArtifactManager()
