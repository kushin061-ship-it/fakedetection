# Fake Review Detection System — React Frontend

A production-grade, responsive React web application for analyzing, auditing, and explaining e-commerce review authenticity. Built with **React 19**, **Vite**, **Tailwind CSS** (class-based dark mode), and **Recharts**.

The application operates in a **mock-first** mode, running completely client-side with realistic simulated delays and datasets, and seamlessly switches to a production backend (FastAPI / Python) via a single environment variable.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### 2. Installation
Navigate into the `frontend/` directory and install project dependencies:

```bash
cd frontend
npm install
```

*(On Windows PowerShell with script restriction policies, you can run `npm.cmd install` or `cmd /c "npm install"`)*

### 3. Development Server
Start the Vite local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

### 4. Code Quality & Build

```bash
# Run the Oxlint linter (0 errors, 0 warnings enforced)
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## ⚙️ The `VITE_USE_MOCK` Switch & Backend Connection

The data layer is completely decoupled through `src/api/client.js` and `src/api/index.js`.

### Environment Configuration (`.env` and `.env.example`)

```ini
# When true, all API functions return realistic mock data with an artificial 400-800ms latency.
# When false, calls are dispatched via Axios to VITE_API_URL.
VITE_USE_MOCK=true

# Base URL for the future FastAPI / Python backend server
VITE_API_URL=http://localhost:8000
```

### Switching to a Real Backend
To connect the frontend to a real FastAPI backend:
1. Open `.env` (or create `.env.local`):
   ```ini
   VITE_USE_MOCK=false
   VITE_API_URL=http://localhost:8000
   ```
2. Restart the Vite dev server (`npm run dev`).
3. The amber **"Mock Data"** badge in the top navigation bar will automatically hide, and all API calls will route directly through Axios to `http://localhost:8000/api/...`.
4. Consult **[`src/api/README.md`](./src/api/README.md)** for the complete schema and JSON request/response contract expected by each endpoint.

---

## 📁 Folder Structure

```
frontend/
├── .env                  # Environment variables (VITE_USE_MOCK=true)
├── .env.example          # Environment template
├── package.json          # Project scripts and dependencies
├── tailwind.config.js    # Tailwind configuration with custom theme colors
├── vite.config.js        # Vite bundler configuration
├── src/
│   ├── api/              # API client and service functions
│   │   ├── client.js     # Axios instance with VITE_API_URL & interceptors
│   │   ├── index.js      # Unified exported API methods (mock vs live branch)
│   │   └── README.md     # Detailed JSON contract for future FastAPI backend
│   ├── components/       # Reusable, accessible UI components
│   │   ├── Badge.jsx     # Fake (rose), Genuine (emerald), Warning, Neutral badges
│   │   ├── Button.jsx    # Primary, secondary, ghost, loading states
│   │   ├── Card.jsx      # Rounded-xl cards with soft shadows
│   │   ├── DataTable.jsx # Sortable, searchable, paginated table
│   │   ├── Drawer.jsx    # Slide-over panel (closes on Escape & backdrop click)
│   │   ├── EmptyState.jsx# Fallback placeholder view
│   │   ├── ErrorState.jsx# Exception fallback with retry callback
│   │   ├── Gauge.jsx     # Semi-circle probability gauge (0.0 to 1.0)
│   │   ├── PageHeader.jsx# Breadcrumb, title, subtitle, and action buttons
│   │   ├── Skeleton.jsx  # Pulse loading placeholder variants
│   │   ├── Spinner.jsx   # Indigo loading spinner
│   │   ├── StatCard.jsx  # Metric cards with labels, icons, and trends
│   │   └── Tabs.jsx      # Navigation tab bar
│   ├── hooks/            # Custom React hooks
│   │   ├── useApi.js     # Race-condition safe async fetch hook with refetch
│   │   └── useDarkMode.js# Dark/light theme persistence in localStorage
│   ├── layout/           # Global application layout shell
│   │   ├── MainLayout.jsx# Responsive shell binding sidebar, topbar, and footer
│   │   ├── Sidebar.jsx   # Collapsible desktop sidebar & mobile slide drawer
│   │   ├── Topbar.jsx    # Page title, mock data indicator, dark mode switch
│   │   └── Footer.jsx    # Persistent analytical tool disclaimer
│   ├── mock/             # Deterministic mock datasets (1 per endpoint)
│   │   ├── eda.js        # Class split (18/82%), ratings, lengths, 24-mo bursts
│   │   ├── models.js     # 5 models (XGBoost best), confusion matrices, ROCs
│   │   ├── errors.js     # 60 FP, 60 FN, 40 Low Confidence cases
│   │   ├── explain.js    # Top 20 SHAP features with plain-English descriptions
│   │   ├── patterns.js   # 20 mined association rules & 15 suspicious reviewers
│   │   ├── predict.js    # NLP heuristics, dynamic CSV parser & batch predictor
│   │   └── reviewer.js   # Reviewer stats, variance, and review event timeline
│   ├── pages/            # Application view pages
│   │   ├── OverviewPage.jsx      # EDA dashboard, charts, key observations
│   │   ├── PredictPage.jsx       # Single review inference, gauge, SHAP bars
│   │   ├── ModelsPage.jsx        # Model leaderboard, ROC curves, confusion matrix
│   │   ├── ErrorsPage.jsx        # FP/FN/LC tabbed audit table with side drawer
│   │   ├── ExplainabilityPage.jsx# Global SHAP bars, domain breakdown, glossary
│   │   ├── PatternsPage.jsx      # Association rules, scatter chart, syndicate hub
│   │   ├── BatchPage.jsx         # CSV drag-and-drop, audit metrics, CSV export
│   │   ├── NotFoundPage.jsx      # 404 route fallback
│   │   └── DesignCheckPage.jsx   # Hidden route showcasing all UI components
│   └── utils/            # Helper utilities and formatters
```

