import React from 'react';
import { Info, Layers, Cpu, Database, GitBranch, Award } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';

const ML_MODELS = [
  {
    name: 'XGBoost',
    color: '#3A78F2',
    role: 'Structured Feature Classifier',
    desc: 'Analyzes engineered numerical features — textual statistics, behavioral indicators, and temporal patterns — using gradient-boosted decision trees for high-accuracy predictions.',
  },
  {
    name: 'LightGBM',
    color: '#2FAE7A',
    role: 'Gradient Boosting',
    desc: 'Highly efficient gradient-boosted framework with leaf-wise tree growth. Fast training on large datasets with strong performance on structured tabular features.',
  },
  {
    name: 'Random Forest',
    color: '#E8A838',
    role: 'Ensemble Classifier',
    desc: 'Bagging ensemble of decision trees that reduces overfitting through feature randomization, providing robust predictions on imbalanced datasets.',
  },
  {
    name: 'Logistic Regression',
    color: '#E05A5A',
    role: 'Baseline Classifier',
    desc: 'Linear model providing interpretable probability scores and acting as a calibration baseline for the ensemble combination.',
  },
  {
    name: 'Naive Bayes',
    color: '#9B6DFF',
    role: 'Probabilistic Classifier',
    desc: 'Fast probabilistic classifier leveraging text-feature distributions, performing well on sparse high-dimensional text feature vectors.',
  },
];

const FEATURES = [
  {
    category: 'Textual Features',
    icon: '📝',
    color: '#3A78F2',
    bg: '#EEF4FF',
    items: [
      'Word count & character count',
      'Average sentence length',
      'Sentiment score (positive/negative/neutral)',
      'Repeated word ratio',
      'Excessive punctuation detection',
      'Capitalization patterns',
      'TF-IDF weighted term scores',
    ],
  },
  {
    category: 'Behavioral Features',
    icon: '👤',
    color: '#2FAE7A',
    bg: '#F0FBF6',
    items: [
      'Total reviews by user',
      'Review submission frequency',
      'Average user rating',
      'Rating variance',
      'Duplicate review patterns',
      'Product diversity score',
    ],
  },
  {
    category: 'Temporal Features',
    icon: '🕐',
    color: '#E8A838',
    bg: '#FFFBEB',
    items: [
      'Review submission timestamp',
      'Time between consecutive reviews',
      'Review burst detection',
      'Review frequency within intervals',
      'Unusual submission timing patterns',
    ],
  },
];

const TECH_STACK = [
  { name: 'React 18', role: 'Frontend Framework', icon: '⚛️' },
  { name: 'Tailwind CSS', role: 'Styling System', icon: '🎨' },
  { name: 'Recharts', role: 'Data Visualization', icon: '📊' },
  { name: 'FastAPI', role: 'Backend API', icon: '⚡' },
  { name: 'scikit-learn', role: 'ML Pipeline', icon: '🤖' },
  { name: 'XGBoost', role: 'Primary ML Model', icon: '🌳' },
  { name: 'SHAP', role: 'Explainability', icon: '🔍' },
  { name: 'pandas', role: 'Data Processing', icon: '🐼' },
];

