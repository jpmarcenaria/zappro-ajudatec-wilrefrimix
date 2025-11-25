# Regra: Português Brasileiro Obrigatório

## Aplicação
Todos os artefatos gerados devem estar em português brasileiro (pt-BR):
- Descrições de tarefas
- Comentários em código
- Documentação
- Mensagens de commit
- Logs e outputs
- Nomes de arquivos de documentação
- Títulos e seções

## Exceções (manter em inglês)
- Sintaxe de código (TypeScript, Python, SQL, JavaScript)
- Nomes de pacotes NPM
- Comandos Git/CLI
- Variáveis de ambiente
- URLs e endpoints
- Nomes de funções e classes no código
- Imports e exports

## Exemplos

### ✅ CORRETO
```markdown
# TAREFA 1: Simular Webhook Stripe (Modo Mock)
- Criar endpoint `/api/webhook/stripe/test`
- Implementar lógica de validação
```

```typescript
// Carregar persona do arquivo
const personaPath = path.join(process.cwd(), 'PROMPTS', 'chatbot-persona.md')
```

### ❌ ERRADO
```markdown
# TASK 1: Simulate Stripe Webhook (Mock Mode)
- Create endpoint `/api/webhook/stripe/test`
- Implement validation logic
```

```typescript
// Load persona from file
const personaPath = path.join(process.cwd(), 'PROMPTS', 'chatbot-persona.md')
```

## Prioridade
Esta regra tem prioridade **ALTA**. Em caso de conflito com outras instruções, sempre usar pt-BR.

## Validação
Antes de finalizar qualquer artefato, verificar:
1. Títulos e descrições em pt-BR? ✓
2. Comentários de código em pt-BR? ✓
3. Documentação em pt-BR? ✓
4. Sintaxe de código em inglês? ✓
5. Nomes de pacotes em inglês? ✓
