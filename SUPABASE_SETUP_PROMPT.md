# Prompt para Agente Supabase - Knowledge Base FAQ HVAC-R

Crie a seguinte estrutura no banco de dados:

## 1. Habilitar Extensão pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. Criar Tabela faq_knowledge_base

```sql
CREATE TABLE faq_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  
  -- Fonte
  fonte_tipo TEXT NOT NULL CHECK (fonte_tipo IN ('youtube', 'manual', 'website')),
  fonte_canal TEXT,
  fonte_url TEXT,
  fonte_titulo TEXT,
  timestamp TEXT,
  
  -- Metadados
  tags TEXT[] DEFAULT '{}',
  idioma TEXT DEFAULT 'pt-BR',
  prioridade INTEGER DEFAULT 5,
  
  -- Enriquecimento
  referencias_validadas JSONB,
  
  -- Vetorização (pgvector) - IMPORTANTE: vetor de 1536 dimensões
  embedding vector(1536),
  
  -- Auditoria
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ,
  
  -- Full-text search em português
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', pergunta || ' ' || resposta)
  ) STORED
);
```

## 3. Criar Índices

```sql
-- Índice vetorial (CRÍTICO para performance de busca semântica)
CREATE INDEX idx_faq_embedding ON faq_knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice full-text search
CREATE INDEX idx_faq_fts ON faq_knowledge_base USING gin(fts);

-- Índice para tags
CREATE INDEX idx_faq_tags ON faq_knowledge_base USING gin(tags);

-- Índices simples
CREATE INDEX idx_faq_prioridade ON faq_knowledge_base(prioridade);
CREATE INDEX idx_faq_idioma ON faq_knowledge_base(idioma);
```

## 4. Configurar RLS (Row Level Security)

```sql
ALTER TABLE faq_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "FAQ público para leitura"
  ON faq_knowledge_base FOR SELECT
  USING (true);

-- Política: Apenas service_role pode escrever
CREATE POLICY "Apenas service_role pode escrever"
  ON faq_knowledge_base FOR ALL
  USING (auth.role() = 'service_role');
```

## 5. Criar Função de Busca Semântica

```sql
CREATE OR REPLACE FUNCTION match_faq(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  pergunta text,
  resposta text,
  fonte_url text,
  fonte_titulo text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faq_knowledge_base.id,
    faq_knowledge_base.pergunta,
    faq_knowledge_base.resposta,
    faq_knowledge_base.fonte_url,
    faq_knowledge_base.fonte_titulo,
    faq_knowledge_base.tags,
    1 - (faq_knowledge_base.embedding <=> query_embedding) AS similarity
  FROM faq_knowledge_base
  WHERE 1 - (faq_knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY faq_knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## 6. Adicionar Comentários

```sql
COMMENT ON TABLE faq_knowledge_base IS 'Knowledge base de FAQs HVAC-R com busca vetorial';
COMMENT ON COLUMN faq_knowledge_base.embedding IS 'Vetor de 1536 dimensões (OpenAI text-embedding-3-small)';
COMMENT ON FUNCTION match_faq IS 'Busca semântica de FAQs por similaridade de embedding (cosine distance)';
```

---

## Resumo do que será criado:

1. ✅ Extensão `vector` (pgvector)
2. ✅ Tabela `faq_knowledge_base` com:
   - Campos de FAQ (pergunta, resposta)
   - Metadados (fonte, tags, idioma, prioridade)
   - Embedding vetorial (1536 dimensões)
   - Full-text search automático
3. ✅ 5 índices otimizados
4. ✅ RLS habilitado (leitura pública, escrita service_role)
5. ✅ Função `match_faq()` para busca semântica

---

## Como usar depois:

### Buscar FAQs similares:
```sql
SELECT * FROM match_faq(
  '[vetor_embedding_da_pergunta]'::vector(1536),
  0.7,  -- threshold de similaridade
  5     -- top 5 resultados
);
```

### Inserir FAQ:
```sql
INSERT INTO faq_knowledge_base (
  pergunta,
  resposta,
  fonte_tipo,
  fonte_canal,
  fonte_url,
  tags,
  embedding
) VALUES (
  'Como diagnosticar erro E1?',
  'Passo a passo...',
  'youtube',
  'RODRIGO MEN VRF',
  'https://youtube.com/watch?v=xxx',
  ARRAY['erro-E1', 'diagnostico'],
  '[vetor_de_1536_dimensoes]'::vector(1536)
);
```
