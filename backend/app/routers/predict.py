"""Prediction and batch inference API routers."""

import io
import json as py_json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from app.schemas import (
    PredictRequest,
    PredictResponse,
    ShapFeature,
    MetricsBreakdown,
    BatchPredictResponse,
    BatchItemResult,
)
from app.services.artifacts import artifact_manager
from ml.features import LeakageFreeTabularTransformer, NUMERIC_FEATURE_NAMES

router = APIRouter()

MAX_BATCH_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/predict", response_model=PredictResponse)
async def predict_single_review(req: PredictRequest) -> PredictResponse:
    """Predict whether an individual review is fake or genuine with SHAP feature attributions."""
    artifact_manager.ensure_loaded()

    model = artifact_manager.best_model
    pipeline = artifact_manager.feature_pipeline
    explainer = artifact_manager.explainer_service

    # Construct single-row DataFrame for feature pipeline
    notes = None
    has_reviewer = bool(req.reviewer_id and str(req.reviewer_id).strip())
    effective_date = req.date or req.review_date
    has_date = bool(effective_date and str(effective_date).strip())

    if not has_reviewer or not has_date:
        missing_parts = []
        if not has_reviewer:
            missing_parts.append("reviewer_id")
        if not has_date:
            missing_parts.append("date")
        notes = f"Behavioral/temporal defaults used: missing {', '.join(missing_parts)}."

    row_data = {
        "review_text": [req.review_text],
        "rating": [req.rating],
        "reviewer_id": [req.reviewer_id if has_reviewer else "ANON_USER"],
        "date": [effective_date if has_date else datetime.now(timezone.utc).strftime("%Y-%m-%d")],
        "product_id": [req.product_id if req.product_id else "PRD-GENERAL"],
        "clean_text": [LeakageFreeTabularTransformer.clean_text(req.review_text)],
    }
    if req.same_day_review_count is not None:
        row_data["same_day_review_count"] = [float(req.same_day_review_count)]
    input_df = pd.DataFrame(row_data)

    # Transform features
    X_mat = pipeline.transform(input_df)
    tab_df = pipeline.transform_tabular_only(input_df)
    raw_feature_dict = tab_df.iloc[0].to_dict()

    # Predict probabilities
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_mat)[0]
        fake_prob = float(probs[1])
        gen_prob = float(probs[0])
    else:
        pred = int(model.predict(X_mat)[0])
        fake_prob = 0.92 if pred == 1 else 0.08
        gen_prob = 1.0 - fake_prob

    fake_prob = round(fake_prob, 3)
    gen_prob = round(gen_prob, 3)
    is_fake = fake_prob >= 0.50
    label = "fake" if is_fake else "genuine"

    # Low confidence range: 0.40 <= p <= 0.60
    low_confidence = bool(0.40 <= fake_prob <= 0.60)
    confidence_score = round(abs(fake_prob - 0.50) * 2.0, 3)

    if low_confidence:
        recommendation = "Borderline classification. Manual review recommended."
    elif is_fake:
        recommendation = "High probability of deceptive or synthetic content. Flag for moderation."
    else:
        recommendation = "Low probability of fraud. Standard authentic review profile."

    # Explain via SHAP
    shap_features_raw = explainer.explain_sample(
        features_vec=X_mat,
        raw_feature_dict=raw_feature_dict,
        top_k=10,
    )

    shap_features: List[ShapFeature] = []
    for sf in shap_features_raw:
        shap_features.append(ShapFeature(
            rank=sf["rank"],
            feature=sf["feature"],
            displayName=sf["displayName"],
            group=sf["group"],
            value=sf["value"],
            shap_value=sf["shap_value"],
            direction=sf["direction"],
            impact=sf["impact"],
        ))

    # Metric breakdown scores
    metrics_breakdown = MetricsBreakdown(
        textual_score=round(min(1.0, max(0.0, float(raw_feature_dict.get("exclamation_count", 0) * 0.2 + (0.8 if req.rating in [1, 5] else 0.2)))), 2),
        behavioral_score=round(min(1.0, max(0.0, float(raw_feature_dict.get("extreme_rating_ratio", 0.5)))), 2),
        temporal_score=round(min(1.0, max(0.0, float(raw_feature_dict.get("burst_indicator", 0) * 0.9 + 0.1))), 2),
    )

    return PredictResponse(
        label=label,
        fake_probability=fake_prob,
        genuine_probability=gen_prob,
        confidence_score=confidence_score,
        low_confidence=low_confidence,
        recommendation=recommendation,
        top_shap_features=shap_features,
        metrics_breakdown=metrics_breakdown,
        disclaimer="Preliminary analytical result. Does not replace human verification or platform-level moderation.",
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        dataset=artifact_manager.dataset_name,
        notes=notes,
    )


