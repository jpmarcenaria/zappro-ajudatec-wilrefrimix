#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/saas"
PID_FILE="$ROOT/.preview.pid"
LOG_FILE="$ROOT/preview.log"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🧪 ZapPRO - Testes Automatizados     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
  local test_name="$1"
  local test_func="$2"
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}🧪 Teste: $test_name${NC}"
  echo ""
  
  if $test_func; then
    echo -e "${GREEN}✅ PASSOU${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ FALHOU${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
}

# Test 1: Servidor já rodando
test_server_already_running() {
  echo -e "${CYAN}Iniciando servidor manualmente...${NC}"
  
  cd "$APP"
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  
  echo -e "${CYAN}Aguardando servidor iniciar...${NC}"
  for i in $(seq 1 60); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null | grep -q 200; then
      echo -e "${GREEN}Servidor iniciado (PID: $pid)${NC}"
      break
    fi
    sleep 0.5
  done
  
  echo -e "${CYAN}Executando script preview...${NC}"
  bash "$ROOT/scripts/preview-improved.sh" 2>&1 | grep -q "Usando servidor existente"
  local result=$?
  
  # Cleanup
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  
  return $result
}

# Test 2: Porta ocupada por outro processo
test_port_occupied() {
  echo -e "${CYAN}Ocupando porta 3001 com Python...${NC}"
  
  if ! command -v python3 > /dev/null 2>&1; then
    echo -e "${YELLOW}Python3 não encontrado, pulando teste${NC}"
    return 0
  fi
  
  python3 -m http.server 3001 > /dev/null 2>&1 &
  local py_pid=$!
  sleep 2
  
  echo -e "${CYAN}Executando script preview...${NC}"
  PORT=3002 bash "$ROOT/scripts/preview-improved.sh" > /tmp/test-output.log 2>&1 &
  local script_pid=$!
  
  sleep 5
  
  # Check if script started on port 3002
  local result=0
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ 2>/dev/null | grep -q 200; then
    echo -e "${GREEN}Script iniciou em porta alternativa (3002)${NC}"
    result=0
  else
    echo -e "${RED}Script não iniciou em porta alternativa${NC}"
    result=1
  fi
  
  # Cleanup
  kill $py_pid 2>/dev/null || true
  if [ -f "$ROOT/.preview.pid" ]; then
    kill "$(cat "$ROOT/.preview.pid")" 2>/dev/null || true
    rm -f "$ROOT/.preview.pid"
  fi
  
  return $result
}

# Test 3: Diretório apps/saas não existe
test_missing_directory() {
  echo -e "${CYAN}Renomeando apps/saas temporariamente...${NC}"
  
  if [ -d "$APP" ]; then
    mv "$APP" "$APP.bak"
  fi
  
  echo -e "${CYAN}Executando script preview...${NC}"
  if bash "$ROOT/scripts/preview-improved.sh" 2>&1 | grep -q "não encontrado"; then
    echo -e "${GREEN}Erro detectado corretamente${NC}"
    result=0
  else
    echo -e "${RED}Erro não foi detectado${NC}"
    result=1
  fi
  
  # Restore
  if [ -d "$APP.bak" ]; then
    mv "$APP.bak" "$APP"
  fi
  
  return $result
}

# Test 4: npm não instalado (simulado)
test_missing_npm() {
  echo -e "${CYAN}Simulando npm ausente...${NC}"
  
  # Create temporary script without npm in PATH
  cat > /tmp/test-no-npm.sh << 'EOF'
#!/bin/bash
export PATH=/usr/bin:/bin
bash scripts/preview-improved.sh 2>&1 | grep -q "npm não encontrado"
EOF
  
  chmod +x /tmp/test-no-npm.sh
  cd "$ROOT"
  
  if /tmp/test-no-npm.sh; then
    echo -e "${GREEN}Validação de npm funcionou${NC}"
    result=0
  else
    echo -e "${RED}Validação de npm falhou${NC}"
    result=1
  fi
  
  rm -f /tmp/test-no-npm.sh
  return $result
}

# Test 5: curl não instalado (simulado)
test_missing_curl() {
  echo -e "${CYAN}Simulando curl ausente...${NC}"
  
  cat > /tmp/test-no-curl.sh << 'EOF'
#!/bin/bash
export PATH=/usr/bin:/bin
bash scripts/preview-improved.sh 2>&1 | grep -q "curl não encontrado"
EOF
  
  chmod +x /tmp/test-no-curl.sh
  cd "$ROOT"
  
  if /tmp/test-no-curl.sh; then
    echo -e "${GREEN}Validação de curl funcionou${NC}"
    result=0
  else
    echo -e "${RED}Validação de curl falhou${NC}"
    result=1
  fi
  
  rm -f /tmp/test-no-curl.sh
  return $result
}

# Test 6: Timeout (servidor não inicia)
test_timeout() {
  echo -e "${CYAN}Testando timeout (porta inexistente)...${NC}"
  
  # Use porta que não vai responder
  PORT=9999 timeout 20s bash "$ROOT/scripts/preview-improved.sh" 2>&1 | grep -q "Timeout"
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}Timeout detectado corretamente${NC}"
  else
    echo -e "${RED}Timeout não foi detectado${NC}"
  fi
  
  return $result
}

# Run all tests
echo -e "${CYAN}Iniciando bateria de testes...${NC}"
echo ""

run_test "Servidor já rodando" test_server_already_running
run_test "Porta ocupada por outro processo" test_port_occupied
run_test "Diretório apps/saas não existe" test_missing_directory
run_test "npm não instalado" test_missing_npm
run_test "curl não instalado" test_missing_curl
run_test "Timeout (servidor não inicia)" test_timeout

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         📊 Resumo dos Testes           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Testes Passaram: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Testes Falharam: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Alguns testes falharam${NC}"
  exit 1
fi
