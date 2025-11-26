# RESUMO COMPLETO - SUPABASE ZAPPRO - AJUDATEC - WILREFRIMIX

## INFORMAÇÕES GERAIS DO PROJETO

**Nome do Projeto:** zappro-ajudatec-wilrefrimix
**Organização:** ZapPRO.site
**Plano:** Libre (Gratuito)
**Ambiente:** principal - Produção
**URL Base:** https://sdpmbjbbyywufmqxgzra.supabase.co

***

## CONFIGURAÇÕES DE API

### URL do Projeto
- **Endpoint RESTful:** https://sdpmbjbbyywufmqxgzra.supabase.co
- **Fonte:** Banco de Dados Primário

### Configurações da API de Dados
- **Status:** Habilitada ✅
- **Descrição:** Acesso a qualquer biblioteca cliente Supabase e endpoints PostgREST com qualquer esquema configurado

### Esquemas Expostos
- `público` (exposto)
- `graphql_public` (exposto)

### Caminho de Pesquisa Adicional
- `público`
- `extensões`

### Limites
- **Número Máximo de Linhas:** 1000 (limite de resposta para proteger contra requisições acidentais/maliciosas)
- **Tamanho da Piscina:** Configurado automaticamente conforme tamanho do poder computacional (Nano)
- **Conexões Máximas do Cliente:** 200 (fixo para Nano, não alterável)
- **Tamanho da Piscina de Conexões:** 15 (padrão para Nano)

***

## CHAVES DE API

### Chaves Publicáveis (Safe para navegador com RLS habilitado)
1. **Web:** `sb_publishable_ltaNA7nnVozoSCOcZIjg`
2. **Móvel:** `sb_publishable_YpotEpinEWsC2dI7FIKI`

### Chaves Secretas
- **API de Backend:** `sb_secret_8I4Se...` (truncada)
- **Status:** Nenhuma chave de API secreta adicional ativa

***

## ESTRUTURA DO BANCO DE DADOS

### Tabela Principal
**Nome:** `base de conhecimento de perguntas frequentes`
**Descrição:** Base de conhecimento de FAQs HVAC-R com busca vetorial
**Tamanho Estimado:** 1672 kB
**Linhas Estimadas:** 0 (sem dados atualmente)
**Colunas:** 16 campos

#### Estrutura de Colunas da Tabela

| Campo | Tipo de Dados | Formato | Descrição |
|-------|---------------|---------|-----------|
| id | uuid | uuid | Identificador único |
| pergunta | text | text | Pergunta/Query |
| resposta | text | text | Resposta |
| fonte_tipo | text | text | Tipo da fonte |
| fonte_canal | text | text | Canal da fonte |
| fonte_url | text | text | URL da fonte |
| fonte_titulo | text | text | Título da fonte |
| carimbo de data/hora | text | text | Timestamp |
| tags | ARRAY | _text | Array de tags |
| idioma | text | text | Idioma do conteúdo |
| prioridade | integer | int4 | Nível de prioridade |
| referências_validadas | jsonb | jsonb | Referências em JSON |
| incorporação | vector | vector | Vetor de embeddings (1536 dimensões - OpenAI text-embedding-3-small) |
| criado_em | timestamp with time zone | timestamptz | Data/hora de criação |
| _em | timestamp with time zone | timestamptz | Data/hora de atualização |
| pés | tsvector | tsvector | Full-text search vector |

***

## CONFIGURAÇÕES DE BANCO DE DADOS

### Conexão
- **Pool:** Compartilhado (Pooler)
- **Tamanho da Piscina:** 15 conexões
- **Conexões Máximas de Cliente:** 200

### Segurança
- **SSL:** Configurado
- **Importar SSL em conexões de entrada:** Desativado
- **Certificado SSL:** Disponível para download

### Restrições de Rede
- **Status:** Banco de dados acessível por todos os IPs
- **Restrições Ativas:** Nenhuma
- **IPs Banidos:** Nenhum

***

## PLATAFORMA E INFRAESTRUTURA

### Computação
- **Tamanho:** Nano
- **Status:** Produção

### Disponibilidades
- Replicação: Disponível
- Cópias de Segurança: Disponível
- Migrações: Disponível
- Webhooks: Disponível

***

## O QUE PRECISA SER MELHORADO/IMPLEMENTADO

1. **Autenticação:**
   - ❌ Não há usuários criados
   - ⚠️ Página de Autenticação apresenta erro de extensão
   - Configurar providers de autenticação (Email/Password, OAuth, etc)

2. **Dados na Tabela:**
   - ❌ A tabela "base de conhecimento de perguntas frequentes" está vazia (0 linhas)
   - Necessário popular com FAQs HVAC-R

3. **Políticas de Segurança (RLS):**
   - Implementar Row Level Security para as tabelas
   - Definir políticas de acesso baseadas em roles

4. **Storage:**
   - Verificar configuração de armazenamento de arquivos
   - Não foi visitado detalhadamente

5. **Edge Functions:**
   - Não há functions criadas
   - Poderia criar funções serverless para processamento de dados

6. **Realtime:**
   - Não há publicações configuradas
   - Considerar habilitar subscriptions para atualizações em tempo real

7. **Integrações:**
   - Webhooks não foram configurados
   - Poderia integrar com sistemas externos para atualizar base de conhecimento

***

## RESUMO TÉCNICO PARA IA

Seu projeto Supabase está configurado para ser um **serviço de base de conhecimento HVAC-R com busca vetorial**. A estrutura de dados está pronta com embeddings OpenAI, mas sem dados. O backend está seguro com chaves separadas (pública/secreta), limites de requisição aplicados (1000 linhas max) e pool de conexões otimizado para o plano Nano. A tabela utiliza tsvector para full-text search e incorporação para busca semântica com embeddings 1536-dim. Recomenda-se popular a tabela, implementar RLS, configurar autenticação e criar funções edge para processamento inteligente de queries.