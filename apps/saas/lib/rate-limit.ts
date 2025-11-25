// Rate limiting simples em memória
// Para produção com múltiplas instâncias, considerar Redis

const rateLimitMap = new Map<string, { count: number; reset: number }>();

export function rateLimit(identifier: string, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    // Se não existe registro ou a janela expirou, criar novo
    if (!record || now > record.reset) {
        rateLimitMap.set(identifier, { count: 1, reset: now + windowMs });
        return { success: true, remaining: limit - 1, reset: now + windowMs };
    }

    // Incrementar contador
    record.count++;

    return {
        success: record.count <= limit,
        remaining: Math.max(0, limit - record.count),
        reset: record.reset
    };
}

// Limpar registros expirados periodicamente (evitar memory leak)
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.reset) {
            rateLimitMap.delete(key);
        }
    }
}, 60000); // Limpar a cada 1 minuto
