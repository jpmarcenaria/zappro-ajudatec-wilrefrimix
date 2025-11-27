export const RAG_CONFIG = {
    embedding: {
        model: 'text-embedding-3-small',
        dimensions: 1536
    },
    retrieval: {
        matchThreshold: 0.72,
        matchCount: 10
    }
} as const;
