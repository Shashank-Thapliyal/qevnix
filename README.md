# 🌬️ UK Day-Ahead Wind Forecast Evaluator (GB Wind Desk)

An interactive, audit-grade full-stack web platform built for energy utilities and wholesale trading desks operating in the Great Britain (GB) electricity market. It evaluates the point-in-time accuracy of day-ahead wind generation forecasts against actual delivered generation across half-hourly settlement periods for **January 2026**.

[![Live App on Vercel](https://img.shields.io/badge/Vercel-Live_App-black?style=for-the-badge&logo=vercel)](https://qevnix.vercel.app)


---

## 🔗 Live Application Links

* **Production URL (Vercel)**: [https://qevnix.vercel.app](https://qevnix.vercel.app)
* **Backend API (Cloud Deployment)**: Deployed on cloud web service (`/health`, `/api/analysis`)

---

## 🎥 Video Demonstration

[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/IXQsgrrrCHo)


---

## 🤖 AI Tools Used

In accordance with the assignment guidelines, the following AI tools were used for assistance during development:

- **ChatGPT :** Used for occasional domain clarification and UI design suggestions.
- **Gemini:** Used for code optimization and assistance with few configurations and deployment troubleshooting.
- **Claude (Anthropic):** Used for code review and architectural feedback.



## 📋 Problem Setting & Business Requirements

### Context: The Energy Utility Wholesale Challenge
A UK energy utility must purchase sufficient electricity from the wholesale market to meet consumer demand. Because renewable wind energy is intermittent and weather-dependent, power purchase decisions in the **UK Day-Ahead market** must be finalized one day prior to delivery.

Any deficit between contracted power and real-time consumer consumption must be covered by procuring expensive peaking power (e.g. thermal/gas plants) or by paying punitive cash-out imbalance prices to Elexon. Therefore, the trading desk requires:

1. **Latest Available Forecasts at Cutoff**: Total clarity on the exact forecast version available *at the moment the procurement decision is made* without future data leakage.
2. **Quantified Forecast Accuracy**: Statistical error metrics (MAE, RMSE, Bias) to establish risk buffers and prevent over-buying or under-buying power.

### Scope & Constraints
* **Data Source**: Strictly national-level wind forecasts and actuals from **Elexon BMRS** alone:
  * **Actual Generation**: [FUELHH/stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) filtered by `fuelType: "WIND"`.
  * **Forecasted Generation**: [WINDFOR/stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) with `publishTime` tracking.
* **Temporal Scope**: Purchase decisions made in **January 2026** (delivery dates spanning January into February 1st, 2026).
* **Technology**: React frontend, Python backend, Dockerized, and deployed to free cloud infrastructure.


### Data Reconciliation Engine
1. **Fetch Actuals**: Queries `FUELHH` stream for the selected settlement date (`fuelType=WIND`), indexing intervals by normalized UTC timestamp.
2. **Fetch Point-in-Time Forecasts**: Queries `WINDFOR` stream up to 48 hours prior to cutoff.
3. **Prevent Lookahead Bias**:
   $$\text{Filter: } \text{publishTime} \le \text{decisionCutoff} \quad \text{AND} \quad \text{deliveryStart} \le \text{startTime} < \text{deliveryEnd}$$
4. **Latest Publish Resolution**: Forecasts are sorted chronologically by `publishTime` ascending. When mapped by `startTime`, the latest version naturally supersedes earlier revisions.
5. **Matched Interval Calculation**:
   $$\text{Error}_i = \text{Forecast}_i - \text{Actual}_i$$
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |\text{Error}_i| \qquad \text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N \text{Error}_i^2} \qquad \text{Bias} = \frac{1}{N} \sum_{i=1}^N \text{Error}_i$$

---

## 📊 Desk Metrics Explained

| Metric | Formula / Definition | Commercial Meaning for the Trading Desk |
| :--- | :--- | :--- |
| **MAE** *(Mean Absolute Error)* | $\frac{1}{N} \sum \|\text{Forecast} - \text{Actual}\|$ | Average volume miss in Megawatts (MW). Used to size thermal reserve capacity. |
| **RMSE** *(Root Mean Square Error)* | $\sqrt{\frac{1}{N} \sum (\text{Forecast} - \text{Actual})^2}$ | Penalizes large outlier deviations heavily. Reflects high volumetric swing risk. |
| **Forecast Bias** | $\frac{1}{N} \sum (\text{Forecast} - \text{Actual})$ | Systematic directional error: |
| | **Bias > 0 (Short Risk)** | Forecast was **too optimistic**. The desk likely under-procured thermal power and faces imbalance penalty buyback. |
| | **Bias < 0 (Long Risk)** | Forecast was **too pessimistic**. The desk likely over-procured power and faces excess sell-off at low prices. |
| **Matched Intervals** | Count of valid half-hours ($N \le 48$) | Validates that all 48 settlement periods are accounted for without telemetry gaps. |

---

## 📁 Repository Directory Structure

```text
wind-forecaster-assignment/
├── .dockerignore
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
│
└── frontend/
    ├── .dockerignore
    ├── .env.example
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── components/
        │   ├── Header.jsx
        │   ├── Metrics .jsx
        │   ├── ForecastChart.jsx
        │   └── AuditTable.jsx
        ├── hooks/
        │   └── useAnalysis.js
        └── lib/
            ├── api.js
            └── format.js
```

---

## 🚀 How to Run the Application

### Option A: 1-Click Docker Compose (Recommended)

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running, then run:

```bash
docker compose up --build
```

* **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:8000/health](http://localhost:8000/health)
* **Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

To terminate:
```bash
docker compose down
```

---

### Option B: Manual Local Setup

#### 1. Backend Service (FastAPI)
```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API runs at `http://localhost:8000`.

#### 2. Frontend Application (React + Vite)
In a new terminal window:
```bash
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
Dashboard runs at `http://localhost:5173`.

---

## 📡 API Reference

### Health Check
`GET /health`
```json
{
  "success": true,
  "data": { "status": "ok" },
  "error": null
}
```

### Analysis Evaluation
`GET /api/analysis?delivery_date=2026-01-15&decision_cutoff=2026-01-14T12:00:00Z`

#### Parameters:
* `delivery_date` *(YYYY-MM-DD)*: Target delivery date in GB market (supports January 2026 delivery window).
* `decision_cutoff` *(ISO 8601 string)*: Exact decision timestamp (must be before delivery start and within January 2026).

#### Response Schema:
```json
{
  "success": true,
  "data": {
    "deliveryDate": "2026-01-15",
    "decisionCutoff": "2026-01-14T12:00:00+00:00",
    "matchedIntervals": 48,
    "metrics": {
      "mae": 412.35,
      "rmse": 521.18,
      "bias": -84.22
    },
    "points": [
      {
        "startTime": "2026-01-15T00:00:00Z",
        "publishTime": "2026-01-14T11:45:00Z",
        "forecast": 11450.0,
        "actual": 11820.0,
        "error": -370.0
      }
    ]
  },
  "error": null
}
```