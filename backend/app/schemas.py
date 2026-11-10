"""Pydantic request and response schemas matching the frontend contract."""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


# ============================================================================
# Health Check Schema
# ============================================================================
class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    artifacts_loaded: bool = False
    dataset: str = "synthetic_demo"


# ============================================================================
# Prediction Schemas (POST /api/predict & POST /api/predict/batch)
# ============================================================================
class PredictRequest(BaseModel):
    review_text: str = Field(..., description="Raw text of the review")
    rating: int = Field(5, ge=1, le=5, description="Star rating between 1 and 5")
    reviewer_id: Optional[str] = Field(None, description="Optional reviewer identifier")
    date: Optional[str] = Field(None, description="Optional date string (YYYY-MM-DD)")
    review_date: Optional[str] = Field(None, description="Optional date string alias (YYYY-MM-DD)")
    product_id: Optional[str] = Field(None, description="Optional product identifier")
    is_verified: Optional[bool] = Field(None, description="Optional verified purchase flag")
    same_day_review_count: Optional[int] = Field(None, description="Optional count of same-day reviews")


class ShapFeature(BaseModel):
    rank: int
    feature: str
    displayName: str
    group: str  # textual | behavioral | temporal
    value: Union[str, float, int]
    shap_value: float
    direction: str  # pushes_fake | pushes_genuine
    impact: str  # high | medium | low


class MetricsBreakdown(BaseModel):
    textual_score: float
    behavioral_score: float
    temporal_score: float


class PredictResponse(BaseModel):
    label: str  # fake | genuine
    fake_probability: float
    genuine_probability: float
    confidence_score: float
    low_confidence: bool
    recommendation: str
    top_shap_features: List[ShapFeature]
    metrics_breakdown: Optional[MetricsBreakdown] = None
    disclaimer: str = (
        "Preliminary analytical result. Does not replace human verification or platform-level moderation."
    )
    timestamp: str
    dataset: str = "synthetic_demo"
    notes: Optional[str] = None


class BatchItemResult(BaseModel):
    id: str
    review_text: str
    rating: int
    reviewer_id: Optional[str] = None
    date: Optional[str] = None
    fake_probability: float
    label: str
    low_confidence: bool


class BatchPredictResponse(BaseModel):
    filename: str
    total_processed: int
    fake_count: int
    genuine_count: int
    low_confidence_count: int
    flagged_rate: float
    processed_at: str
    dataset: str = "synthetic_demo"
    results: List[BatchItemResult]


# ============================================================================
# Model Comparison Schemas (GET /api/models/compare & confusion)
# ============================================================================
class ConfusionMatrixResponse(BaseModel):
    labels: List[str]
    matrix: List[List[int]]
    tn: int
    fp: int
    fn: int
    tp: int
    total: int
    normalized: List[List[float]]


class RocPoint(BaseModel):
    fpr: float
    tpr: float


class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    rocAuc: float


class ModelItem(BaseModel):
    id: str
    name: str
    displayName: str
    type: str
    isBest: bool
    metrics: ModelMetrics
    confusionMatrix: ConfusionMatrixResponse
    rocCurve: List[RocPoint]
    trainingTimeSeconds: float
    featureImportanceTop: List[str]


class ModelComparisonSummary(BaseModel):
    bestModel: str
    bestF1: float
    bestRocAuc: float
    evaluationDatasetSize: int
    splitRatio: str


class ModelComparisonResponse(BaseModel):
    summary: ModelComparisonSummary
    dataset: str = "synthetic_demo"
    models: List[ModelItem]


# ============================================================================
# Error Analysis Schemas (GET /api/errors)
# ============================================================================
class ErrorCaseItem(BaseModel):
    id: str
    error_type: str  # false_positive | false_negative | low_confidence
    review_text: str
    rating: int
    predicted_label: str
    true_label: str
    probability: float
    reviewer_id: Optional[str] = None
    product_name: Optional[str] = None
    primary_factor: str
    confidence_delta: float


class ErrorsSummary(BaseModel):
    totalFalsePositives: int
    totalFalseNegatives: int
    totalLowConfidence: int
    totalOverall: int
    currentFilteredCount: int


class ErrorsResponse(BaseModel):
    data: List[ErrorCaseItem]
    total: int
    page: int
    pageSize: int
    totalPages: int
    dataset: str = "synthetic_demo"
    summary: ErrorsSummary


