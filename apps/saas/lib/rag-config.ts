export const RAG_CONFIG = {
    embedding: {
        model: 'text-embedding-3-small',
        dimensions: 1536
    },
    retrieval: {
        matchThreshold: 0.65,
        matchCount: 5
    }
} as const;