---

## 🎨 Design System & Color Tokens

The UI follows modern design standards using curated, harmonious tokens:

| Token | Theme Color | Hex / Class | Primary Usage |
|---|---|---|---|
| **Primary** | Indigo | `#6366f1` / `indigo-600` | Navigation, primary buttons, branding |
| **Fake** | Rose / Red | `#f43f5e` / `rose-500` | Flagged fake reviews, critical anomalies, risk badges |
| **Genuine** | Emerald | `#10b981` / `emerald-500` | Genuine reviews, high-confidence authentic submissions |
| **Warning / Borderline**| Amber | `#f59e0b` / `amber-500` | Low-confidence predictions (0.40–0.60), mock data badge |
| **Textual Features** | Blue | `#3b82f6` / `blue-500` | Sentiment polarity, review length, exclamation frequency |
| **Behavioral Features**| Amber | `#f59e0b` / `amber-500` | Velocity bursts, rating extremity, verified purchases |
| **Temporal Features** | Purple | `#a855f7` / `purple-500` | Post-launch gaps, diurnal anomalies, surge windows |

### Dark Mode & Accessibility
- **Toggle**: Click the Sun/Moon icon in the Topbar. State is automatically saved to `localStorage` and respects the user's `prefers-color-scheme` OS preference.
- **Charts**: Every Recharts component (axes, grid lines, tooltips, and legends) dynamically adapts colors in dark mode.
- **Keyboard Navigation**: Drawers close on <kbd>Escape</kbd>, focus rings are visible on all interactive elements, and icon buttons feature accessible `aria-label` tags.

---

## 🗺️ Application Routes

| Path | Page Name | Primary Features |
|---|---|---|
| `/` | **Overview** | EDA metrics, class donut (18/82%), rating & length grouped bars, 24-month timeline with burst months highlighted |
| `/predict` | **Predict Review** | Textarea with char count, star selector, 3 preset examples, probability gauge, horizontal SHAP attribution, history |
| `/models` | **Model Comparison** | Sortable metrics table (XGBoost champion F1 0.902), grouped bar chart, 20-point ROC curves, interactive confusion matrix |
| `/errors` | **Error Analysis** | 60 FP, 60 FN, 40 Low-Confidence cases, 300ms debounced search, side inspection Drawer with moderator guidance |
| `/explainability` | **Explainability** | Top 20 SHAP features horizontal bar chart, domain chips, donut chart, glossary table, and guide card |
| `/patterns` | **Suspicious Patterns** | 20 association rules, min-lift slider, Support vs Confidence scatter chart, 15 suspicious reviewers with timeline drawer |
| `/batch` | **Batch Upload** | Drag-and-drop CSV up to 10MB, column validation, sample template download, progress bar, cohort metrics, and CSV export |
| `/design-check` | **Design System Check** | *Hidden route* showcasing all components, interactive states, and theme tokens |
| `/*` | **404 Not Found** | Friendly fallback page with navigation recovery actions |

---

## 📄 License & Disclaimer

**Preliminary analytical tool.** Predictions and explanations generated by this system represent machine learning statistical associations and do not replace human verification or platform-level moderation.
