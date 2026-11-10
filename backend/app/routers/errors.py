"""Error analysis and misclassification inspection API router."""

import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas import (
    ErrorsResponse,
    ErrorCaseItem,
    ErrorsSummary,
)
from app.services.artifacts import artifact_manager

router = APIRouter()


@router.get("/errors", response_model=ErrorsResponse)
async def get_error_cases(
    type: Optional[str] = Query(None, description="Filter error category: false_positive, false_negative, low_confidence, or all"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Free-text keyword search across review text, reviewer ID, or factors"),
) -> ErrorsResponse:
    """Retrieve paginated and searchable false positives, false negatives, and low-confidence test samples."""
    artifact_manager.ensure_loaded()
    if artifact_manager.errors is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error analysis records not available.",
        )

    all_cases: List[Dict[str, Any]] = artifact_manager.errors.get("cases", [])
    raw_summary = artifact_manager.errors.get("summary", {})

    # 1. Filter by error_type
    filtered = all_cases
    if type and type.strip().lower() not in ["", "all"]:
        t_clean = type.strip().lower()
        filtered = [c for c in filtered if c.get("error_type", "").lower() == t_clean]

    # 2. Filter by search query
    if search and search.strip():
        q = search.strip().lower()
        filtered = [
            c for c in filtered
            if q in str(c.get("review_text", "")).lower()
            or q in str(c.get("reviewer_id", "")).lower()
            or q in str(c.get("id", "")).lower()
            or q in str(c.get("primary_factor", "")).lower()
            or q in str(c.get("product_name", "")).lower()
        ]

    total_filtered = len(filtered)
    total_pages = max(1, math.ceil(total_filtered / limit)) if total_filtered > 0 else 1
    safe_page = min(page, total_pages)

    # 3. Paginate
    start_idx = (safe_page - 1) * limit
    end_idx = start_idx + limit
    page_items = filtered[start_idx:end_idx]

    # Convert to ErrorCaseItem list
    data_items = [ErrorCaseItem(**item) for item in page_items]

    summary = ErrorsSummary(
        totalFalsePositives=raw_summary.get("totalFalsePositives", sum(1 for c in all_cases if c.get("error_type") == "false_positive")),
        totalFalseNegatives=raw_summary.get("totalFalseNegatives", sum(1 for c in all_cases if c.get("error_type") == "false_negative")),
        totalLowConfidence=raw_summary.get("totalLowConfidence", sum(1 for c in all_cases if c.get("error_type") == "low_confidence")),
        totalOverall=len(all_cases),
        currentFilteredCount=total_filtered,
    )

    return ErrorsResponse(
        data=data_items,
        total=total_filtered,
        page=safe_page,
        pageSize=limit,
        totalPages=total_pages,
        dataset=artifact_manager.dataset_name,
        summary=summary,
    )