function Section({ icon: Icon, title, children, iconColor = 'text-tl-accent' }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon size={18} className={iconColor} />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="About Project"
        subtitle="FakeReviewAI — an intelligent review authenticity detection system powered by ensemble machine learning."
      />

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-[#EEF4FF] to-[#F6F9FE] border-tl-accent/30">
        <CardContent className="py-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-tl-text mb-3">FakeReviewAI</h2>
            <p className="text-sm text-tl-text leading-relaxed mb-4">
              FakeReviewAI is an AI-powered fake review detection system that uses an ensemble of machine
              learning models to identify potentially fraudulent or manufactured product reviews. The system
              analyzes textual content, reviewer behavior, and temporal patterns to generate a calibrated
              fake-probability score with full explainability.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Multi-Model Ensemble', 'SHAP Explainability', 'Bulk CSV Processing', 'Real-time Detection', 'TrustLens UI'].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-tl-accent-bg text-tl-accent text-xs font-semibold rounded-full border border-tl-accent/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Architecture */}
      <Section icon={Cpu} title="ML Architecture" iconColor="text-tl-accent">
        <div className="space-y-4">
          {/* Architecture flow */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-tl-muted mb-5">
            {['Dataset', 'Preprocessing', 'Feature Engineering', 'Model Prediction', 'Ensemble', 'Final Score', 'Explainability'].map((step, i, arr) => (
              <React.Fragment key={step}>
                <span className="px-2.5 py-1 bg-tl-fill border border-tl-border rounded-full font-medium text-tl-text">{step}</span>
                {i < arr.length - 1 && <span className="text-tl-muted">→</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Model cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ML_MODELS.map((m) => (
              <div key={m.name} className="border border-tl-border rounded-card p-4 hover:shadow-card transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                  <span className="font-semibold text-sm text-tl-text">{m.name}</span>
                </div>
                <p className="text-[11px] font-medium text-tl-muted uppercase tracking-wide mb-1">{m.role}</p>
                <p className="text-xs text-tl-text leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Ensemble note */}
          <div className="mt-3 p-4 bg-tl-accent-bg border border-tl-accent/20 rounded-card text-xs text-tl-text leading-relaxed">
            <strong className="text-tl-accent">Ensemble Strategy:</strong> The final prediction combines model
            outputs using a validation-based stacking approach. Soft probabilities from each model are weighted
            by their hold-out validation performance. The classification threshold is calibrated on the
            validation set to minimize false negatives while maintaining precision.
          </div>
        </div>
      </Section>

      {/* Feature Engineering */}
      <Section icon={Layers} title="Feature Engineering" iconColor="text-[#2FAE7A]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.category}
              className="rounded-card border p-4 space-y-2"
              style={{ borderColor: f.color + '33', background: f.bg }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{f.icon}</span>
                <span className="font-semibold text-sm text-tl-text">{f.category}</span>
              </div>
              <ul className="space-y-1">
                {f.items.map((item) => (
                  <li key={item} className="text-xs text-tl-text flex items-start gap-1.5">
                    <span style={{ color: f.color }} className="mt-0.5 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Tech Stack */}
      <Section icon={GitBranch} title="Technology Stack" iconColor="text-[#E8A838]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TECH_STACK.map((t) => (
            <div key={t.name} className="border border-tl-border rounded-card p-3 text-center hover:bg-tl-fill transition-colors">
              <div className="text-2xl mb-1">{t.icon}</div>
              <p className="font-semibold text-sm text-tl-text">{t.name}</p>
              <p className="text-[11px] text-tl-muted">{t.role}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Dataset Info */}
      <Section icon={Database} title="Dataset Information" iconColor="text-[#E05A5A]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-tl-text">Training Data</h4>
            <p className="text-xs text-tl-text leading-relaxed">
              The models are trained on a labeled dataset of Amazon product reviews containing both genuine
              reviews and synthetic/crowdsourced fake reviews. Each review is annotated with a binary fake/genuine
              label and enriched with structured metadata.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-tl-text">Data Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Review Text', 'Raw text content'],
                ['Rating', '1–5 star score'],
                ['User ID', 'Reviewer identifier'],
                ['Product ID', 'Item identifier'],
                ['Review Date', 'Submission timestamp'],
                ['Helpful Votes', 'Community feedback'],
              ].map(([k, v]) => (
                <div key={k} className="bg-tl-fill rounded-[10px] p-2.5">
                  <p className="text-xs font-semibold text-tl-text">{k}</p>
                  <p className="text-[11px] text-tl-muted">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Footer note */}
      <div className="text-center text-xs text-tl-muted py-4 border-t border-tl-border">
        FakeReviewAI · Built with TrustLens Design System · © 2026
      </div>
    </div>
  );
}
