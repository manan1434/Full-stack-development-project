# Frontend — Expense Advisor

React (Vite) SPA for the AI Expense Categorization & Budget Advisor. Talks to the Express backend via axios with cookie-based auth.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` if your backend is on a different URL:
```
VITE_API_URL=http://localhost:5000/api
```

## Run

```bash
npm run dev
```

The app runs at http://localhost:5173 and expects the backend at `VITE_API_URL`. Make sure the ML service (:8000) and backend (:5000) are running first.

## Build

```bash
npm run build      # outputs dist/
npm run preview    # serves the production build locally
```

## Routes

| Path | Page | Auth |
|---|---|---|
| `/login` | Sign in | public |
| `/register` | Create account | public |
| `/` | Dashboard (total, pie, bar, breakdown, budget alerts) | required |
| `/expenses` | Add / edit / delete expenses, override AI category | required |
| `/budgets` | Set monthly budget per category | required |

## Notes

- Auth state lives in `AuthContext`; it calls `/auth/me` on mount to restore the session from the httpOnly cookie.
- The dashboard has a **"Seed demo data"** button that only appears in dev mode (`import.meta.env.DEV`). It POSTs ~20 sample expenses so the charts have data.
- Styling is plain CSS with variables in `src/styles.css`. Mobile-first, breakpoints at 768px and 1024px.
