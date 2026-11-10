# Fake Review Detection API Specification & Contract

This document specifies the RESTful API contract between the frontend and the future backend service for the **Fake Review Detection & Explainability Platform**.

---

## 1. Environment & Architecture Overview

The frontend communicates with the backend via `src/api/client.js` (an Axios client instance) and `src/api/index.js` (an API service layer).

### Environment Variables
Configure these variables in `.env` or `.env.local`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | String | `http://localhost:8000` | Target URL for the Python/FastAPI/Node backend service |
| `VITE_USE_MOCK` | Boolean | `true` | When `true`, all requests return realistic local mock data with an artificial 400–800ms latency without making network requests |

---

## 2. API Endpoints Contract

### Summary of Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/eda` | Exploratory data analysis metrics, class balance, rating spreads, histograms, and 24-month volume trends |
| `POST` | `/api/predict` | Single review inference: fake probability, classification, top 10 SHAP features, and guidance |
| `POST` | `/api/predict/batch` | Bulk review inference via CSV or JSON file upload |
| `GET` | `/api/models/compare` | Model performance leaderboard, F1 scores, ROC-AUC, and 20-point ROC curves |
| `GET` | `/api/models/confusion/{model}` | Detailed confusion matrix for a specific model |
| `GET` | `/api/errors` | Filtered and paginated model classification errors (FP, FN, Low Confidence) |
| `GET` | `/api/explain/global` | Global SHAP feature importances across Textual, Behavioral, and Temporal domains |
| `GET` | `/api/patterns` | Data-mined association rules and high-risk syndicate reviewers |
| `GET` | `/api/reviewer/{id}` | Reviewer profile, lifetime statistics, and interactive review timeline |

---

### 2.1 GET `/api/eda`
Fetches dataset distribution metrics, rating histograms, and temporal volume series.

#### Request
- **Headers:** `Accept: application/json`
- **Query Parameters:** None

#### Response (`200 OK`)
```json
{
  "summary": {
    "totalReviews": 50000,
    "genuineCount": 41000,
    "fakeCount": 9000,
    "fakePercentage": 18.0,
    "genuinePercentage": 82.0,
    "totalReviewers": 32410,
    "totalProducts": 4820,
    "avgRatingGenuine": 3.78,
    "avgRatingFake": 4.12,
    "avgLengthGenuine": 342,
    "avgLengthFake": 186,
    "burstPeriodsIdentified": 3
  },
  "classDistribution": [
    { "label": "Genuine", "count": 41000, "percentage": 82.0, "color": "#10b981" },
    { "label": "Fake", "count": 9000, "percentage": 18.0, "color": "#ef4444" }
  ],
  "ratingDistribution": [
    {
      "star": 1,
      "rating": "1 Star",
      "genuineCount": 3321,
      "genuinePercentage": 8.1,
      "fakeCount": 2025,
      "fakePercentage": 22.5
    },
    {
      "star": 5,
      "rating": "5 Stars",
      "genuineCount": 14145,
      "genuinePercentage": 34.5,
      "fakeCount": 5040,
      "fakePercentage": 56.0
    }
  ],
  "reviewLengthHistogram": [
    { "range": "1-20 words", "genuine": 3200, "fake": 3840, "genuinePct": 7.8, "fakePct": 42.7 },
    { "range": "21-50 words", "genuine": 6850, "fake": 2520, "genuinePct": 16.7, "fakePct": 28.0 }
  ],
  "reviewsPerReviewer": [
    { "bin": "1 review", "genuine": 21500, "fake": 5940, "genuinePct": 52.4, "fakePct": 66.0 },
    { "bin": "2-3 reviews", "genuine": 11800, "fake": 1170, "genuinePct": 28.8, "fakePct": 13.0 }
  ],
  "monthlyVolume": [
    { "month": "2024-11", "genuine": 1480, "fake": 210, "isSpike": false, "label": "Nov 24" },
    { "month": "2025-06", "genuine": 1720, "fake": 1420, "isSpike": true, "spikeName": "Summer Promo Burst", "label": "Jun 25" }
  ]
}
```

---