@router.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(file: UploadFile = File(...)) -> BatchPredictResponse:
    """Batch prediction on uploaded CSV file (up to 10 MB)."""
    artifact_manager.ensure_loaded()

    # 1. Validate filename
    filename = file.filename or "uploaded_batch.csv"
    ext = Path(filename).suffix.lower()
    if ext not in [".csv", ".json"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Please upload a standard CSV (.csv) or JSON (.json) file.",
        )

    # 2. Read contents and validate size
    contents = await file.read()
    if len(contents) > MAX_BATCH_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 10 MB (received {round(len(contents)/(1024*1024), 2)} MB).",
        )

    try:
        if ext == ".csv":
            batch_df = pd.read_csv(io.BytesIO(contents))
        else:
            raw_data = py_json.loads(contents.decode("utf-8"))
            if isinstance(raw_data, dict):
                for key in ["reviews", "data", "records", "items", "results"]:
                    if key in raw_data and isinstance(raw_data[key], list):
                        raw_data = raw_data[key]
                        break
            if not isinstance(raw_data, list):
                raise ValueError("JSON payload must be a list of review objects or contain a 'reviews' array.")
            batch_df = pd.DataFrame(raw_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse uploaded file: {str(e)}",
        )

    if len(batch_df) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file contains no data rows.",
        )

    # 3. Flexible column name mapping
    col_mapping = {}
    for col in batch_df.columns:
        norm = str(col).strip().lower().replace(" ", "_")
        if norm in ["review_text", "text", "review", "content", "review_body"]:
            col_mapping[col] = "review_text"
        elif norm in ["rating", "stars", "star_rating", "score"]:
            col_mapping[col] = "rating"
        elif norm in ["reviewer_id", "user_id", "author_id", "reviewer"]:
            col_mapping[col] = "reviewer_id"
        elif norm in ["date", "review_date", "timestamp", "created_at"]:
            col_mapping[col] = "date"
        elif norm in ["product_id", "item_id", "product", "asin"]:
            col_mapping[col] = "product_id"

    batch_df = batch_df.rename(columns=col_mapping)

    # Validate required columns
    required_cols = ["review_text", "rating"]
    missing_cols = [c for c in required_cols if c not in batch_df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File is missing required columns: {missing_cols}. Found: {list(batch_df.columns)}",
        )

    # Clean rating and text
    batch_df["review_text"] = batch_df["review_text"].fillna("").astype(str)
    batch_df["rating"] = pd.to_numeric(batch_df["rating"], errors="coerce").fillna(5).clip(1, 5).astype(int)

    pipeline = artifact_manager.feature_pipeline
    model = artifact_manager.best_model

    # Ensure optional columns exist
    if "reviewer_id" not in batch_df.columns:
        batch_df["reviewer_id"] = "ANON_USER"
    if "date" not in batch_df.columns:
        batch_df["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if "product_id" not in batch_df.columns:
        batch_df["product_id"] = "PRD-GENERAL"

    batch_df["clean_text"] = batch_df["review_text"].apply(LeakageFreeTabularTransformer.clean_text)

    # Run transform and predict
    X_mat = pipeline.transform(batch_df)
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_mat)[:, 1]
    else:
        probs = model.predict(X_mat).astype(float)

    fake_count = 0
    genuine_count = 0
    low_confidence_count = 0
    items: List[BatchItemResult] = []

    for idx, prob in enumerate(probs):
        p = round(float(prob), 3)
        is_f = p >= 0.50
        is_lc = bool(0.40 <= p <= 0.60)

        if is_f:
            fake_count += 1
        else:
            genuine_count += 1

        if is_lc:
            low_confidence_count += 1

        row = batch_df.iloc[idx]
        items.append(BatchItemResult(
            id=f"BATCH-{str(idx + 1).zfill(4)}",
            review_text=str(row.get("review_text", ""))[:200],
            rating=int(row.get("rating", 5)),
            reviewer_id=str(row.get("reviewer_id", "ANON_USER")),
            date=str(row.get("date", "")),
            fake_probability=p,
            label="fake" if is_f else "genuine",
            low_confidence=is_lc,
        ))

    total = len(items)
    flagged_rate = round((fake_count / total) * 100, 1) if total > 0 else 0.0

    return BatchPredictResponse(
        filename=filename,
        total_processed=total,
        fake_count=fake_count,
        genuine_count=genuine_count,
        low_confidence_count=low_confidence_count,
        flagged_rate=flagged_rate,
        processed_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        dataset=artifact_manager.dataset_name,
        results=items,
    )