# ============================================================================
# Explainability Schemas (GET /api/explain/global)
# ============================================================================
class GlobalShapFeature(BaseModel):
    rank: int
    name: str
    displayName: str
    group: str
    mean_abs_shap: float
    impact: str
    direction: str
    description: str


class GroupSummaryItem(BaseModel):
    group: str
    name: str
    color: str
    totalMeanShap: float
    featureCount: int
    percentage: float
    description: str


class GlobalExplainResponse(BaseModel):
    model: str
    baseValue: float
    numSamplesAnalyzed: int
    dataset: str = "synthetic_demo"
    features: List[GlobalShapFeature]
    groupSummary: List[GroupSummaryItem]


# ============================================================================
# Pattern Mining Schemas (GET /api/patterns & GET /api/reviewer/{id})
# ============================================================================
class AssociationPattern(BaseModel):
    id: str
    rule: str
    antecedents: List[str]
    consequent: str
    support: float
    confidence: float
    lift: float
    description: str
    riskLevel: str


class SuspiciousReviewer(BaseModel):
    id: str
    name: str
    total_reviews: int
    fake_share: float
    burst_count: int
    avg_rating: float
    account_age_days: int
    status: str
    risk_score: int
    dominant_pattern: str
    flagged_date: str


class PatternsResponse(BaseModel):
    summary: Dict[str, Any]
    dataset: str = "synthetic_demo"
    patterns: List[AssociationPattern]
    suspiciousReviewers: List[SuspiciousReviewer]


class ReviewerTimelineItem(BaseModel):
    review_id: str
    product_id: Optional[str] = None
    product_name: str
    category: Optional[str] = None
    date: str
    timestamp: str
    rating: int
    review_text: str
    fake_probability: float
    status: str
    is_burst: bool
    burst_name: Optional[str] = None
    verified_purchase: bool


class ReviewerStats(BaseModel):
    total_reviews: int
    fake_reviews_count: int
    genuine_reviews_count: int
    fake_share: float
    fake_percentage: float
    average_rating: float
    rating_variance: float
    extreme_rating_ratio: float
    burst_count: int
    max_reviews_single_day: int
    avg_review_length_words: float
    avg_sentiment_polarity: float
    helpfulness_upvotes_received: int


class ReviewerDetailResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    account_created_at: Optional[str] = None
    account_age_days: int
    status: str
    risk_score: int
    reputation_tier: str
    verified_purchases_ratio: float
    primary_syndicate_id: Optional[str] = None
    dataset: str = "synthetic_demo"
    stats: ReviewerStats
    top_flagged_patterns: List[str]
    timeline: List[ReviewerTimelineItem]


# Alias for compatibility
ReviewerProfileResponse = ReviewerDetailResponse


# ============================================================================
# EDA Schemas (GET /api/eda)
# ============================================================================
class EdaSummary(BaseModel):
    totalReviews: int
    genuineCount: int
    fakeCount: int
    fakePercentage: float
    genuinePercentage: float
    totalReviewers: int
    totalProducts: int
    avgRatingGenuine: float
    avgRatingFake: float
    avgLengthGenuine: float
    avgLengthFake: float
    burstPeriodsIdentified: int


class ClassDistributionItem(BaseModel):
    label: str
    count: int
    percentage: float
    color: str


class RatingDistributionItem(BaseModel):
    star: int
    rating: str
    genuineCount: int
    genuinePercentage: float
    fakeCount: int
    fakePercentage: float


class ReviewLengthItem(BaseModel):
    range: str
    genuine: int
    fake: int
    genuinePct: float
    fakePct: float


class ReviewsPerReviewerItem(BaseModel):
    bin: str
    genuine: int
    fake: int
    genuinePct: float
    fakePct: float


class MonthlyVolumeItem(BaseModel):
    month: str
    genuine: int
    fake: int
    isSpike: bool
    label: str
    spikeName: Optional[str] = None


class EdaResponse(BaseModel):
    dataset: str = "synthetic_demo"
    summary: EdaSummary
    classDistribution: List[ClassDistributionItem]
    ratingDistribution: List[RatingDistributionItem]
    reviewLengthHistogram: List[ReviewLengthItem]
    reviewsPerReviewer: List[ReviewsPerReviewerItem]
    monthlyVolume: List[MonthlyVolumeItem]
