export const RAG_CONFIG = {
    embedding: {
        model: 'text-embedding-3-small',
        dimensions: 1536
    },
    retrieval: {
        matchThreshold: Number(process.env.RAG_MATCH_THRESHOLD || 0.72),
        matchCount: Number(process.env.RAG_MATCH_COUNT || 10),
        distanceOp: String(process.env.RAG_DISTANCE_OP || 'cosine'),
        indexType: String(process.env.RAG_INDEX_TYPE || 'ivfflat'),
        lists: Number(process.env.RAG_LISTS || 100),
        probes: Number(process.env.RAG_PROBES || 10)
    },
    cache: {
        ttlSeconds: Number(process.env.CACHE_TTL_SECONDS || 900)
    }
} as const;
