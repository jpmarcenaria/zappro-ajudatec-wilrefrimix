# Análise de Segurança: scripts/preview.sh + Makefile

**Data:** 26/11/2025  
**Script:** `scripts/preview.sh`  
**Comando:** `make run`

---

## ✅ Validação de Sintaxe

```bash
bash -n scripts/preview.sh
# ✅ Passou sem erros
```

---

## 🔍 Análise Linha por Linha

### Linha 1-2: Shebang e Error Handling
```bash
#!/usr/bin/env bash
set -e
```

**Status:** ✅ **BOM**

**Análise:**
- ✅ Shebang correto (`/usr/bin/env bash`)
- ✅ `set -e` - Para execução em caso de erro
- ⚠️ **Sugestão:** Adicionar `set -u` (erro em variáveis não definidas)
- ⚠️ **Sugestão:** Adicionar `set -o pipefail` (erro em pipes)

**Recomendação:**
```bash
#!/usr/bin/env bash
set -euo pipefail  # Mais seguro
```

---

### Linha 3-5: Detecção de Diretórios
```bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/saas"
cd "$APP"
```

**Status:** ✅ **BOM**

**Análise:**
- ✅ Usa `dirname "$0"` para path relativo ao script
- ✅ Usa `pwd` para path absoluto
- ✅ Aspas duplas em variáveis (evita word splitting)
- ✅ `cd "$APP"` muda para diretório correto

**Possíveis Problemas:**
- ⚠️ Se `apps/saas` não existir, `cd` falhará (mas `set -e` captura)
- ⚠️ Não valida se `$APP` é um diretório válido

**Melhoria Sugerida:**
```bash
if [ ! -d "$APP" ]; then
  echo "❌ Erro: Diretório $APP não encontrado"
  exit 1
fi
cd "$APP"
```

---

### Linha 7-9: Variáveis de Ambiente
```bash
export ALLOWED_ORIGIN=http://localhost:3001
export NEXT_PUBLIC_WEBSITE_URL=http://localhost:3001
export PORT=3001
```

**Status:** ✅ **BOM**

**Análise:**
- ✅ Valores hardcoded seguros (localhost)
- ✅ Não expõe secrets
- ⚠️ **Limitação:** Porta fixa (não permite customização)

**Possível Melhoria:**
```bash
PORT="${PORT:-3001}"  # Permite override via env var
export ALLOWED_ORIGIN="http://localhost:$PORT"
export NEXT_PUBLIC_WEBSITE_URL="http://localhost:$PORT"
export PORT
```

---

### Linha 11-22: Detecção de Porta Ocupada
```bash
IS_LISTENING=0
if command -v ss > /dev/null 2>&1; then
  if ss -ltn | grep -q ":3001"; then IS_LISTENING=1; fi
fi

if [ "$IS_LISTENING" -eq 0 ]; then
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q 200; then
    IS_LISTENING=1
  fi
fi
```

**Status:** ✅ **EXCELENTE**

**Análise:**
- ✅ Verifica se `ss` existe antes de usar (`command -v`)
- ✅ Fallback para `curl` se `ss` não funcionar
- ✅ Evita iniciar servidor duplicado
- ✅ Redirecionamento de stderr (`2>&1`)

**Possíveis Melhorias:**
- ⚠️ `grep -q ":3001"` pode dar falso positivo (ex: `:30011`)
- ⚠️ Não valida se o processo é realmente o Next.js

**Melhoria Sugerida:**
```bash
# Mais preciso: verifica porta exata
if ss -ltn | grep -qE ":3001\s"; then IS_LISTENING=1; fi
```

---

### Linha 24-28: Iniciar Servidor
```bash
if [ "$IS_LISTENING" -eq 0 ]; then
  nohup npm run dev > /dev/null 2>&1 &
  sleep 0.8
fi
```

**Status:** ⚠️ **BOM, MAS PODE MELHORAR**

**Análise:**
- ✅ Usa `nohup` para manter processo após script terminar
- ✅ Redireciona output para `/dev/null` (silencioso)
- ✅ `&` executa em background
- ⚠️ **Problema:** `sleep 0.8` é arbitrário (pode não ser suficiente)
- ⚠️ **Problema:** Não captura PID do processo (dificulta kill posterior)
- ⚠️ **Problema:** Não valida se `npm` existe

**Melhorias Sugeridas:**

1. **Capturar PID:**
```bash
nohup npm run dev > /dev/null 2>&1 &
NPM_PID=$!
echo "🚀 Servidor iniciado (PID: $NPM_PID)"
```

2. **Validar npm:**
```bash
if ! command -v npm > /dev/null 2>&1; then
  echo "❌ Erro: npm não encontrado"
  exit 1
fi
```

3. **Sleep dinâmico (remover, pois já tem wait loop):**
```bash
# Remover sleep 0.8, o loop de wait já cobre isso
```

