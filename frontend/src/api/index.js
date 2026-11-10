/**
 * API Service Layer
 *
 * Exposes methods to communicate with the Fake Review Detection backend.
 * When VITE_USE_MOCK is true (or defaulted in development), requests are intercepted
 * and return realistic mock data with an artificial 400-800ms delay.
 */

import apiClient, { USE_MOCK } from './client.js';
import mockEdaData from '../mock/eda.js';
import { mockModelComparison, getModelConfusionMatrix } from '../mock/models.js';
import { filterMockErrors } from '../mock/errors.js';
import mockGlobalExplain from '../mock/explain.js';
import mockPatternsData from '../mock/patterns.js';
import { mockPredictReview, mockPredictBatch } from '../mock/predict.js';
import { getMockReviewer } from '../mock/reviewer.js';

/**
 * Simulates network latency between 400ms and 800ms
 */
const mockDelay = () => {
  const ms = Math.floor(Math.random() * 401) + 400; // 400ms to 800ms
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if mock mode is active
 */
export const isMockMode = () => USE_MOCK;

/**
 * GET /api/eda
 * Fetches exploratory data analysis dataset statistics, class & rating distributions,
 * word length histograms, and 24-month time-series volume with burst spikes.
 */
export const getEda = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return mockEdaData;
  }
  const response = await apiClient.get('/api/eda');
  return response.data;
};

/**
 * POST /api/predict
 * Analyzes a single review and returns fake probability, label, confidence,
 * top SHAP explanatory features, and compliance disclaimer.
 * @param {Object} payload - { review_text, rating, reviewer_id?, ... }
 */
export const predictReview = async (payload) => {
  if (USE_MOCK) {
    await mockDelay();
    return mockPredictReview(payload);
  }
  const response = await apiClient.post('/api/predict', payload);
  return response.data;
};

/**
 * POST /api/predict/batch
 * Uploads a file (CSV/JSON) containing multiple reviews for bulk analysis.
 * @param {File|Blob} file - Uploaded review file
 */
export const predictBatch = async (file) => {
  if (USE_MOCK) {
    await mockDelay();
    return mockPredictBatch(file);
  }
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/api/predict/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * GET /api/models/compare
 * Returns comparative performance metrics (accuracy, precision, recall, F1, ROC-AUC)
 * for Logistic Regression, Naive Bayes, Random Forest, XGBoost, and LightGBM,
 * along with confusion matrices and 20-point ROC curves.
 */
export const getModelComparison = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return mockModelComparison;
  }
  const response = await apiClient.get('/api/models/compare');
  return response.data;
};

/**
 * GET /api/models/confusion/{model}
 * Retrieves the confusion matrix details for a specific model.
 * @param {string} modelName - Model identifier (e.g. 'xgboost', 'lightgbm', 'random_forest')
 */
export const getConfusion = async (modelName) => {
  if (USE_MOCK) {
    await mockDelay();
    return getModelConfusionMatrix(modelName);
  }
  const response = await apiClient.get(`/api/models/confusion/${encodeURIComponent(modelName)}`);
  return response.data;
};

/**
 * GET /api/errors
 * Retrieves misclassified or borderline model inference cases.
 * @param {string} type - 'all' | 'false_positive' | 'false_negative' | 'low_confidence'
 * @param {number} page - Page number (1-indexed)
 * @param {string} search - Search query string
 * @param {number} limit - Items per page (default: 10)
 */
export const getErrors = async (typeOrOptions = 'all', page = 1, search = '', limit = 10) => {
  let type = typeOrOptions;
  let pageNum = page;
  let searchTerm = search;
  let pageSize = limit;

  if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
    type = typeOrOptions.type ?? 'all';
    pageNum = typeOrOptions.page ?? 1;
    searchTerm = typeOrOptions.search ?? '';
    pageSize = typeOrOptions.limit ?? typeOrOptions.pageSize ?? 10;
  }

  if (USE_MOCK) {
    await mockDelay();
    return filterMockErrors({ type, page: pageNum, search: searchTerm, pageSize });
  }
  const params = { type, page: pageNum, search: searchTerm, limit: pageSize };
  const response = await apiClient.get('/api/errors', { params });
  return response.data;
};

/**
 * GET /api/explain/global
 * Returns global SHAP explainability analysis including the top 20 features across
 * textual, behavioral, and temporal domains with mean absolute SHAP values.
 */
export const getGlobalExplain = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return mockGlobalExplain;
  }
  const response = await apiClient.get('/api/explain/global');
  return response.data;
};

/**
 * GET /api/patterns
 * Returns data-mined association patterns (support, confidence, lift)
 * and identified suspicious reviewers with anomaly metrics.
 */
export const getPatterns = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return mockPatternsData;
  }
  const response = await apiClient.get('/api/patterns');
  return response.data;
};

/**
 * GET /api/reviewer/{id}
 * Retrieves comprehensive reviewer profile statistics and a chronological review timeline.
 * @param {string} id - Reviewer ID (e.g. 'REV-USR-0104')
 */
export const getReviewer = async (id) => {
  if (USE_MOCK) {
    await mockDelay();
    return getMockReviewer(id);
  }
  const response = await apiClient.get(`/api/reviewer/${encodeURIComponent(id)}`);
  return response.data;
};

export { useApi } from '../hooks/useApi.js';

export default {
  getEda,
  predictReview,
  predictBatch,
  getModelComparison,
  getConfusion,
  getErrors,
  getGlobalExplain,
  getPatterns,
  getReviewer,
  isMockMode,
};
