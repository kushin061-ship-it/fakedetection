# Project Rules — Fake Review Detection Backend

## 1. No Data Leakage
- **Split First**: The dataset is split into stratified Train (70%), Validation (15%), and Test (15%) splits BEFORE any transformer, vectorizer, or encoder is fitted.
- **Fit on Train Only**: All TF-IDF vectorizers, standard scalers, and imputers are fitted solely on the training partition. Validation and Test splits are strictly transformed.
- **Point-in-Time Temporal & Behavioral Aggregates**: Reviewer statistics (e.g., historical review counts, average rating, extreme rating ratio) and temporal windows must be computed using only information available at or prior to the review timestamp, avoiding future information leakage.

## 2. Determinism & Type Safety
- **Random Seed**: All random seeds across NumPy, Scikit-Learn, XGBoost, and LightGBM are fixed at `42` (`RANDOM_STATE = 42`).
- **Type Annotations**: Python type hints (`typing.Optional`, `typing.List`, `typing.Dict`, `typing.Tuple`, `pydantic.BaseModel`) are enforced across all services, routers, and ML pipeline modules.

## 3. Inference Decoupling (Artifact-Only API)
- The FastAPI application **only loads pre-trained artifacts** (`.joblib` and `.json` in `backend/models/`) at application startup.
- The API **never trains or fits models at request time**.
- If artifacts are missing, the API gracefully returns HTTP 503 Service Unavailable instructing the operator to run `python -m ml.run_pipeline`.

## 4. Feature Engineering Scope
- Feature space is strictly limited to three established domain groups:
  1. **Textual**: Linguistic extremity, character/word lengths, sentiment polarity/subjectivity, punctuation frequency, all-caps ratios, TF-IDF n-grams.
  2. **Behavioral**: Reviewer velocity, historical rating deviation, rating variance, extreme rating ratio, lifetime review counts.
  3. **Temporal**: Same-day review bursts, 7-day product review surge counts, time gap since previous review, burst window indicators.
- No out-of-scope metadata features (e.g. user geolocation, device fingerprints, unverified external metrics) are permitted.

## 5. Ethical AI & Mandatory Disclaimers
- All prediction and batch outputs must include the explicit legal & operational disclaimer:
  > *"Preliminary analytical result. Does not replace human verification or platform-level moderation."*
- Model explanations and mined association rules represent statistical patterns within the training corpus and do not constitute definitive legal proof of fraudulent intent.
