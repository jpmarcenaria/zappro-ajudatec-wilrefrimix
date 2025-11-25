# 🎯 Prompt para Agente Supabase - Habilitar pgvector

## Executar no SQL Editor do Supabase:

```sql
-- 1. Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verificar se foi habilitada
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. Testar criação de vetor
SELECT '[1,2,3]'::vector(3);
```

## ✅ Confirmação de Sucesso

Se o comando retornar sem erros, o pgvector está habilitado!

**Próximo passo**: Aplicar a migração `0003_faq_knowledge_base.sql` que já está pronta no projeto.

---

## 📋 Migração Completa (Copiar e Colar)

```sql
-- Tabela FAQ com vetorização
CREATE TABLE IF NOT EXISTS faq_knowledge_base (
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
  
  -- Vetorização (pgvector)
  embedding vector(1536),
  
  -- Auditoria
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ,
  
  -- Full-text search
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', pergunta || ' ' || resposta)
  ) STORED
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_faq_embedding ON faq_knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_faq_fts ON faq_knowledge_base USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_faq_tags ON faq_knowledge_base USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_faq_prioridade ON faq_knowledge_base(prioridade);
CREATE INDEX IF NOT EXISTS idx_faq_idioma ON faq_knowledge_base(idioma);

-- RLS
ALTER TABLE faq_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQ público para leitura"
  ON faq_knowledge_base FOR SELECT
  USING (true);

CREATE POLICY "Apenas service_role pode escrever"
  ON faq_knowledge_base FOR ALL
  USING (auth.role() = 'service_role');

-- Função de busca semântica
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

-- Comentários
COMMENT ON TABLE faq_knowledge_base IS 'Knowledge base de FAQs HVAC-R com busca vetorial';
COMMENT ON FUNCTION match_faq IS 'Busca semântica de FAQs por similaridade de embedding';
```

---

## 🧪 Testar Após Migração

```sql
-- 1. Verificar tabela criada
SELECT COUNT(*) FROM faq_knowledge_base;

-- 2. Testar função match_faq (com vetor dummy)
SELECT * FROM match_faq(
  array_fill(0.0, ARRAY[1536])::vector(1536),
  0.5,
  5
);
```

---

## ✅ Checklist de Validação

- [ ] Extensão `vector` habilitada
- [ ] Tabela `faq_knowledge_base` criada
- [ ] 5 índices criados
- [ ] RLS habilitado
- [ ] Função `match_faq()` criada
- [ ] Teste de query funcionando

**Tudo pronto para receber FAQs!** 🚀
