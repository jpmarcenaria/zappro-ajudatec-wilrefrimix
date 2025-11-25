import { test, expect } from '@playwright/test';

test.describe('Health Check Endpoint', () => {
    test('should return 200 and valid JSON', async ({ request }) => {
        const response = await request.get('/api/health');

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('uptime');
        expect(data).toHaveProperty('env');
        expect(data).toHaveProperty('services');
    });

    test('should check all services', async ({ request }) => {
        const response = await request.get('/api/health');
        const data = await response.json();

        expect(data.services).toHaveProperty('supabase');
        expect(data.services).toHaveProperty('openai');
        expect(data.services).toHaveProperty('stripe');

        // Verificar que cada serviço tem status
        expect(data.services.supabase).toHaveProperty('status');
        expect(data.services.openai).toHaveProperty('status');
        expect(data.services.stripe).toHaveProperty('status');
    });

    test('should return correct environment', async ({ request }) => {
        const response = await request.get('/api/health');
        const data = await response.json();

        expect(['development', 'production', 'test']).toContain(data.env);
    });
});

test.describe('Rate Limiting', () => {
    test('should allow requests under limit', async ({ request }) => {
        // Fazer 5 requests (abaixo do limite de 20)
        for (let i = 0; i < 5; i++) {
            const response = await request.post('/api/openai/chat', {
                data: {
                    text: `Test message ${i}`,
                    attachments: [],
                    useSearch: false
                }
            });

            // Não deve retornar 429
            expect(response.status()).not.toBe(429);
        }
    });

    test('should return 429 after exceeding limit', async ({ request }) => {
        // Fazer 25 requests rapidamente (acima do limite de 20)
        const responses = [];

        for (let i = 0; i < 25; i++) {
            const response = await request.post('/api/openai/chat', {
                data: {
                    text: `Spam message ${i}`,
                    attachments: [],
                    useSearch: false
                }
            });
            responses.push(response);
        }

        // Pelo menos uma resposta deve ser 429
        const rateLimited = responses.some(r => r.status() === 429);
        expect(rateLimited).toBe(true);
    });

    test('should include rate limit headers on 429', async ({ request }) => {
        // Forçar rate limit
        const responses = [];
        for (let i = 0; i < 25; i++) {
            responses.push(await request.post('/api/openai/chat', {
                data: { text: `Test ${i}`, attachments: [] }
            }));
        }

        const rateLimitedResponse = responses.find(r => r.status() === 429);

        if (rateLimitedResponse) {
            const headers = rateLimitedResponse.headers();
            expect(headers).toHaveProperty('x-ratelimit-remaining');
            expect(headers).toHaveProperty('x-ratelimit-reset');
        }
    });
});

test.describe('Configuration Files', () => {
    test('youtube-sources.json should be valid', async () => {
        const fs = await import('fs');
        const path = await import('path');

        const configPath = path.join(process.cwd(), 'config', 'youtube-sources.json');
        expect(fs.existsSync(configPath)).toBe(true);

        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        expect(config).toHaveProperty('canais_brasil');
        expect(config).toHaveProperty('canais_mundial');
        expect(config).toHaveProperty('configuracao');

        expect(Array.isArray(config.canais_brasil)).toBe(true);
        expect(config.canais_brasil.length).toBeGreaterThan(0);
    });

    test('.env.example should exist', async () => {
        const fs = await import('fs');
        const path = await import('path');

        const envExamplePath = path.join(process.cwd(), '../../.env.example');
        expect(fs.existsSync(envExamplePath)).toBe(true);
    });
});
