"""Explainability and global SHAP attribution API router."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.schemas import GlobalExplainResponse
from app.services.artifacts import artifact_manager

router = APIRouter()


@router.get("/explain/global", response_model=GlobalExplainResponse)
async def get_global_explanations() -> Dict[str, Any]:
    """Retrieve global TreeSHAP feature importances, feature ranks, and group summaries."""
    artifact_manager.ensure_loaded()
    if artifact_manager.shap_global is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Global SHAP explainability data not available.",
        )
    return artifact_manager.shap_global
