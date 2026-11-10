"""Exploratory Data Analysis (EDA) API router."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.schemas import EdaResponse
from app.services.artifacts import artifact_manager

router = APIRouter()


@router.get("/eda", response_model=EdaResponse)
async def get_eda_overview() -> Dict[str, Any]:
    """Retrieve dataset summary metrics, distributions, rating breakdowns, and monthly review volume."""
    artifact_manager.ensure_loaded()
    if artifact_manager.eda is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="EDA metrics not available. Run 'python -m ml.run_pipeline' to compute dataset statistics.",
        )
    return artifact_manager.eda