### 2.2 POST `/api/predict`
Evaluates a single review for authenticity with real-time SHAP feature attribution.

#### Request Body (`application/json`)
```json
{
  "review_text": "BEST HEADPHONES EVER!! 10/10 MUST BUY NOW!! Completely transformed my life!",
  "rating": 5,
  "reviewer_id": "USR-9982",
  "is_verified": false,
  "same_day_review_count": 4
}
```

#### Response (`200 OK`)
```json
{
  "label": "fake",
  "fake_probability": 0.942,
  "genuine_probability": 0.058,
  "confidence_score": 0.884,
  "low_confidence": false,
  "recommendation": "Flagged for moderation / quarantine",
  "top_shap_features": [
    {
      "rank": 1,
      "feature": "exclamation_count",
      "displayName": "Exclamation Mark Density",
      "group": "textual",
      "value": "4 marks",
      "shap_value": 0.32,
      "direction": "pushes_fake",
      "impact": "high"
    },
    {
      "rank": 2,
      "feature": "extreme_rating_ratio",
      "displayName": "Extreme Rating Indicator",
      "group": "behavioral",
      "value": "5 Stars",
      "shap_value": 0.285,
      "direction": "pushes_fake",
      "impact": "high"
    }
  ],
  "metrics_breakdown": {
    "textual_score": 0.92,
    "behavioral_score": 0.85,
    "temporal_score": 0.78
  },
  "disclaimer": "AI-generated prediction based on ensemble model (XGBoost Classifier v2.4). For human-in-the-loop validation only. Confidence thresholds: Genuine < 0.40, Low Confidence 0.40–0.60, Fake > 0.60.",
  "timestamp": "2026-10-12T10:15:30.120Z"
}
```

---

### 2.3 POST `/api/predict/batch`
Performs batch predictions over uploaded CSV or JSON files.

#### Request (`multipart/form-data`)
- **Body:** `file` (Binary file containing columns: `review_text`, `rating`, optional `reviewer_id`)

#### Response (`200 OK`)
```json
{
  "filename": "q3_customer_reviews.csv",
  "total_processed": 500,
  "fake_count": 92,
  "genuine_count": 408,
  "low_confidence_count": 24,
  "flagged_rate": 18.4,
  "processed_at": "2026-10-12T10:15:30.120Z",
  "results": [
    {
      "id": "BATCH-001",
      "review_text": "Great product item as described fast shipping 5 stars.",
      "rating": 5,
      "fake_probability": 0.68,
      "label": "fake",
      "low_confidence": false
    }
  ]
}
```

---

### 2.4 GET `/api/models/compare`
Retrieves benchmark metrics and comparison data across all trained classification models.

#### Response (`200 OK`)
```json
{
  "summary": {
    "bestModel": "XGBoost",
    "bestF1": 0.902,
    "bestRocAuc": 0.962,
    "evaluationDatasetSize": 10000,
    "splitRatio": "80/20 Train/Test"
  },
  "models": [
    {
      "id": "xgboost",
      "name": "XGBoost",
      "displayName": "XGBoost (Champion)",
      "type": "Gradient Boosted Trees",
      "isBest": true,
      "metrics": {
        "accuracy": 0.914,
        "precision": 0.898,
        "recall": 0.907,
        "f1": 0.902,
        "rocAuc": 0.962
      },
      "confusionMatrix": {
        "labels": ["Genuine", "Fake"],
        "matrix": [[7995, 205], [167, 1633]],
        "tn": 7995,
        "fp": 205,
        "fn": 167,
        "tp": 1633,
        "total": 10000,
        "normalized": [[0.975, 0.025], [0.093, 0.907]]
      },
      "rocCurve": [
        { "fpr": 0.0, "tpr": 0.0 },
        { "fpr": 0.05, "tpr": 0.884 },
        { "fpr": 0.12, "tpr": 0.941 },
        { "fpr": 1.0, "tpr": 1.0 }
      ],
      "trainingTimeSeconds": 42.6
    }
  ]
}
```

---

### 2.5 GET `/api/models/confusion/{model}`
Retrieves confusion matrix details for a designated model ID.

