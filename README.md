# AI Expense Categorization & Budget Advisor

Full-stack web app where users log expenses and a machine-learning model auto-classifies each one into a category (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other). The dashboard shows monthly totals, category breakdowns, budget limits, and overspending alerts. Users can override the AI-assigned category inline.

## Stack

- **Frontend**: React (Vite) + Chart.js + plain CSS
- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **ML service**: Python + FastAPI + scikit-learn (TF-IDF + Logistic Regression)
- **Auth**: JWT in httpOnly cookies, bcrypt password hashing

## Architecture

```
+----------------+        +-----------------+        +-------------+
|                |        |                 |        |             |
|  React + Vite  | <----> |  Node + Express | <----> |  MongoDB    |
|  localhost:5173|  HTTP  |  localhost:5000 | Mongo  |  (Atlas /   |
|  (cookie auth) |        |  (JWT verify)   | driver |   local)    |
|                |        |                 |        |             |
+----------------+        +--------+--------+        +-------------+
                                   |
                                   | axios POST /predict
                                   v
                          +------------------+
                          |  FastAPI + sklearn|
                          |  localhost:8000   |
                          |  (model.pkl)      |
                          +------------------+
```

- The React SPA talks only to the Node backend. Cookies carry the JWT.
- The backend is the single writer to Mongo. It calls the ML service whenever a new expense is created and falls back to `"Other"` if the ML service is unreachable.
- The ML service is stateless: `model.pkl` is loaded once at startup.

## Repo layout

```
expense-advisor/
  frontend/        # React + Vite SPA
  backend/         # Node + Express + Mongoose API
  ml-service/      # Python + FastAPI + scikit-learn classifier
  docs/
    api.md              # every endpoint with request/response examples
    database-schema.md  # Mongo collections and indexes
  README.md
  .gitignore
```

Build order when setting up locally: `ml-service` → `backend` → `frontend`.

## Local setup

You need:
- **Node 20+** and **npm**
- **Python 3.10+**
- A running **MongoDB** — either [local](https://www.mongodb.com/try/download/community) (`mongodb://localhost:27017/expense-advisor`) or a free [Atlas](https://www.mongodb.com/cloud/atlas) cluster

Run each service in its own terminal tab.

### 1. ML service

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train.py                     # writes model.pkl
uvicorn app:app --reload --port 8000
```

Sanity check:
```bash
curl -s http://localhost:8000/health
# {"status":"ok"}
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env                # fill MONGODB_URI and JWT_SECRET
npm run dev
```

Sanity check:
```bash
curl -s http://localhost:5000/api/health
# {"status":"ok"}
```

If you see AirTunes on macOS :5000, disable **System Settings → General → AirDrop & Handoff → AirPlay Receiver**.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173, register, and click **Seed demo data** on the dashboard to populate charts.

## Environment variables

### `backend/.env`
| Var | Example | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `MONGODB_URI` | `mongodb://localhost:27017/expense-advisor` | Connection string |
| `JWT_SECRET` | random hex | Signs auth cookies. Generate with `openssl rand -hex 32` |
| `ML_SERVICE_URL` | `http://localhost:8000` | FastAPI base URL |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |
| `NODE_ENV` | `development` | `production` turns on secure cookies and hides stack traces |

### `frontend/.env`
| Var | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` |

### ML service
None required locally. In production you can set `PORT` via the platform (handled by `uvicorn`).

## Tests

```bash
cd backend
npm test
```

Covers:
- `mlClient.classifyExpense` — ML service errors fall back to `"Other"`
- protected route `/api/auth/me` — returns 401 without a token

## Deployment (suggested free tier)

| Service | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | Import the repo, set root to `frontend/`, add `VITE_API_URL` pointing at the deployed backend |
| Backend | **Render** (Web Service) | Root `backend/`, build `npm install`, start `npm start`. Set all env vars. `NODE_ENV=production` |
| Database | **MongoDB Atlas** | Free M0 cluster. Allowlist Render's IP range or use `0.0.0.0/0` for simplicity |
| ML service | **Render** (separate Web Service) | Root `ml-service/`, build `pip install -r requirements.txt && python train.py`, start `uvicorn app:app --host 0.0.0.0 --port $PORT` |

Two things to update when moving from dev to prod:
1. **CORS**: backend `CLIENT_URL` must be the Vercel URL (e.g. `https://expense-advisor.vercel.app`). The frontend `VITE_API_URL` must be the Render backend URL.
2. **Cookies**: with `NODE_ENV=production`, cookies are `Secure` only. Your frontend and backend must be on HTTPS (both Vercel and Render provide this by default). For cross-origin cookies across Vercel/Render you may need to switch `sameSite` from `lax` to `none` — see [backend/src/utils/cookies.js](backend/src/utils/cookies.js).

## Further reading

- [docs/api.md](docs/api.md) — every endpoint with request/response examples
- [docs/database-schema.md](docs/database-schema.md) — Mongo collections and indexes
- [ml-service/README.md](ml-service/README.md)
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
