# Credit Risk Engine

A credit risk scoring demo that estimates loan default risk, maps model output into a credit-style score, and explains approve, review, or deny decisions with SHAP.

## 🎯 Product Overview

This project showcases an underwriting workflow that helps explore when a lender might accept, review, or reject a borrower based on:

- **Borrower Profile** - Age, income, employment history, education, and credit history
- **Loan Context** - Loan amount, term, purpose, and debt-to-income pressure
- **Credit Signals** - Existing credit pressure, default-history proxy, and utilization
- **Policy Thresholds** - Adjustable approve and deny cutoffs for experimentation

## ✨ Core Capabilities

- **Trained Risk Model** - XGBoost classifier trained on a simplified slice of Kaggle Home Credit data
- **Explainable Decisions** - SHAP explanations show which factors moved risk up or down
- **Interactive Demo** - Edit borrower inputs, run scoring, and inspect the result instantly
- **Policy Controls** - Tune approval and denial thresholds without retraining the model
- **Batch Scoring** - Upload Kaggle-shaped or demo-shaped CSV files for bulk predictions
- **Model Card** - View training metrics, model mode, limitations, and global feature importance
- **Responsive Interface** - Compact Next.js dashboard optimized for desktop and mobile use

## 🏗️ System Architecture

```text
Credit-Risk/
├── backend/
│   ├── main.py                  # FastAPI prediction, health, model info, and batch endpoints
│   ├── train.py                 # Training pipeline for XGBoost and SHAP artifacts
│   ├── home_credit_csv.py       # Kaggle application_train.csv mapping logic
│   ├── features.py              # Feature engineering for model inputs
│   ├── explainer.py             # SHAP and fallback explanation formatting
│   ├── schemas.py               # Pydantic request and response models
│   ├── data/
│   │   └── application_train.csv # Kaggle training file, but not committed
│   └── model/
│       ├── model.pkl            # Trained XGBoost artifact
│       ├── explainer.pkl        # Trained SHAP explainer
│       ├── metrics.json         # AUC, Gini, data notes, training timestamp
│       └── global_importance.json # Mean absolute SHAP feature importance
├── public/
│   └── sample-applications.csv  # Small demo CSV for batch upload
└── src/
    ├── app/
    │   ├── page.tsx             # Main About and Demo tab interface
    │   ├── layout.tsx           # Root layout and metadata
    │   └── globals.css          # Tailwind and global styling
    ├── components/
    │   ├── charts/              # Policy band and SHAP strength charts
    │   ├── input/               # Borrower form, presets, threshold controls
    │   ├── layout/              # Header and footer
    │   ├── output/              # Results, model card, batch uploader, gauge
    │   └── shared/              # Shared loading components
    └── lib/
        ├── api.ts               # Frontend API client
        ├── types.ts             # TypeScript interface definitions
        └── utils.ts             # Formatting and utility functions
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.17.0 or higher
- **Python**: 3.11 recommended
- **Package Manager**: npm
- **Dataset**: Kaggle Home Credit Default Risk `application_train.csv`

Render should use Python 3.11.9. The repo includes `.python-version`, and the Render service should also set `PYTHON_VERSION=3.11.9`.

### Installation

1. **Navigate to the project:**
   ```bash
   cd Credit-Risk
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Create and install backend dependencies:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Start the backend API:**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8001
   ```

5. **Start the frontend in a second terminal:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Commands

```bash
npm run dev          # Start Next.js development server
npm run build        # Build frontend for production
npm run start        # Start production frontend server
npm run lint         # Run ESLint validation

cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8001  # Start FastAPI backend
python train.py            # Train model artifacts from Kaggle CSV
```

## 🧠 Model Training

### Dataset Setup

Download `application_train.csv` from the Kaggle Home Credit Default Risk competition and place it here:

```text
backend/data/application_train.csv
```

### GitHub Note

GitHub does not include the trained `.pkl` model files or the Kaggle CSV. That keeps the repo cleaner, but it means someone cloning the project needs to add `application_train.csv` and run training before the backend uses the trained model.

### Train Artifacts

```bash
cd backend
venv\Scripts\activate
python train.py
```

Training writes:

- `backend/model/model.pkl`
- `backend/model/explainer.pkl`
- `backend/model/metrics.json`
- `backend/model/global_importance.json`

Restart the FastAPI server after training so the API loads the newest artifacts.

## 🌐 Deployment

### Vercel and Render

1. **Deploy the frontend to Vercel:**
   - Push this repository to GitHub
   - Visit [vercel.com](https://vercel.com)
   - Select "New Project"
   - Import the repository
   - Set `NEXT_PUBLIC_API_URL` to the deployed backend URL
   - Deploy

2. **Deploy the backend to Render:**
   - Create a Python web service
   - Use the `backend` directory as the service root
   - Install with `pip install -r requirements.txt`
   - Start with `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Include trained model artifacts or train them during setup