#### Parameters
- **Path Parameter:** `model` (e.g., `xgboost`, `lightgbm`, `random_forest`, `logistic_regression`, `naive_bayes`)

#### Response (`200 OK`)
```json
{
  "labels": ["Genuine", "Fake"],
  "matrix": [
    [7995, 205],
    [167, 1633]
  ],
  "tn": 7995,
  "fp": 205,
  "fn": 167,
  "tp": 1633,
  "total": 10000,
  "normalized": [
    [0.975, 0.025],
    [0.093, 0.907]
  ]
}
```

---

### 2.6 GET `/api/errors`
Returns false positive, false negative, and low-confidence test samples for error analysis.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `type` | String | No | `'all'` | Filter: `'all'`, `'false_positive'`, `'false_negative'`, `'low_confidence'` |
| `page` | Integer | No | `1` | 1-indexed page number |
| `limit` | Integer | No | `10` | Page size limit |
| `search` | String | No | `""` | Substring match against review text, ID, or product name |

#### Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "ERR-FP-001",
      "error_type": "false_positive",
      "review_text": "DO NOT BUY THIS TRASH!! Stopped working after literally two days and customer support refused to refund!!",
      "rating": 1,
      "predicted_label": "fake",
      "true_label": "genuine",
      "probability": 0.89,
      "reviewer_id": "USR-GEN-1000",
      "product_name": "UltraBass ANC Pro Headphones",
      "primary_factor": "Excessive caps & angry sentiment extremity",
      "confidence_delta": 0.39
    }
  ],
  "total": 60,
  "page": 1,
  "pageSize": 10,
  "totalPages": 6,
  "summary": {
    "totalFalsePositives": 60,
    "totalFalseNegatives": 60,
    "totalLowConfidence": 40,
    "totalOverall": 160,
    "currentFilteredCount": 60
  }
}
```

---

### 2.7 GET `/api/explain/global`
Returns global feature importance ranked by mean absolute SHAP value.

#### Response (`200 OK`)
```json
{
  "model": "XGBoost (Classifier v2.4)",
  "baseValue": 0.18,
  "numSamplesAnalyzed": 10000,
  "features": [
    {
      "rank": 1,
      "name": "same_day_review_count",
      "displayName": "Same-Day Review Velocity",
      "group": "behavioral",
      "mean_abs_shap": 0.442,
      "impact": "High",
      "direction": "Increases fake likelihood when > 4 reviews/day",
      "description": "Number of distinct reviews published by the author within the same 24-hour calendar window."
    },
    {
      "rank": 2,
      "name": "extreme_rating_ratio",
      "displayName": "Extreme Rating Ratio",
      "group": "behavioral",
      "mean_abs_shap": 0.389,
      "impact": "High",
      "direction": "Increases fake likelihood when concentrated at 1 or 5 stars",
      "description": "Ratio of user ratings that are binary extremes (1-star attacks or 5-star promotional hypes)."
    }
  ],
  "groupSummary": [
    {
      "group": "behavioral",
      "name": "Behavioral Features",
      "color": "#f59e0b",
      "totalMeanShap": 1.385,
      "featureCount": 6,
      "percentage": 38.6
    },
    {
      "group": "textual",
      "name": "Textual Features",
      "color": "#3b82f6",
      "totalMeanShap": 1.284,
      "featureCount": 8,
      "percentage": 35.8
    },
    {
      "group": "temporal",
      "name": "Temporal Features",
      "color": "#a855f7",
      "totalMeanShap": 0.919,
      "featureCount": 6,
      "percentage": 25.6
    }
  ]
}
```

---

### 2.8 GET `/api/patterns`
Retrieves data-mined association rules and list of flagged suspicious accounts.

#### Response (`200 OK`)
```json
{
  "summary": {
    "totalPatterns": 20,
    "criticalPatternsCount": 6,
    "highPatternsCount": 8,
    "totalSuspiciousReviewers": 15,
    "averageFakeShare": 0.825,
    "totalIdentifiedBursts": 104
  },
  "patterns": [
    {
      "id": "PAT-01",
      "rule": "extreme_rating + same-day_burst + short_text => fake_review",
      "antecedents": ["Extreme Rating (1 or 5)", "Same-Day Burst Window", "Short Length (< 25 words)"],
      "consequent": "Fake Review",
      "support": 0.084,
      "confidence": 0.942,
      "lift": 5.23,
      "description": "Reviews posted during high velocity volume bursts with short boilerplate and 1 or 5 star ratings.",
      "riskLevel": "critical"
    }
  ],
  "suspiciousReviewers": [
    {
      "id": "REV-USR-0104",
      "name": "FlashPromo_Global",
      "total_reviews": 184,
      "fake_share": 0.94,
      "burst_count": 11,
      "avg_rating": 4.96,
      "account_age_days": 18,
      "status": "flagged",
      "risk_score": 98,
      "dominant_pattern": "extreme_rating + same-day_burst + short_text",
      "flagged_date": "2026-10-09"
    }
  ]
}
```

---

### 2.9 GET `/api/reviewer/{id}`
Returns reviewer profile details, behavioral statistics, and an event timeline.

#### Parameters
- **Path Parameter:** `id` (e.g., `REV-USR-0104`, `USR-GEN-1000`)

#### Response (`200 OK`)
```json
{
  "id": "REV-USR-0104",
  "name": "FlashPromo_Global",
  "account_created_at": "2026-09-20",
  "account_age_days": 22,
  "status": "flagged",
  "risk_score": 98,
  "reputation_tier": "High Risk (Syndicate Node)",
  "verified_purchases_ratio": 0.08,
  "stats": {
    "total_reviews": 184,
    "fake_reviews_count": 173,
    "genuine_reviews_count": 11,
    "fake_share": 0.94,
    "fake_percentage": 94.0,
    "average_rating": 4.96,
    "extreme_rating_ratio": 0.97,
    "burst_count": 11,
    "max_reviews_single_day": 18,
    "avg_review_length_words": 16.8,
    "avg_sentiment_polarity": 0.92,
    "helpfulness_upvotes_received": 3
  },
  "top_flagged_patterns": [
    "extreme_rating + same-day_burst + short_text (Lift: 5.23)"
  ],
  "timeline": [
    {
      "review_id": "REV-EV-101",
      "product_id": "PRD-8821",
      "product_name": "UltraBass Wireless ANC Pro",
      "category": "Audio",
      "date": "2026-10-10",
      "timestamp": "2026-10-10T14:22:10Z",
      "rating": 5,
      "review_text": "BEST HEADPHONES EVER IN HUMAN HISTORY!! MUST BUY!! Life changing sound!",
      "fake_probability": 0.96,
      "status": "fake",
      "is_burst": true,
      "burst_name": "Launch Syndicate Surge",
      "verified_purchase": false
    }
  ]
}
```

---

## 3. Frontend `useApi` Hook Usage

To consume any of these endpoints in React components with automatic loading, error, and cancellation state, use the `useApi` hook:

```jsx
import React from 'react';
import { getEda, useApi } from '../api';

function EdaDashboard() {
  const { data, loading, error, refetch } = useApi(getEda, []);

  if (loading) return <div>Loading EDA metrics...</div>;
  if (error) return <div>Failed to load EDA data: {error}</div>;

  return (
    <div>
      <h2>Genuine Reviews: {data.summary.genuinePercentage}%</h2>
      <h2>Fake Reviews: {data.summary.fakePercentage}%</h2>
      <button onClick={() => refetch()}>Refresh Data</button>
    </div>
  );
}
```

---

## 4. Backend Implementation Guidelines

When building the backend (e.g., in FastAPI / Python):
1. **CORS:** Ensure CORS middleware allows the frontend origin (`http://localhost:5173` or production domain).
2. **Standard HTTP Codes:**
   - `200 OK`: Successful query / prediction.
   - `400 Bad Request`: Invalid parameters or missing payload keys.
   - `404 Not Found`: Reviewer ID or model not found.
   - `422 Unprocessable Entity`: Validation failure on review text / rating range.
   - `500 Internal Server Error`: Model inference exception.
3. **Data Types:** Ensure numeric values (probabilities, F1, percentages) are serialized as standard JSON floats/integers rather than string representations.
