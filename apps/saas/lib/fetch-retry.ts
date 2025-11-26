export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const timeout = 15000 * Math.pow(2, attempt);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);

            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);

            if (res.status === 429) {
                const retryAfter = parseInt(res.headers.get('retry-after') || '5');
                await new Promise(r => setTimeout(r, retryAfter * 1000));
                continue;
            }

            if (res.ok) return res;

            if (res.status >= 500 && attempt < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                continue;
            }

            return res;
        } catch (err) {
            if (attempt === maxRetries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
    }
    throw new Error('Max retries exceeded');
}