### Local Demo Mode

The app can run locally without trained artifacts. In that case, the backend uses a deterministic heuristic fallback so the UI still works.

## 🔧 Technology Stack

- **Frontend Framework**: Next.js 14.2.22 (App Router)
- **Frontend Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **Charts**: Recharts 2.15.0
- **Controls**: Radix UI Slider and Select
- **Icons**: Lucide React 0.468.0
- **Backend Framework**: FastAPI 0.115.6
- **Validation**: Pydantic 2.10.4
- **Data Stack**: pandas 2.2.3, NumPy 2.2.1, scikit-learn 1.6.0
- **Modeling**: XGBoost 2.1.3
- **Explainability**: SHAP 0.46.0

## 🎨 Design System

- **Color Palette**: Dark dashboard palette with green approval accents and muted risk colors
- **Typography**: DM Sans for interface text and Fraunces for display headings
- **Layout**: Narrow dashboard format for fast scanning and mobile usability
- **Components**: Reusable form, output, chart, and layout components
- **Interaction Model**: Tabbed About and Demo views, quick-load scenarios, sliders, and editable number fields

## 🧮 Scoring Workflow

### Evaluation Flow

1. **Feature Mapping**
   - Kaggle fields are renamed or derived into the same schema used by the frontend form
   - `AMT_ANNUITY` and income are used to estimate debt-to-income pressure
   - `DEF_30_CNT_SOCIAL_CIRCLE` is used as a non-target default-history proxy
   - `credit_utilization` is a proxy built from external scores, DTI, credit requests, and default-history signals

2. **Risk Prediction**
   - XGBoost estimates probability of default
   - Probability is mapped into a credit-style score
   - Policy thresholds classify the score as approve, review, or deny

3. **Explanation**
   - SHAP values identify which fields increased or decreased risk
   - The UI displays top factors, driver strength, and signed contribution charts

### Default Policy Thresholds

- **Approve**: Score of 700 or higher
- **Review**: Score from 580 to 699
- **Deny**: Score below 580

## 📊 Batch Input Support

| CSV Shape | Description | Identifier |
|-----------|-------------|------------|
| Kaggle `application_train.csv` | Raw Home Credit file with columns like `DAYS_BIRTH`, `AMT_INCOME_TOTAL`, and `AMT_CREDIT` | Uses `SK_ID_CURR` when present |
| Demo CSV | Form-shaped file matching `public/sample-applications.csv` | Uses row index |

The batch endpoint scores the first N rows, with a UI default of 400 and an API cap of 5000.

## ⚠️ System Characteristics

- **Portfolio Demo**: This is not production underwriting or financial advice
- **Simplified Data Slice**: The model uses a small subset of Home Credit fields, not the full relational dataset
- **No Target Leakage**: The corrected training pipeline does not copy `TARGET` into any input feature
- **Proxy Features**: Some UI fields are mapped from imperfect but non-target Kaggle proxies
- **Explainability First**: SHAP outputs are surfaced so decisions can be inspected instead of treated as black-box results
- **Fallback Mode**: If no trained artifacts exist, the API uses a deterministic heuristic for demonstration

## 🛠️ Development

### Frontend Quality

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### Backend Health Check

```bash
curl http://localhost:8001/health
```

Expected trained response:

```json
{
  "status": "ok",
  "mode": "trained_model",
  "has_metrics": true,
  "has_global_importance": true
}
```

## 🤝 Contributing

This is a demonstration project. Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Submit changes
4. Open a pull request

## 📄 License

MIT License - available for learning and inspiration.

## 🔍 Deployment Checklist

Before deployment:

- [ ] Node.js 18.17.0+ installed
- [ ] Python 3.11 environment configured
- [ ] Frontend dependencies installed with `npm install`
- [ ] Backend dependencies installed with `pip install -r backend/requirements.txt`
- [ ] Kaggle `application_train.csv` placed in `backend/data/`
- [ ] Model trained with `python backend/train.py`
- [ ] Backend health check returns `trained_model`
- [ ] Frontend lint passed with `npm run lint`
- [ ] Production build verified with `npm run build`
- [ ] `NEXT_PUBLIC_API_URL` configured for deployed frontend

## 🎯 Technical Highlights

1. **Full-Stack ML Demo**: Next.js frontend connected to FastAPI model-serving backend
2. **Explainable AI**: SHAP factors shown directly in the user workflow
3. **Corrected Training Pipeline**: Avoids target leakage and records limitations in model metadata
4. **Interactive Policy Testing**: Threshold controls let users compare approval strategies
5. **Batch Processing**: Supports both raw Kaggle files and smaller demo CSVs
6. **Typed Interfaces**: TypeScript frontend types and Pydantic backend schemas
7. **Portfolio-Ready Narrative**: Includes About and Demo tabs for context plus hands-on exploration

---

**Built as a practical credit-risk exploration inspired by Business 2257 and the Home Credit Kaggle competition.**
