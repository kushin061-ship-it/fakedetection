"""Association patterns and reviewer investigation API router."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from app.schemas import (
    PatternsResponse,
    ReviewerProfileResponse,
)
from app.services.artifacts import artifact_manager

router = APIRouter()


@router.get("/patterns", response_model=PatternsResponse)
async def get_mined_patterns() -> Dict[str, Any]:
    """Retrieve frequent itemset association rules (FP-Growth/Apriori) and ranked suspicious accounts."""
    artifact_manager.ensure_loaded()
    if artifact_manager.patterns is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Pattern mining records not available.",
        )
    return artifact_manager.patterns


@router.get("/reviewer/{reviewer_id}", response_model=ReviewerProfileResponse)
async def get_reviewer_profile(reviewer_id: str) -> Dict[str, Any]:
    """Retrieve detailed longitudinal review timeline, risk score, and syndicate indicators for a reviewer."""
    artifact_manager.ensure_loaded()
    if artifact_manager.reviewers is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reviewer profile records not available.",
        )

    profiles = artifact_manager.reviewers
    target_id = reviewer_id.strip()

    # Direct match or case-insensitive match
    if target_id in profiles:
        return profiles[target_id]

    for rid, prof in profiles.items():
        if rid.lower() == target_id.lower():
            return prof

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Reviewer profile '{reviewer_id}' not found in current investigation index.",
    )
