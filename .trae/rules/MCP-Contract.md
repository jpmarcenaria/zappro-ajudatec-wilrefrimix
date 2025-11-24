# Contrato Técnico – MCPs (Model Context Protocol) na Trae IDE

Versão: 1.0
Data de implementação obrigatória: 25/11/2025

Este documento estabelece definições, padrões de uso, templates e checklist para os MCPs habilitados na Trae IDE, com execução obrigatória em WSL (Windows Subsystem for Linux) e alinhamento às melhores práticas de 2025.

## Lista de MCPs Cobertos
- Postgrest
- GitHub
- Fetch
- Persistent Knowledge Graph
- Memory
- Sequential Thinking
- TaskManager
- testsprite
- context7
- Playwright
- webresearch
- Brave Search
- Tavily
- Firecrawl

---

## Postgrest
1) Definição e contexto
- Cliente MCP para PostgREST, permitindo CRUD via REST sobre um banco Postgres exposto com PostgREST. Ideal para backends data‑driven com ACL e policies no banco.

2) Casos de uso
- Leitura/consulta de dados públicos ou protegidos via policies RLS.
- Conversão de SQL para chamadas REST em integrações low‑code.

3) Benefícios
- Padroniza acesso seguro (RLS, JWT). Menor acoplamento com drivers DB.
- Facilita caching e gateways HTTP.

4) Exemplo (comentado)
```ts
// Consulta direta
const r = await mcp_Postgrest_postgrestRequest({ method: 'GET', path: '/v1/items?select=*&limit=10' })
// Conversão SQL→REST
const s = await mcp_Postgrest_sqlToRest({ sql: 'select * from items limit 5' })
```

5) Limitações
- Dependência de PostgREST e suas policies.
- Operações complexas podem exigir SQL server‑side.

Diretriz obrigatória: usar Postgrest quando a fonte for PostgREST e houver necessidade de RLS/REST.

---

## GitHub
1) Definição e contexto
- MCP GitHub para repositórios, issues, PRs e conteúdo. Útil para automação de fluxo DevOps.

2) Casos de uso
- Abrir PR, criar issues, buscar código, publicar arquivos.

3) Benefícios
- Auditado e versionado; integra revisões e checks.

4) Exemplo
```ts
// Criar issue
await mcp_github_create_issue({ owner: 'org', repo: 'repo', title: 'Bug: ...', body: 'Passos...' })
// Buscar código
await mcp_github_search_code({ q: 'path:src function myFn', per_page: 10 })
```

5) Limitações
- Rate limits da API; permissions/OAuth.

Diretriz obrigatória: usar GitHub MCP para operações de SCM/PR/issues ao invés de chamadas ad‑hoc.

---

## Fetch
1) Definição e contexto
- MCP de fetch HTTP com extração para markdown. Útil para coleta de conteúdo web.

2) Casos de uso
- Pegar documentação externa, páginas de referência, exemplos.

3) Benefícios
- Simplifica parsing e limites de tamanho.

4) Exemplo
```ts
const doc = await mcp_fetch_fetch({ url: 'https://example.com/docs', max_length: 4000 })
```

5) Limitações
- Bloqueios CORS/robots; conteúdo dinâmico client‑side.

Diretriz obrigatória: usar Fetch MCP para ingestão web supervisionada.

---

## Persistent Knowledge Graph
1) Definição e contexto
- MCP para grafo de conhecimento persistente: entidades, relações e observações. Ideal para memória organizacional.

2) Casos de uso
- Mapear domínios, rastrear decisões, relacionar requisitos e artefatos.

3) Benefícios
- Estrutura consultável; facilita rastreabilidade e reasoning.

4) Exemplo
```ts
await mcp_Persistent_Knowledge_Graph_create_entities({ entities: [{ name: 'Compressor X', entityType: 'Equipamento', observations: ['Manual v2.1'] }] })
await mcp_Persistent_Knowledge_Graph_create_relations({ relations: [{ from: 'Compressor X', to: 'Manual v2.1', relationType: 'documentado_por' }] })
```

5) Limitações
- Requer curadoria; pode crescer sem governança.

