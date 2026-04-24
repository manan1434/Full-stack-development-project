# AI Expense Categorization & Budget Advisor

Full-stack web app where users log expenses and a machine-learning model auto-classifies each one into a category (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other). The dashboard shows monthly totals, category breakdowns, budget limits, and overspending alerts.

## Stack

- **Frontend**: React (Vite) + Chart.js + plain CSS
- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **ML service**: Python + FastAPI + scikit-learn
- **Auth**: JWT in httpOnly cookies, bcrypt password hashing

## Repo layout

```
expense-advisor/
  frontend/     # React + Vite
  backend/      # Node + Express + Mongoose
  ml-service/   # Python + FastAPI + scikit-learn
  README.md
  .gitignore
```

Setup instructions for each service live in the per-service README. Build order: `ml-service` → `backend` → `frontend`.
