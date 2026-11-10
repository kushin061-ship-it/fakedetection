"""Model comparison and confusion matrix API routers."""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.schemas import (
    ModelComparisonResponse,
    ConfusionMatrixResponse,
)
from app.services.artifacts import artifact_manager

router = APIRouter()


@router.get("/models/compare", response_model=ModelComparisonResponse)
async def get_model_comparison() -> Dict[str, Any]:
    """Retrieve full model leaderboard metrics, ROC curves, and cross-validation comparison."""
    artifact_manager.ensure_loaded()
    if artifact_manager.results is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model comparison data not found.",
        )
    return artifact_manager.results


@router.get("/models/confusion/{model_id}", response_model=ConfusionMatrixResponse)
async def get_model_confusion_matrix(model_id: str) -> Dict[str, Any]:
    """Retrieve detailed confusion matrix for a specific trained model."""
    artifact_manager.ensure_loaded()
    if artifact_manager.results is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model evaluation data not available.",
        )

    models_list = artifact_manager.results.get("models", [])
    target = model_id.strip().lower()

    for m in models_list:
        if m.get("id", "").lower() == target or m.get("name", "").lower() == target:
            return m.get("confusionMatrix")

    # If not found, list available IDs
    available_ids = [m.get("id") for m in models_list]
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Confusion matrix for model '{model_id}' not found. Available models: {available_ids}",
    )