Diretriz obrigatória: usar PKG MCP para memória estruturada de projeto e fontes técnicas.

---

## Memory
1) Definição e contexto
- MCP de memória (chaves/valores, embeddings ou slots) para retenção de contexto multi‑turn. Útil para agentes.

2) Casos de uso
- Guardar preferências de execução (WSL), histórico de decisões, parâmetros padrão.

3) Benefícios
- Continuidade entre sessões; menos re‑busca.

4) Exemplo
```ts
// Pseudocódigo: salvar chave padrão
await memory.set('exec_env', 'WSL-Ubuntu-24.04')
const env = await memory.get('exec_env')
```

5) Limitações
- Estratégia de expiração e privacidade.

Diretriz obrigatória: registrar no Memory MCP escolhas de ambiente e contratos ativos.

---

## Sequential Thinking
1) Definição e contexto
- MCP para planejamento em passos (Chain‑of‑Thought estruturado/Tool‑former). Auxilia tarefas complexas.

2) Casos de uso
- Planos multi‑etapas: integração, refatoração, migração, testes.

3) Benefícios
- Reduz erros; claridade de dependências.

4) Exemplo
```ts
// Pseudocódigo
const plan = await sequential.plan(['Mapear rotas', 'Refatorar CORS', 'Validar smoke'])
for (const step of plan) await sequential.run(step)
```

5) Limitações
- Overhead se aplicado a tarefas triviais.

Diretriz obrigatória: empregar quando houver 3+ etapas com dependências claras.

---

## TaskManager
1) Definição e contexto
- MCP para lista de tarefas (todo), estados e progresso. No Trae, corresponde ao TodoWrite.

2) Casos de uso
- Orquestrar mudanças, rastrear execução, marcar concluído.

3) Benefícios
- Transparência, auditabilidade, foco em uma tarefa in_progress.

4) Exemplo
```ts
await TodoWrite({ todos: [{ id: 't1', content: 'Rodar smoke E2E', status: 'in_progress', priority: 'high' }] })
```

5) Limitações
- Não substitui um gestor de projetos completo.

Diretriz obrigatória: usar TaskManager para qualquer alteração multi‑arquivo ou com validação.

---

## testsprite
1) Definição e contexto
- MCP de testes (geração/execução de smoke/regressão). Útil para varreduras rápidas do repositório.

2) Casos de uso
- Smoke E2E pós‑deploy; geração de casos básicos a partir de endpoints e páginas.

3) Benefícios
- Feedback rápido; cobertura mínima garantida.

4) Exemplo
```ts
// Pseudocódigo
await testsprite.run({ baseUrl: 'http://localhost:3001', suites: ['openai', 'stripe'] })
```

5) Limitações
- Não substitui testes unitários/integrados abrangentes.

Diretriz obrigatória: executar testsprite após mudanças em rotas críticas.

---

## context7
1) Definição e contexto
- MCP para contexto expandido (buffers multi‑janela, indexação temporal). Útil para fornecer mais histórico ao agente.

2) Casos de uso
- Revisões longas de PRs, análise de logs, decisões arquiteturais com histórico.

3) Benefícios
- Menos perda de informação; melhor grounding.

4) Exemplo
```ts
// Pseudocódigo
await context7.attachFiles(['README.md', 'CHANGELOG.md'])
```

5) Limitações
- Custo cognitivo e de memória.

Diretriz obrigatória: usar quando a decisão depende de contexto longo e distribuído.

---

## Playwright
1) Definição e contexto
- MCP para automação de browser (E2E). Útil para validar UX e rotas.

2) Casos de uso
- Testar navegação `/` → `/chat`, interações com upload e TTS.

3) Benefícios
- Alto realismo de testes; captura de regressões visuais.

4) Exemplo
```ts
// Exemplo Playwright (comentado)
import { test, expect } from '@playwright/test'
test('chat abre e envia mensagem', async ({ page }) => {
  await page.goto('http://localhost:3001')
  await page.click('text=Chat')
  await page.fill('textarea', 'Teste')
  await page.click('button:has-text("Enviar")')
  await expect(page.locator('.message')).toContainText('Teste')
})
```

