#!/usr/bin/env bash
# Launch the whole stack: MongoDB (if needed), ML service, backend, frontend.
# Usage: ./start.sh
# Press Ctrl+C once to stop everything.

set -u

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/.logs"
mkdir -p "$LOG_DIR"

ML_PID=""
BACKEND_PID=""
FRONTEND_PID=""

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
info()  { color "1;34" "› $*"; }
ok()    { color "1;32" "✓ $*"; }
warn()  { color "1;33" "! $*"; }
err()   { color "1;31" "✗ $*"; }

cleanup() {
  echo
  info "shutting down…"
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID"  ]] && kill "$BACKEND_PID"  2>/dev/null || true
  [[ -n "$ML_PID"       ]] && kill "$ML_PID"       2>/dev/null || true
  wait 2>/dev/null || true
  ok "bye."
}
trap cleanup EXIT INT TERM

wait_for_url() {
  local url="$1" name="$2" max="${3:-40}"
  for ((i=1; i<=max; i++)); do
    if curl -fs "$url" >/dev/null 2>&1; then
      ok "$name ready ($url)"
      return 0
    fi
    sleep 0.5
  done
  err "$name did not come up at $url"
  return 1
}

# --- preflight ------------------------------------------------------------

[[ -f "$ROOT/backend/.env" ]]  || { err "backend/.env missing. Run: cp backend/.env.example backend/.env and fill it in."; exit 1; }
[[ -f "$ROOT/frontend/.env" ]] || cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"

# --- MongoDB --------------------------------------------------------------

MONGO_URI="$(grep -E '^MONGODB_URI=' "$ROOT/backend/.env" | cut -d= -f2-)"
if [[ "$MONGO_URI" == mongodb://localhost* || "$MONGO_URI" == mongodb://127.0.0.1* ]]; then
  if ! nc -z localhost 27017 >/dev/null 2>&1; then
    info "starting local MongoDB via brew…"
    if command -v brew >/dev/null && brew services start mongodb-community >/dev/null 2>&1; then
      wait_for_url "tcp://localhost:27017" "mongodb" 20 || true
      # crude readiness: just wait for port
      for i in {1..30}; do nc -z localhost 27017 && break; sleep 0.5; done
      ok "mongodb listening on :27017"
    else
      warn "couldn't start MongoDB automatically. Start it yourself and re-run."
      exit 1
    fi
  else
    ok "mongodb already listening on :27017"
  fi
else
  info "using remote MongoDB — skipping local start"
fi

# --- ML service -----------------------------------------------------------

if [[ ! -f "$ROOT/ml-service/model.pkl" ]]; then
  info "training ML model (first run only)…"
  (cd "$ROOT/ml-service" && source .venv/bin/activate && python train.py) >"$LOG_DIR/train.log" 2>&1 \
    || { err "model training failed — see $LOG_DIR/train.log"; exit 1; }
fi

info "starting ML service on :8000…"
(
  cd "$ROOT/ml-service"
  source .venv/bin/activate
  exec uvicorn app:app --port 8000 --log-level warning
) >"$LOG_DIR/ml.log" 2>&1 &
ML_PID=$!

wait_for_url "http://localhost:8000/health" "ml-service" || exit 1

# --- Backend --------------------------------------------------------------

info "starting backend on :5000…"
(
  cd "$ROOT/backend"
  exec npm start --silent
) >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

wait_for_url "http://localhost:5000/api/health" "backend" 60 || {
  err "backend failed to start — tail of $LOG_DIR/backend.log:"
  tail -20 "$LOG_DIR/backend.log" || true
  exit 1
}

# --- Frontend -------------------------------------------------------------

info "starting frontend on :5173…"
(
  cd "$ROOT/frontend"
  exec npm run dev -- --port 5173
) >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

wait_for_url "http://localhost:5173" "frontend" 60 || {
  err "frontend failed to start — tail of $LOG_DIR/frontend.log:"
  tail -20 "$LOG_DIR/frontend.log" || true
  exit 1
}

# --- Open browser ---------------------------------------------------------

URL="http://localhost:5173"
if command -v open >/dev/null; then open "$URL"
elif command -v xdg-open >/dev/null; then xdg-open "$URL"
fi

echo
ok  "everything is up → $URL"
echo "   logs: $LOG_DIR/{ml,backend,frontend}.log"
echo "   press Ctrl+C to stop."
echo

# Wait for any child to exit (then cleanup runs).
wait -n "$ML_PID" "$BACKEND_PID" "$FRONTEND_PID"
