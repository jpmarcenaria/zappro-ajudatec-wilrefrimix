# Testes E2E - Stripe Checkout com Playwright

## 🧪 Configuração de Testes

### Instalação do Playwright

```bash
# Instalar Playwright
npm install -D @playwright/test

# Instalar browsers
npx playwright install
```

### Estrutura de Arquivos

```
apps/saas/
├── tests/
│   └── stripe-checkout.spec.ts    # Testes E2E do Stripe
├── playwright.config.ts            # Configuração do Playwright
└── package.json                    # Scripts de teste
```

## 🚀 Como Executar os Testes

### Modo Interativo (UI)

```bash
npx playwright test --ui
```

### Modo Headless (CI/CD)

```bash
npx playwright test
```

### Executar teste específico

```bash
npx playwright test stripe-checkout
```

### Executar em browser específico

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug Mode

```bash
npx playwright test --debug
```

## 📋 Testes Implementados

### 1. **Testes de UI**
- ✅ Verificar botão de pagamento na landing page
- ✅ Criar checkout session ao clicar
- ✅ Redirecionar para Stripe Checkout
- ✅ Exibir valor correto (R$ 99,90)
- ✅ Preencher formulário com cartão de teste
- ✅ Cancelar checkout e voltar
- ✅ Exibir página de sucesso
- ✅ Exibir página de cancelamento

### 2. **Testes de API**
- ✅ Retornar session URL válida
- ✅ Validar formato do session ID
- ✅ Tratar erros de configuração

## 🎯 Cartões de Teste Stripe

### Sucesso
```
Número: 4242 4242 4242 4242
Data: 12/34 (qualquer data futura)
CVC: 123 (qualquer 3 dígitos)
CEP: Qualquer CEP válido
```

### Falha (Cartão Recusado)
```
Número: 4000 0000 0000 0002
```

### Requer Autenticação 3D Secure
```
Número: 4000 0025 0000 3155
```

## 📊 Relatórios

### HTML Report

Após executar os testes, visualize o relatório:

```bash
npx playwright show-report
```

### Screenshots e Vídeos

Falhas geram automaticamente:
- Screenshots em `test-results/`
- Vídeos em `test-results/`
- Traces em `test-results/`

## 🔧 Configuração do CI/CD

### GitHub Actions

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 Debug e Troubleshooting

### Ver trace de um teste falhado

```bash
npx playwright show-trace test-results/.../trace.zip
```

### Executar com logs detalhados

```bash
DEBUG=pw:api npx playwright test
```

### Pausar execução para debug

```typescript
await page.pause()
```

## 📝 Boas Práticas

1. **Sempre use seletores estáveis**
   - Prefira `data-testid` ao invés de classes CSS
   - Use `text=` para textos visíveis

2. **Aguarde elementos carregarem**
   - Use `waitForSelector` quando necessário
   - Configure timeouts adequados

3. **Isole testes**
   - Cada teste deve ser independente
   - Use `beforeEach` para setup

4. **Mock quando necessário**
   - Mock APIs externas em testes unitários
   - Use testes E2E para fluxos completos

## 🎬 Próximos Passos

- [ ] Adicionar testes de webhook do Stripe
- [ ] Testar fluxo completo com 3D Secure
- [ ] Adicionar testes de diferentes métodos de pagamento
- [ ] Implementar testes de performance
- [ ] Configurar CI/CD pipeline
