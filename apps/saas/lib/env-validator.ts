const requiredEnvVars = ['OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

export function validateEnv(): void {
    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing env vars:\n${missing.join('\n')}`);
    }

    if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
        throw new Error('Invalid OPENAI_API_KEY format');
    }
}