5) Limitações
- Infra pesada; flakiness se ambiente não for determinístico.

Diretriz obrigatória: usar em features de UI críticas (upload, TTS, OAuth).

---

## webresearch
1) Definição e contexto
- MCP para pesquisa web agregada. No Trae, mapeável ao `WebSearch`.

2) Casos de uso
- Buscar documentos técnicos, versões de APIs, melhores práticas.

3) Benefícios
- Atualização contínua; amplia cobertura.

4) Exemplo
```ts
await WebSearch({ query: 'Next.js 15 App Router CORS best practices', num: 5 })
```

5) Limitações
- Ruído e fontes não confiáveis; requer curadoria.

Diretriz obrigatória: usar em decisões que dependem de estado‑da‑arte.

---

## Brave Search
1) Definição e contexto
- MCP para buscar com Brave, foco em privacidade e qualidade.

2) Casos de uso
- Pesquisa técnica com menos tracking.

3) Benefícios
- Resultados de qualidade com viés reduzido.

4) Exemplo
```ts
// Pseudocódigo
await brave.search({ q: 'PostgREST RLS patterns', limit: 10 })
```

5) Limitações
- API quotas/licenciamento.

Diretriz obrigatória: preferir Brave para pesquisas técnicas sensíveis.

---

## Tavily
1) Definição e contexto
- MCP de pesquisa/QA web com síntese.

2) Casos de uso
- Resumo de múltiplas fontes; comparativos.

3) Benefícios
- Respostas estruturadas; menos esforço de curadoria.

4) Exemplo
```ts
// Pseudocódigo
await tavily.query({ q: 'CORS best practices Next.js 2025' })
```

5) Limitações
- Custos e coberturas variáveis.

Diretriz obrigatória: usar quando for necessária síntese de múltiplas fontes confiáveis.

---

## Firecrawl
1) Definição e contexto
- MCP para crawling/indexação de sites.

2) Casos de uso
- Construir base local de documentação; espelhamento de referências públicas.

3) Benefícios
- Busca local rápida; menos dependência externa.

4) Exemplo
```ts
// Pseudocódigo
await firecrawl.crawl({ url: 'https://docs.example.com', depth: 2 })
```

5) Limitações
- Respeitar robots.txt; quota; legalidade.

Diretriz obrigatória: usar para bases documentais internas e offline.

---

## Diretrizes de Aplicação
- Selecionar MCP conforme fonte/objetivo (dados, SCM, pesquisa, memória, teste, automação).
- Executar sempre via WSL e registrar decisões em PKG/Memory.
- Endurecer CORS e sanitizar erros; nunca vazar segredos em client.

## Templates de Implementação
- PostgREST
```ts
// Template consulta
await mcp_Postgrest_postgrestRequest({ method: 'GET', path: '/v1/<tabela>?select=*' })
```
- GitHub
```ts
await mcp_github_create_issue({ owner, repo, title, body })
```
- PKG
```ts
await mcp_Persistent_Knowledge_Graph_create_entities({ entities: [{ name, entityType, observations: [] }] })
```
- TaskManager
```ts
await TodoWrite({ todos: [{ id, content, status: 'in_progress', priority: 'high' }] })
```

## Checklist de Verificação
- [ ] Ambiente WSL ativo (Ubuntu 24.04/22.04)
- [ ] Escolha de MCP compatível com objetivo
- [ ] Variáveis de ambiente no server (sem vazamento em client)
- [ ] CORS endurecido e erros sanitizados
- [ ] Testes (testsprite/Playwright) executados
- [ ] Memória/PKG atualizada com decisões
- [ ] Lint/typecheck/build ok em WSL

## Referências Cruzadas
- Next.js App Router, CORS, server/client separation
- PostgREST RLS/Policies
- GitHub PR/Review workflows
- WSL execução e Docker integração

Atualização e Versionamento
- Este documento deve ser atualizado a cada nova versão de WSL/MCPs.
- Manter histórico e retrocompatibilidade com ambientes existentes.
