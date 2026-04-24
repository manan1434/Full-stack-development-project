# API Reference

Base URL: `http://localhost:5000/api` in development.

All responses are JSON. Errors have the shape `{ "error": "message" }` (+ optional `field` for validation failures). Protected endpoints require the `token` httpOnly cookie set by `/auth/register` or `/auth/login`.

---

## Health

### `GET /api/health`
Public. Liveness check.

**200**
```json
{ "status": "ok" }
```

---

## Auth — `/api/auth`

### `POST /register`
Create a new account. Sets the `token` cookie.

**Body**
```json
{ "name": "Test User", "email": "test@example.com", "password": "password123" }
```
Constraints: `name` 1–80 chars, valid email, password ≥ 8 chars.

**201**
```json
{
  "user": {
    "_id": "69eb7c08cb96cfc631b6547a",
    "name": "Test User",
    "email": "test@example.com",
    "createdAt": "2026-04-24T14:19:52.753Z"
  }
}
```
`Set-Cookie: token=...; HttpOnly; SameSite=Lax; Max-Age=604800`

**409** if email already registered.

### `POST /login`
**Body** `{ "email": "...", "password": "..." }` → **200** with user + cookie. **401** on bad credentials.

### `POST /logout`
Clears the cookie. **200** `{ "ok": true }`.

### `GET /me`
Protected. Returns the current user.
```json
{ "user": { "_id": "...", "name": "...", "email": "...", "createdAt": "..." } }
```

---

## Expenses — `/api/expenses` (protected)

### `POST /`
Create an expense. If `category` is omitted, the backend calls the ML service to assign one (falls back to `"Other"` if the call fails).

**Body**
```json
{
  "amount": 450,
  "description": "Zomato dinner order",
  "date": "2026-04-24T12:00:00.000Z",
  "category": "Food"
}
```
`date` and `category` are optional. `amount` must be ≥ 0. `description` 1–500 chars.

**201**
```json
{
  "expense": {
    "_id": "69eb7c08cb96cfc631b6547b",
    "userId": "69eb7c08cb96cfc631b6547a",
    "amount": 450,
    "description": "Zomato dinner order",
    "category": "Food",
    "date": "2026-04-24T14:19:52.865Z",
    "createdAt": "2026-04-24T14:19:52.866Z"
  }
}
```

### `GET /`
List expenses, most recent first.

**Query**
| Param | Example | Notes |
|---|---|---|
| `month` | `2026-04` | `YYYY-MM`. Filters by `date` within that UTC month |
| `category` | `Food` | Must be one of the 8 categories |

**200** `{ "expenses": [ ... ] }`

### `PUT /:id`
Update any of `amount`, `description`, `date`, `category`. Used by the UI to let users override the AI.

**200** `{ "expense": { ... } }`
**404** if the expense doesn't exist or isn't owned by the caller.

### `DELETE /:id`
**200** `{ "ok": true }` / **404** if not found.

---

## Budgets — `/api/budgets` (protected)

### `GET /`
```json
{ "budgets": [
  { "_id": "...", "userId": "...", "category": "Food", "monthlyLimit": 3000 }
] }
```

### `PUT /`
Upsert a budget for the (user, category) pair.

**Body** `{ "category": "Food", "monthlyLimit": 3000 }`

**200** `{ "budget": { ... } }`

---

## Analytics — `/api/analytics` (protected)

### `GET /summary`
**Query**: `month=YYYY-MM` (defaults to current month).

**200**
```json
{
  "month": "2026-04",
  "total": 3399,
  "byCategory": [
    { "category": "Bills", "total": 2200, "count": 1 },
    { "category": "Entertainment", "total": 499, "count": 1 },
    { "category": "Food", "total": 450, "count": 1 },
    { "category": "Transport", "total": 250, "count": 1 }
  ],
  "budgets": [
    {
      "category": "Food",
      "monthlyLimit": 3000,
      "spent": 450,
      "overBudget": false
    }
  ]
}
```

`byCategory` is sorted by `total` descending. Only categories with at least one expense in the selected month appear there; `budgets` reflects every budget the user has defined, with `spent` coming from the same month's aggregation.

### `GET /monthly`
Monthly totals for the last N months (default 6, max 24).

**Query**: `months=6`

**200**
```json
{
  "series": [
    { "month": "2025-11", "total": 0 },
    { "month": "2025-12", "total": 0 },
    { "month": "2026-01", "total": 0 },
    { "month": "2026-02", "total": 0 },
    { "month": "2026-03", "total": 0 },
    { "month": "2026-04", "total": 3399 }
  ]
}
```

Months with no activity appear with `total: 0`.

---

## ML service — `http://localhost:8000`

Not part of the public API, but documented here for completeness. The backend is the only caller.

### `GET /health` → `{ "status": "ok" }`

### `POST /predict`
**Body** `{ "description": "Zomato dinner", "amount": 450 }` (`amount` optional)

**200** `{ "category": "Food", "confidence": 0.58 }`

If the top class has confidence < 0.35, the response falls back to `"Other"`.

---

## Error shapes

| Status | When |
|---|---|
| 400 | `express-validator` rejected the body/query. `field` included. |
| 401 | Missing or invalid token cookie on a protected route. |
| 404 | Resource not found (or not owned by the caller). |
| 409 | Email already registered. |
| 500 | Unhandled server error. Stack included in non-production. |