---

### Linha 30-35: Wait Loop (Health Check)
```bash
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ || echo "")
  if [ "$code" = "200" ]; then break; fi
  sleep 0.25
done
```

**Status:** ✅ **EXCELENTE**

**Análise:**
- ✅ Timeout de 15 segundos (60 * 0.25s)
- ✅ Usa `curl` para validar HTTP 200
- ✅ Fallback com `|| echo ""` se curl falhar
- ✅ Break ao detectar sucesso

**Possíveis Melhorias:**
- ⚠️ Não informa se timeout foi atingido
- ⚠️ Não valida se `curl` existe

**Melhoria Sugerida:**
```bash
echo "⏳ Aguardando servidor iniciar..."
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null || echo "")
  if [ "$code" = "200" ]; then
    echo "✅ Servidor pronto!"
    break
  fi
  sleep 0.25
done

if [ "$code" != "200" ]; then
  echo "❌ Timeout: Servidor não respondeu em 15s"
  exit 1
fi
```

---

### Linha 37-39: Abrir Navegador
```bash
powershell.exe -NoProfile -Command Start-Process http://localhost:3001/
echo PREVIEW_URL: http://localhost:3001/
```

**Status:** ✅ **BOM**

**Análise:**
- ✅ Usa `powershell.exe` (WSL → Windows)
- ✅ `-NoProfile` evita carregar perfil (mais rápido)
- ✅ `Start-Process` abre navegador padrão
- ✅ Echo da URL para referência

**Possíveis Problemas:**
- ⚠️ Falha silenciosa se não estiver no WSL
- ⚠️ Não valida se `powershell.exe` existe

**Melhoria Sugerida:**
```bash
if command -v powershell.exe > /dev/null 2>&1; then
  powershell.exe -NoProfile -Command "Start-Process http://localhost:3001/"
  echo "🌐 Navegador aberto: http://localhost:3001/"
else
  echo "⚠️  Abra manualmente: http://localhost:3001/"
fi
```

---

## 🔒 Análise de Segurança

### ✅ Pontos Fortes

1. **Não expõe secrets** - Apenas localhost
2. **Validação de porta** - Evita duplicação
3. **Error handling** - `set -e` captura erros
4. **Redirecionamento seguro** - `/dev/null` para logs
5. **Aspas em variáveis** - Evita word splitting
6. **Fallback robusto** - `ss` → `curl`

### ⚠️ Vulnerabilidades Potenciais

| Risco | Severidade | Descrição | Mitigação |
|-------|------------|-----------|-----------|
| **Command Injection** | 🟢 Baixo | Variáveis hardcoded, sem input externo | ✅ Seguro |
| **Path Traversal** | 🟢 Baixo | Usa `pwd` e paths relativos seguros | ✅ Seguro |
| **Race Condition** | 🟡 Médio | Entre check de porta e `npm run dev` | ⚠️ Improvável, mas possível |
| **Resource Leak** | 🟡 Médio | Processo `npm` não é rastreado (PID) | ⚠️ Dificulta cleanup |
| **Timeout Silencioso** | 🟡 Médio | Não avisa se servidor não subir | ⚠️ Pode confundir usuário |
| **Dependência de Ferramentas** | 🟢 Baixo | Assume `curl`, `npm`, `powershell.exe` | ✅ Comum em ambiente WSL |

### 🛡️ Recomendações de Segurança

1. **Adicionar validações de dependências:**
```bash
for cmd in npm curl; do
  if ! command -v $cmd > /dev/null 2>&1; then
    echo "❌ Erro: $cmd não encontrado"
    exit 1
  fi
done
```

2. **Capturar PID para cleanup:**
```bash
# Criar arquivo de PID
echo $NPM_PID > "$ROOT/.preview.pid"

# Adicionar trap para cleanup
trap 'rm -f "$ROOT/.preview.pid"' EXIT
```

3. **Validar timeout:**
```bash
if [ "$code" != "200" ]; then
  echo "❌ Servidor não iniciou. Verifique logs em apps/saas/server.log"
  exit 1
fi
```

---

## 🧪 Testes Recomendados

### Teste 1: Execução Normal
```bash
make run
# Esperado: Servidor inicia, navegador abre
```

### Teste 2: Servidor Já Rodando
```bash
# Terminal 1
cd apps/saas && npm run dev

# Terminal 2
make run
# Esperado: Detecta servidor, apenas abre navegador
```

### Teste 3: Porta Ocupada (outro processo)
```bash
# Ocupar porta 3001
python3 -m http.server 3001 &

# Executar script
make run
# Esperado: Detecta porta ocupada, tenta conectar, falha ou sucede
```

### Teste 4: Diretório Inválido
```bash
# Renomear apps/saas temporariamente
mv apps/saas apps/saas.bak

# Executar
make run
# Esperado: Erro "cd: apps/saas: No such file or directory"
```

