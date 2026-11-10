"""Fake Review Detection FastAPI Main Application."""

import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import HealthResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("fake_review_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown."""
    logger.info("Starting Fake Review Detection Backend Service...")
    # Attempt to load artifacts at startup if services package is ready
    try:
        from app.services.artifacts import artifact_manager
        artifact_manager.load_all()
        logger.info(f"Artifacts loaded successfully: {artifact_manager.is_loaded()}")
    except Exception as exc:
        logger.warning(f"Artifacts could not be loaded on startup: {exc}. Run 'python -m ml.run_pipeline' to generate artifacts.")
    yield
    logger.info("Shutting down Fake Review Detection Backend Service...")


app = FastAPI(
    title="Fake Review Detection & Explainability API",
    description="Backend API for Fake Review Detection using Machine Learning, SHAP, and Pattern Mining.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """System health check and artifact readiness probe."""
    try:
        from app.services.artifacts import artifact_manager
        is_ready = artifact_manager.is_loaded()
        dataset_name = artifact_manager.dataset_name
    except Exception:
        is_ready = False
        dataset_name = "synthetic_demo"

    return HealthResponse(
        status="ok",
        version="1.0.0",
        artifacts_loaded=is_ready,
        dataset=dataset_name,
    )


@app.get("/", tags=["System"])
async def root() -> Dict[str, Any]:
    """Root endpoint with service metadata and documentation links."""
    return {
        "service": "Fake Review Detection API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health",
        "disclaimer": "Preliminary analytical result. Does not replace human verification or platform-level moderation.",
    }


# Optional routers will be registered as they are implemented
def register_routers():
    """Dynamically register API routers if available."""
    try:
        from app.routers import eda, predict, models, errors, explain, patterns
        app.include_router(eda.router, prefix="/api", tags=["EDA"])
        app.include_router(predict.router, prefix="/api", tags=["Prediction"])
        app.include_router(models.router, prefix="/api", tags=["Models"])
        app.include_router(errors.router, prefix="/api", tags=["Errors"])
        app.include_router(explain.router, prefix="/api", tags=["Explainability"])
        app.include_router(patterns.router, prefix="/api", tags=["Patterns & Reviewers"])
        logger.info("All API routers registered successfully.")
    except ImportError as e:
        logger.info(f"Router module not yet loaded: {e}")


# Register routers at module load
register_routers()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

