# Backend — Expense Advisor API

Node + Express + Mongoose API that owns users, expenses, budgets, and analytics. It calls the Python ML service to categorize new expenses.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGODB_URI and JWT_SECRET
```

### Required env vars

| Var | Example | Notes |
|---|---|---|
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://localhost:27017/expense-advisor` | Local or Atlas |
| `JWT_SECRET` | `some-long-random-string` | Signs auth cookies |
| `ML_SERVICE_URL` | `http://localhost:8000` | FastAPI service |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |
| `NODE_ENV` | `development` | Set to `production` in deploy |

## Run

```bash
npm run dev     # nodemon
npm start       # plain node
```

## Endpoints

All protected routes require the `token` httpOnly cookie (set by register/login).

### Auth — `/api/auth`
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/register` | `{ name, email, password }` | 8+ char password |
| POST | `/login` | `{ email, password }` | Sets cookie |
| POST | `/logout` | — | Clears cookie |
| GET | `/me` | — | Returns current user |

### Expenses — `/api/expenses` (protected)
| Method | Path | Body / Query | Notes |
|---|---|---|---|
| POST | `/` | `{ amount, description, date?, category? }` | If `category` omitted, ML service assigns one |
| GET | `/?month=YYYY-MM&category=Food` | — | Sorted desc by date |
| PUT | `/:id` | any of `amount, description, date, category` | User override of ML |
| DELETE | `/:id` | — | |

### Budgets — `/api/budgets` (protected)
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/` | — | All budgets for user |
| PUT | `/` | `{ category, monthlyLimit }` | Upsert per category |

### Analytics — `/api/analytics` (protected)
| Method | Path | Query | Notes |
|---|---|---|---|
| GET | `/summary` | `?month=YYYY-MM` (defaults to current) | Total, byCategory, budgets |
| GET | `/monthly` | `?months=6` | Totals per month for the last N months |

### Health
`GET /api/health` → `{ status: 'ok' }` (no auth).

## Error shape

All errors return `{ error: 'message' }` with an HTTP status code. Validation failures also include `field`. Stack traces are only exposed outside production.