### Teste 5: Sem npm
```bash
# Remover npm do PATH temporariamente
PATH=/usr/bin make run
# Esperado: Erro "npm: command not found"
```

---

## 📝 Script Melhorado (Versão Segura)

```bash
#!/usr/bin/env bash
set -euo pipefail  # Strict mode

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect directories
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/saas"
PID_FILE="$ROOT/.preview.pid"

# Cleanup on exit
trap 'rm -f "$PID_FILE"' EXIT

# Validate dependencies
for cmd in npm curl; do
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: $cmd não encontrado${NC}"
    exit 1
  fi
done

# Validate directory
if [ ! -d "$APP" ]; then
  echo -e "${RED}❌ Erro: Diretório $APP não encontrado${NC}"
  exit 1
fi

cd "$APP"

# Environment variables
PORT="${PORT:-3001}"
export ALLOWED_ORIGIN="http://localhost:$PORT"
export NEXT_PUBLIC_WEBSITE_URL="http://localhost:$PORT"
export PORT

# Check if port is already listening
IS_LISTENING=0
if command -v ss > /dev/null 2>&1; then
  if ss -ltn | grep -qE ":${PORT}\s"; then
    IS_LISTENING=1
  fi
fi

# Fallback: HTTP check
if [ "$IS_LISTENING" -eq 0 ]; then
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null | grep -q 200; then
    IS_LISTENING=1
  fi
fi

# Start server if not running
if [ "$IS_LISTENING" -eq 0 ]; then
  echo -e "${YELLOW}🚀 Iniciando servidor Next.js...${NC}"
  nohup npm run dev > /dev/null 2>&1 &
  NPM_PID=$!
  echo "$NPM_PID" > "$PID_FILE"
  echo -e "${GREEN}   PID: $NPM_PID${NC}"
else
  echo -e "${GREEN}✅ Servidor já está rodando${NC}"
fi

# Wait for server to be ready
echo -e "${YELLOW}⏳ Aguardando servidor responder...${NC}"
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "")
  if [ "$code" = "200" ]; then
    echo -e "${GREEN}✅ Servidor pronto!${NC}"
    break
  fi
  sleep 0.25
done

# Validate server started
if [ "$code" != "200" ]; then
  echo -e "${RED}❌ Timeout: Servidor não respondeu em 15s${NC}"
  echo -e "${YELLOW}   Verifique logs em: apps/saas/server.log${NC}"
  exit 1
fi

# Open browser
if command -v powershell.exe > /dev/null 2>&1; then
  powershell.exe -NoProfile -Command "Start-Process http://localhost:$PORT/" 2>/dev/null || true
  echo -e "${GREEN}🌐 Navegador aberto: http://localhost:$PORT/${NC}"
else
  echo -e "${YELLOW}⚠️  Abra manualmente: http://localhost:$PORT/${NC}"
fi

echo -e "${GREEN}✨ Preview pronto!${NC}"
```

---

## 📊 Comparação: Original vs Melhorado

| Aspecto | Original | Melhorado |
|---------|----------|-----------|
| **Linhas** | 40 | 75 |
| **Strict mode** | `set -e` | `set -euo pipefail` |
| **Validação deps** | ❌ | ✅ npm, curl |
| **Validação dir** | ❌ | ✅ apps/saas existe |
| **Feedback visual** | Mínimo | ✅ Cores + emojis |
| **Error handling** | Básico | ✅ Mensagens claras |
| **PID tracking** | ❌ | ✅ Salva em .preview.pid |
| **Cleanup** | ❌ | ✅ Trap EXIT |
| **Timeout feedback** | ❌ | ✅ Avisa se falhar |
| **Porta customizável** | ❌ | ✅ Via env var PORT |
| **Segurança** | ✅ Boa | ✅ Excelente |

---

## ✅ Conclusão

### Status Atual: **🟢 SEGURO PARA USO**

O script `preview.sh` está **bem escrito** e **seguro** para uso em desenvolvimento. Não há vulnerabilidades críticas.

### Pontos Fortes:
- ✅ Lógica robusta de detecção de porta
- ✅ Fallback inteligente (ss → curl)
- ✅ Não expõe secrets
- ✅ Error handling básico funcional

### Melhorias Recomendadas (Opcionais):
1. ⚠️ Adicionar validação de dependências
2. ⚠️ Melhorar feedback visual (cores)
3. ⚠️ Capturar PID para cleanup
4. ⚠️ Validar timeout explicitamente
5. ⚠️ Permitir porta customizável

### Prioridade de Implementação:
- **Alta:** Validação de timeout (evita confusão)
- **Média:** Feedback visual (UX)
- **Baixa:** PID tracking (nice to have)

---

**Recomendação Final:** ✅ **Aprovar para uso** com sugestão de implementar melhorias opcionais.
