.PHONY: run stop run-improved run-fullstack restart stop-all test help start

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
