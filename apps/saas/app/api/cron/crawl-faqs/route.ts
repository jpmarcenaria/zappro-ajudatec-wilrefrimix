export const config = {
    runtime: 'edge',
};

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const startTime = Date.now();
    const results = {
        youtube: { success: 0, failed: 0 },
        enrichment: { success: 0, failed: 0 },
        deduplication: { removed: 0 }
    };

    try {
        // 1. Crawl YouTube (Top 10 vídeos por canal)
        console.log('[CRON] Iniciando crawling YouTube...');
        const youtubeResult = await crawlYouTubeTop10();
        results.youtube = youtubeResult;

        // 2. Enriquecer com Tavily
        console.log('[CRON] Enriquecendo FAQs com Tavily...');
        const enrichResult = await enrichWithTavily();
        results.enrichment = enrichResult;

        // 3. Remover duplicados
        console.log('[CRON] Removendo duplicados...');
        const dedupResult = await deduplicateFAQs();
        results.deduplication = dedupResult;

        const duration = Date.now() - startTime;

        return new Response(JSON.stringify({
            success: true,
            duration_ms: duration,
            results
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[CRON] Erro:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Crawl YouTube Top 10
import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';

// ... (dentro da função)
// ... (dentro da função)
async function crawlYouTubeTop10() {
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const canais = [
        { handle: '@RodrigoMenVRF', tags: ['VRF', 'inverter', 'Daikin'] },
        { handle: '@AndreSilvaVRF', tags: ['VRV', 'placa-inverter'] },
        { handle: '@DescomplicandoClimatizacao', tags: ['VRF', 'educacional'] }
    ];

    let success = 0;
    let failed = 0;

    for (const canal of canais) {
        try {
            // Buscar top 10 vídeos recentes
            const searchResult = await firecrawl.search(
                `site:youtube.com/@${canal.handle} ${canal.tags.join(' OR ')}`,
                {
                    limit: 10,
                    scrapeOptions: { formats: ['markdown'] }
                }
            ) as any;

            for (const item of searchResult.data || []) {
                const video = item as any;
                if (!video.url) continue;

                try {
                    // Extrair transcrição
                    const transcript = await firecrawl.scrape(video.url, {
                        formats: ['markdown'],
                        // @ts-ignore
                        includeYouTubeTranscript: true
                    }) as any;

                    if (!transcript.markdown) continue;

                    // Extrair FAQs com OpenAI
                    const faqs = await extractFAQsWithOpenAI(transcript.markdown, video.metadata);

                    // Salvar no Supabase
                    for (const faq of faqs) {
                        const embedding = await generateEmbedding(`${faq.pergunta} ${faq.resposta}`);

                        await supabase.from('faq_knowledge_base').insert({
                            pergunta: faq.pergunta,
                            resposta: faq.resposta,
                            fonte_tipo: 'youtube',
                            fonte_canal: canal.handle,
                            fonte_url: video.url,
                            fonte_titulo: video.metadata?.title,
                            tags: faq.tags,
                            embedding,
                            idioma: 'pt-BR',
                            prioridade: 1
                        });
                    }

                    success++;
                } catch (err) {
                    failed++;
                    console.error(`Erro no vídeo ${video.url}:`, err);
                }

                // Rate limit: 2s entre vídeos
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (err) {
            failed++;
            console.error(`Erro no canal ${canal.handle}:`, err);
        }
    }

    return { success, failed };
}

// Enriquecer com Tavily
async function enrichWithTavily() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: faqs } = await supabase
        .from('faq_knowledge_base')
        .select('*')
        .is('referencias_validadas', null)
        .limit(10);

    let success = 0;
    let failed = 0;

    for (const faq of faqs || []) {
        try {
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
                },
                body: JSON.stringify({
                    query: `${faq.pergunta} site:daikin.com.br OR site:midea.com.br`,
                    search_depth: 'advanced',
                    max_results: 3
                })
            });

            const data = await response.json();
            const referencias = data.results?.map((r: any) => ({
                titulo: r.title,
                url: r.url,
                snippet: r.content?.slice(0, 200)
            })) || [];

            await supabase
                .from('faq_knowledge_base')
                .update({ referencias_validadas: referencias })
                .eq('id', faq.id);

            success++;
        } catch (err) {
            failed++;
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    return { success, failed };
}

// Remover duplicados
async function deduplicateFAQs() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: faqs } = await supabase
        .from('faq_knowledge_base')
        .select('*')
        .order('prioridade', { ascending: true });

    const toDelete = [];
    const seen = new Set();

    for (let i = 0; i < (faqs?.length || 0); i++) {
        const faq1 = faqs![i];
        if (seen.has(faq1.id)) continue;

        for (let j = i + 1; j < (faqs?.length || 0); j++) {
            const faq2 = faqs![j];
            if (seen.has(faq2.id)) continue;

            const similarity = cosineSimilarity(faq1.embedding, faq2.embedding);
            if (similarity > 0.95) {
                toDelete.push(faq2.id);
                seen.add(faq2.id);
            }
        }
    }

    if (toDelete.length > 0) {
        await supabase.from('faq_knowledge_base').delete().in('id', toDelete);
    }

    return { removed: toDelete.length };
}

// Helpers
async function extractFAQsWithOpenAI(transcript: string, metadata: any) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'system',
                content: 'Extraia 3-5 FAQs técnicas deste vídeo HVAC-R. Formato JSON: {"faqs":[{"pergunta":"...","resposta":"...","tags":["..."]}]}'
            }, {
                role: 'user',
                content: `Vídeo: ${metadata?.title}\n\n${transcript.slice(0, 8000)}`
            }],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).faqs || [];
}

async function generateEmbedding(text: string) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text
        })
    });

    const data = await response.json();
    return data.data[0].embedding;
}

function cosineSimilarity(vec1: number[], vec2: number[]) {
    let dot = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
        dot += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
