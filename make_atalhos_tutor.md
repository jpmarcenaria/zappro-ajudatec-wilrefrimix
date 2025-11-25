# Atalhos com Make

## Instalar
- `sudo apt update && sudo apt install -y make`

## Usar
- `make run`

## Adicionar novos atalhos
- `Makefile`:
  - `seed:` → `docker compose up -d`
  - `open:` → `xdg-open` ou `wslview http://localhost:3001/`
  - `test:` → `BASE_URL=http://localhost:3001 npm run test:e2e`

## Exemplo
```
.PHONY: run seed open test
run:
	bash scripts/preview.sh
seed:
	docker compose up -d
open:
	wslview http://localhost:3001/
test:
	BASE_URL=http://localhost:3001 npm run test:e2e -- apps/saas/tests/*.spec.ts
```
