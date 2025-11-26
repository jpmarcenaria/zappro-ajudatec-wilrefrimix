#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}🔄 ZapPRO Restart Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Stop server
echo -e "${YELLOW}1️⃣  Parando servidor...${NC}"
bash "$ROOT/scripts/stop-preview.sh"

echo ""

# Wait a bit
sleep 1

# Start server
echo -e "${YELLOW}2️⃣  Iniciando servidor...${NC}"
bash "$ROOT/scripts/preview-improved.sh"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Restart completo!${NC}"
