#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/saas"
cd "$APP"

export ALLOWED_ORIGIN=http://localhost:3001
export NEXT_PUBLIC_WEBSITE_URL=http://localhost:3001
export PORT=3001

# Detect if port 3001 is already listening (WSL)
IS_LISTENING=0
if command -v ss >/dev/null 2>&1; then
  if ss -ltn | grep -q ":3001"; then IS_LISTENING=1; fi
fi

# Fallback: HTTP check if ss not conclusive
if [ "$IS_LISTENING" -eq 0 ]; then
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q 200; then
    IS_LISTENING=1
  fi
fi

# Start dev only if not already running
if [ "$IS_LISTENING" -eq 0 ]; then
  nohup npm run dev >/dev/null 2>&1 &
  sleep 0.8
fi

# Wait until HTTP 200
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ || echo "")
  if [ "$code" = "200" ]; then break; fi
  sleep 0.25
done

# Open in Windows default browser from WSL
powershell.exe -NoProfile -Command Start-Process http://localhost:3001/
echo PREVIEW_URL: http://localhost:3001/
