#!/usr/bin/env bash
set -e
ALIAS_LINE="alias preview='cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && export ALLOWED_ORIGIN=http://localhost:3001 NEXT_PUBLIC_WEBSITE_URL=http://localhost:3001 PORT=3001 && (curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3001/ | grep -q 200 || nohup npm run dev >/dev/null 2>&1 &) && for i in {1..40}; do curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3001/ | grep -q 200 && break || sleep 0.25; done && powershell.exe -NoProfile -Command Start-Process http://localhost:3001/'"
if ! grep -q "^alias preview=" "$HOME/.bashrc" 2>/dev/null; then
  echo "$ALIAS_LINE" >> "$HOME/.bashrc"
fi
. "$HOME/.bashrc" || true
echo ALIAS_OK
