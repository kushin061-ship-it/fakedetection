/**
 * Mock data for Model Comparison and Confusion Matrices
 * Routes:
 * - GET /api/models/compare
 * - GET /api/models/confusion/{model}
 */

// Helper to generate realistic ROC curve points (monotonic increasing)
const generateRocCurve = (auc) => {
  const points = [{ fpr: 0, tpr: 0 }];
  const steps = [
    0.01, 0.03, 0.05, 0.08, 0.12, 0.16, 0.22, 0.28, 0.35, 0.42,
    0.50, 0.58, 0.66, 0.74, 0.82, 0.89, 0.94, 0.97, 0.99, 1.0,
  ];

  const exponent = Math.max(0.08, (1 - auc) * 2.2);

  steps.forEach((fpr) => {
    let tpr = Math.min(1.0, Math.pow(fpr, exponent) * 0.98 + (1 - exponent) * 0.05);
    if (fpr === 1.0) tpr = 1.0;
    points.push({
      fpr: parseFloat(fpr.toFixed(3)),
      tpr: parseFloat(Math.min(1, Math.max(points[points.length - 1].tpr, tpr)).toFixed(3)),
    });
  });

  return points;
};

export const mockModels = [
  {
    id: 'xgboost',
    name: 'XGBoost',
    displayName: 'XGBoost (Champion)',
    type: 'Gradient Boosted Trees',
    isBest: true,
    metrics: {
      accuracy: 0.914,
      precision: 0.898,
      recall: 0.907,
      f1: 0.902,
      rocAuc: 0.962,
    },
    confusionMatrix: {
      labels: ['Genuine', 'Fake'],
      matrix: [
        [7995, 205], // True Genuine (TN: 7995), False Fake (FP: 205)
        [167, 1633], // False Genuine (FN: 167), True Fake (TP: 1633)
      ],
      tn: 7995,
      fp: 205,
      fn: 167,
      tp: 1633,
      total: 10000,
      normalized: [
        [0.975, 0.025],
        [0.093, 0.907],
      ],
    },
    rocCurve: generateRocCurve(0.962),
    trainingTimeSeconds: 42.6,
    featureImportanceTop: ['same_day_review_count', 'extreme_rating_ratio', 'burst_indicator', 'sentiment_polarity'],
  },
  {
    id: 'lightgbm',
    name: 'LightGBM',
    displayName: 'LightGBM',
    type: 'Gradient Boosted Trees',
    isBest: false,
    metrics: {
      accuracy: 0.906,
      precision: 0.887,
      recall: 0.895,
      f1: 0.891,
      rocAuc: 0.953,
    },
    confusionMatrix: {
      labels: ['Genuine', 'Fake'],
      matrix: [
        [7970, 230],
        [189, 1611],
      ],
      tn: 7970,
      fp: 230,
      fn: 189,
      tp: 1611,
      total: 10000,
      normalized: [
        [0.972, 0.028],
        [0.105, 0.895],
      ],
    },
    rocCurve: generateRocCurve(0.953),
    trainingTimeSeconds: 14.2,
    featureImportanceTop: ['same_day_review_count', 'burst_indicator', 'extreme_rating_ratio', 'review_length'],
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    displayName: 'Random Forest',
    type: 'Ensemble Trees',
    isBest: false,
    metrics: {
      accuracy: 0.882,
      precision: 0.865,
      recall: 0.860,
      f1: 0.862,
      rocAuc: 0.932,
    },
    confusionMatrix: {
      labels: ['Genuine', 'Fake'],
      matrix: [
        [7920, 280],
        [252, 1548],
      ],
      tn: 7920,
      fp: 280,
      fn: 252,
      tp: 1548,
      total: 10000,
      normalized: [
        [0.966, 0.034],
        [0.140, 0.860],
      ],
    },
    rocCurve: generateRocCurve(0.932),
    trainingTimeSeconds: 68.5,
    featureImportanceTop: ['review_length', 'extreme_rating_ratio', 'sentiment_polarity', 'exclamation_count'],
  },
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    displayName: 'Logistic Regression',
    type: 'Linear Model',
    isBest: false,
    metrics: {
      accuracy: 0.835,
      precision: 0.812,
      recall: 0.804,
      f1: 0.808,
      rocAuc: 0.887,
    },
    confusionMatrix: {
      labels: ['Genuine', 'Fake'],
      matrix: [
        [7810, 390],
        [353, 1447],
      ],
      tn: 7810,
      fp: 390,
      fn: 353,
      tp: 1447,
      total: 10000,
      normalized: [
        [0.952, 0.048],
        [0.196, 0.804],
      ],
    },
    rocCurve: generateRocCurve(0.887),
    trainingTimeSeconds: 3.1,
    featureImportanceTop: ['exclamation_count', 'review_length', 'extreme_rating_ratio', 'time_gap_days'],
  },
  {
    id: 'naive_bayes',
    name: 'Naive Bayes',
    displayName: 'Multinomial Naive Bayes',
    type: 'Probabilistic Model',
    isBest: false,
    metrics: {
      accuracy: 0.791,
      precision: 0.764,
      recall: 0.772,
      f1: 0.768,
      rocAuc: 0.841,
    },
    confusionMatrix: {
      labels: ['Genuine', 'Fake'],
      matrix: [
        [7620, 580],
        [410, 1390],
      ],
      tn: 7620,
      fp: 580,
      fn: 410,
      tp: 1390,
      total: 10000,
      normalized: [
        [0.929, 0.071],
        [0.228, 0.772],
      ],
    },
    rocCurve: generateRocCurve(0.841),
    trainingTimeSeconds: 1.2,
    featureImportanceTop: ['sentiment_polarity', 'lexical_diversity', 'all_caps_word_ratio'],
  },
];

export const mockModelComparison = {
  models: mockModels,
  summary: {
    bestModel: 'XGBoost',
    bestF1: 0.902,
    bestRocAuc: 0.962,
    evaluationDatasetSize: 10000,
    splitRatio: '80/20 Train/Test',
  },
};

export const getModelConfusionMatrix = (modelName) => {
  if (!modelName) {
    return mockModels[0].confusionMatrix;
  }
  const cleanName = modelName.toLowerCase().replace(/[\s-_]+/g, '');
  const found = mockModels.find((m) => {
    const idClean = m.id.toLowerCase().replace(/[\s-_]+/g, '');
    const nameClean = m.name.toLowerCase().replace(/[\s-_]+/g, '');
    return idClean === cleanName || nameClean === cleanName;
  });

  return found ? found.confusionMatrix : mockModels[0].confusionMatrix;
};

export default mockModelComparison;
