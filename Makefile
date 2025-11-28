.PHONY: run stop run-improved run-fullstack restart stop-all test help start deploy

# Default target
.DEFAULT_GOAL := help

# Help menu
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔧 ZapPRO - Comandos Disponíveis"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📦 Desenvolvimento Estável (Recomendado):"
	@echo "  make start          - Inicia servidor e MANTÉM rodando (Foreground) ⭐"
	@echo ""
	@echo "📦 Preview (Background):"
	@echo "  make run            - Inicia preview (versão original)"
	@echo "  make run-improved   - Inicia preview (versão melhorada)"
	@echo "  make stop           - Para o servidor preview"
	@echo ""
	@echo "🚀 Full Stack (Supabase + Next.js):"
	@echo "  make run-fullstack  - Inicia stack completo 🔥"
	@echo "  make stop-all       - Para todos os serviços"
	@echo ""
	@echo "🧪 Testes:"
	@echo "  make test           - Executa testes automatizados"
	@echo ""
	@echo "🚀 Deploy Automatizado (CI/CD local):"
	@echo "  make deploy         - Inicia servidor, roda unit/e2e/performance e monitora"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

start:
	@bash scripts/run-stable.sh

run: start

# Improved preview script (with validations and colors)
run-improved:
	@bash scripts/preview-improved.sh

# Full stack preview (Supabase + Next.js)
run-fullstack:
	@bash scripts/preview-fullstack.sh

# Stop preview server only
stop:
	@bash scripts/stop-preview.sh

# Stop all services (Next.js + Docker Compose)
stop-all:
	@bash scripts/stop-all.sh

# Restart preview server
restart:
	@bash scripts/restart-preview.sh

# Run automated tests
test:
	@bash scripts/run-tests.sh

deploy:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🚀 Deploy Automatizado"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@bash -lc 'scripts/preview-improved.sh && cd apps/saas && npm run typecheck && npm run test:unit && node "$$PWD/../make" --cwd apps/saas --tests tests/ui-buttons.spec.ts,tests/e2e.spec.ts,tests/chat-trial.spec.ts,tests/status.spec.ts,tests/cache.spec.ts --fail-fast && node apps/saas/scripts/sprite.mjs | tee logs/deploy-sprite.log && node apps/saas/scripts/postdeploy-smoke.mjs | tee logs/postdeploy-smoke.log && bash scripts/stop-preview.sh' || bash scripts/stop-preview.sh
