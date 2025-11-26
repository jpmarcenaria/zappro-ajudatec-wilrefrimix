# Guia Rápido - Executar Testes Playwright

## ⚠️ IMPORTANTE: Diretório Correto

Todos os comandos devem ser executados a partir do diretório `apps/saas`:

```bash
cd d:\projetos\zappro-ajudatec-wilrefrimix\zappro-ajudatec-wilrefrimix\apps\saas
```

## 🚀 Passo a Passo

### 1. Certifique-se que o servidor Next.js está rodando

**No PowerShell (já está rodando):**
```powershell
# Você já tem isso rodando na porta 3000
npm run dev
```

### 2. Execute os testes (em outro terminal)

**No PowerShell ou WSL, navegue para apps/saas:**
```bash
cd d:\projetos\zappro-ajudatec-wilrefrimix\zappro-ajudatec-wilrefrimix\apps\saas

# Executar testes do Stripe
npm run test:e2e:stripe

# OU modo UI interativo
npm run test:e2e:ui

# OU todos os testes
npm run test:e2e
```

## 🐛 Troubleshooting

### Erro: "Missing script"
**Causa:** Você está no diretório errado
**Solução:** 
```bash
cd apps/saas
npm run test:e2e:stripe
```

### Erro: "EADDRINUSE: address already in use"
**Causa:** Servidor já está rodando
**Solução:** Já corrigido! O Playwright agora reutiliza o servidor existente.

### Erro: "test.describe() called here"
**Causa:** Executando do diretório errado
**Solução:**
```bash
cd apps/saas
npm run test:e2e:stripe
```

## ✅ Comandos Corretos (do diretório apps/saas)

```bash
# Testes do Stripe apenas
npm run test:e2e:stripe

# Modo UI (recomendado para desenvolvimento)
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug

# Ver relatório HTML
npm run test:e2e:report

# Todos os testes E2E
npm run test:e2e
```

## 📍 Estrutura de Diretórios

```
d:\projetos\zappro-ajudatec-wilrefrimix\zappro-ajudatec-wilrefrimix\
├── apps/
│   └── saas/              ← EXECUTE COMANDOS AQUI
│       ├── tests/
│       │   └── stripe-checkout.spec.ts
│       ├── playwright.config.ts
│       └── package.json   ← Contém os scripts
└── ...
```

## 🎯 Exemplo Completo

```powershell
# Terminal 1 (PowerShell) - Servidor Next.js
cd d:\projetos\zappro-ajudatec-wilrefrimix\zappro-ajudatec-wilrefrimix\apps\saas
npm run dev

# Terminal 2 (PowerShell ou WSL) - Testes
cd d:\projetos\zappro-ajudatec-wilrefrimix\zappro-ajudatec-wilrefrimix\apps\saas
npm run test:e2e:ui
```
