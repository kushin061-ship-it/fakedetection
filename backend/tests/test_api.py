"""Integration tests for all FastAPI endpoints in Fake Review Detection platform."""

import io
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.artifacts import artifact_manager


@pytest.fixture(scope="module", autouse=True)
def ensure_artifacts():
    """Ensure artifacts are loaded before API testing."""
    if not artifact_manager.is_loaded():
        artifact_manager.load_all()
    assert artifact_manager.is_loaded(), "Artifacts must be loaded for API tests."


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


def test_health_check(client):
    """Verify /health returns 200 and indicates artifacts are loaded."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert data["artifacts_loaded"] is True
    assert "dataset" in data


def test_root_endpoint(client):
    """Verify root endpoint returns service metadata and legal disclaimer."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Fake Review Detection API"
    assert "disclaimer" in data


def test_get_eda_overview(client):
    """Verify /api/eda returns complete dataset statistics and distributions."""
    response = client.get("/api/eda")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "classDistribution" in data
    assert "ratingDistribution" in data
    assert "reviewLengthHistogram" in data
    assert "monthlyVolume" in data
    assert data["summary"]["totalReviews"] > 0
    assert len(data["classDistribution"]) == 2


def test_predict_single_review_fake(client):
    """Verify /api/predict correctly analyzes deceptive review with SHAP features."""
    payload = {
        "review_text": "BEST HEADPHONES EVER IN HUMAN HISTORY!! MUST BUY NOW!! Completely transformed my life!",
        "rating": 5,
        "reviewer_id": "USR-TEST-9999",
        "review_date": "2026-05-15",
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["label"] in ["fake", "genuine"]
    assert 0.0 <= data["fake_probability"] <= 1.0
    assert 0.0 <= data["genuine_probability"] <= 1.0
    assert "confidence_score" in data
    assert "recommendation" in data
    assert "top_shap_features" in data
    assert len(data["top_shap_features"]) <= 10
    assert "disclaimer" in data
    assert "Preliminary analytical result" in data["disclaimer"]

    # Verify SHAP feature structure
    top_feature = data["top_shap_features"][0]
    assert "feature" in top_feature
    assert "displayName" in top_feature
    assert "group" in top_feature
    assert top_feature["group"] in ["textual", "behavioral", "temporal"]
    assert top_feature["direction"] in ["pushes_fake", "pushes_genuine"]


def test_predict_single_review_genuine(client):
    """Verify /api/predict handles normal genuine review."""
    payload = {
        "review_text": "The headphones have decent battery life, lasting about two days of commute. The ear cups get a bit warm after three hours.",
        "rating": 4,
        "reviewer_id": "USR-GEN-100",
        "date": "2026-02-10",
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "fake_probability" in data
    assert "metrics_breakdown" in data
    assert data["metrics_breakdown"]["textual_score"] >= 0.0


def test_predict_validation_errors(client):
    """Verify validation triggers 422 on invalid rating or missing review text."""
    # Invalid rating (> 5)
    res = client.post("/api/predict", json={"review_text": "Good", "rating": 6})
    assert res.status_code == 422

    # Invalid rating (< 1)
    res = client.post("/api/predict", json={"review_text": "Bad", "rating": 0})
    assert res.status_code == 422

    # Missing review_text
    res = client.post("/api/predict", json={"rating": 5})
    assert res.status_code == 422


def test_predict_batch_csv(client):
    """Verify /api/predict/batch with CSV file upload."""
    csv_content = (
        "review_text,rating,reviewer_id\n"
        "BEST PRODUCT EVER BUY NOW!!!,5,USR-001\n"
        "Solid build quality and reliable battery life.,4,USR-002\n"
        "Broke on day one complete scam do not purchase,1,USR-003\n"
    )
    files = {"file": ("test_reviews.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/predict/batch", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_processed"] == 3
    assert data["fake_count"] + data["genuine_count"] == 3
    assert len(data["results"]) == 3
    assert "flagged_rate" in data
    assert data["results"][0]["id"] == "BATCH-0001"


def test_predict_batch_json(client):
    """Verify /api/predict/batch with JSON file upload."""
    json_data = [
        {"review_text": "Incredible sound quality and fast pairing.", "rating": 5, "reviewer_id": "USR-101"},
        {"review_text": "TERRIBLE JUNK DO NOT BUY!!!", "rating": 1, "reviewer_id": "USR-102"},
    ]
    json_bytes = json.dumps(json_data).encode("utf-8")
    files = {"file": ("reviews.json", io.BytesIO(json_bytes), "application/json")}
    response = client.post("/api/predict/batch", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_processed"] == 2
    assert len(data["results"]) == 2


def test_predict_batch_invalid_extension(client):
    """Verify /api/predict/batch rejects non-csv/json files."""
    files = {"file": ("test.txt", io.BytesIO(b"Hello world"), "text/plain")}
    response = client.post("/api/predict/batch", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_predict_batch_missing_columns(client):
    """Verify /api/predict/batch rejects CSV missing required columns."""
    csv_content = "some_random_column,another_col\nvalue1,value2\n"
    files = {"file": ("invalid.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/predict/batch", files=files)
    assert response.status_code == 400
    assert "missing required columns" in response.json()["detail"]


def test_model_comparison(client):
    """Verify /api/models/compare returns leaderboard metrics and ROC curves."""
    response = client.get("/api/models/compare")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "models" in data
    assert data["summary"]["bestModel"] != ""
    assert len(data["models"]) >= 1

    champion = [m for m in data["models"] if m.get("isBest")]
    assert len(champion) == 1
    assert "metrics" in champion[0]
    assert "accuracy" in champion[0]["metrics"]
    assert "f1" in champion[0]["metrics"]
    assert "rocCurve" in champion[0]


def test_model_confusion_matrix(client):
    """Verify /api/models/confusion/{model_id} returns matrix metrics."""
    response = client.get("/api/models/confusion/xgboost")
    assert response.status_code == 200
    data = response.json()
    assert "labels" in data
    assert "matrix" in data
    assert "tn" in data
    assert "fp" in data
    assert "fn" in data
    assert "tp" in data


def test_model_confusion_not_found(client):
    """Verify /api/models/confusion/{model_id} returns 404 for unknown model."""
    response = client.get("/api/models/confusion/non_existent_model_id_xyz")
    assert response.status_code == 404


def test_get_errors(client):
    """Verify /api/errors returns error cases with pagination and summary."""
    response = client.get("/api/errors")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "summary" in data
    assert "total" in data
    assert data["summary"]["totalOverall"] > 0
    assert len(data["data"]) <= 10


def test_get_errors_filtered(client):
    """Verify /api/errors filtering by false_positive and pagination."""
    response = client.get("/api/errors?type=false_positive&page=1&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["pageSize"] == 5
    for item in data["data"]:
        assert item["error_type"] == "false_positive"


def test_get_errors_search(client):
    """Verify /api/errors keyword search."""
    response = client.get("/api/errors?search=trash")
    assert response.status_code == 200
    data = response.json()
    for item in data["data"]:
        text = str(item.get("review_text", "")).lower()
        factor = str(item.get("primary_factor", "")).lower()
        assert "trash" in text or "trash" in factor or "trash" in str(item).lower()


def test_explain_global(client):
    """Verify /api/explain/global returns global feature importances and group summaries."""
    response = client.get("/api/explain/global")
    assert response.status_code == 200
    data = response.json()
    assert "model" in data
    assert "features" in data
    assert len(data["features"]) > 0
    assert "groupSummary" in data
    assert len(data["groupSummary"]) >= 3


def test_patterns(client):
    """Verify /api/patterns returns association rules and suspicious reviewers."""
    response = client.get("/api/patterns")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "patterns" in data
    assert len(data["patterns"]) > 0
    assert "suspiciousReviewers" in data
    assert len(data["suspiciousReviewers"]) > 0


def test_reviewer_profile(client):
    """Verify /api/reviewer/{id} returns profile, stats, and timeline."""
    # Fetch first suspicious reviewer ID from patterns
    patterns_res = client.get("/api/patterns")
    suspicious = patterns_res.json()["suspiciousReviewers"]
    rev_id = suspicious[0]["id"]

    response = client.get(f"/api/reviewer/{rev_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == rev_id
    assert "stats" in data
    assert "timeline" in data
    assert len(data["timeline"]) > 0
    assert "risk_score" in data


def test_reviewer_not_found(client):
    """Verify /api/reviewer/{id} returns 404 for unknown reviewer ID."""
    response = client.get("/api/reviewer/NON_EXISTENT_REVIEWER_ID_XYZ")
    assert response.status_code == 404
