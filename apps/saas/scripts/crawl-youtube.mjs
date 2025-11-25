#!/usr/bin/env node
/**
 * Script de Crawling YouTube com Firecrawl
 * Extrai transcrições e gera FAQs com OpenAI
 */

import Firecrawl from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar clientes
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Carregar configuração
const configPath = path.join(__dirname, '../config/youtube-sources.json');
const sources = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function crawlYouTubeChannel(canal) {
    console.log(`\n🔥 Crawling: ${canal.nome} (Prioridade: ${canal.prioridade})`);

    try {
        // Buscar vídeos do canal usando Firecrawl search
        const searchQuery = `site:youtube.com/@${canal.handle} ${canal.tags.slice(0, 3).join(' OR ')}`;

        console.log(`   Buscando: ${searchQuery}`);

        const searchResult = await firecrawl.search({
            query: searchQuery,
            limit: sources.configuracao.max_videos_por_canal,
            scrapeOptions: {
                formats: ['markdown'],
                onlyMainContent: true
            }
        });

        if (!searchResult.web || searchResult.web.length === 0) {
            console.log(`   ⚠️ Nenhum vídeo encontrado`);
            return;
        }

        console.log(`   ✅ Encontrados ${searchResult.web.length} vídeos`);

        for (const video of searchResult.web) {
            await processVideo(video, canal);
            // Rate limit: aguardar 2s entre vídeos
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error(`   ❌ Erro no canal ${canal.nome}:`, error.message);
    }
}

async function processVideo(video, canal) {
    const videoId = extractVideoId(video.url);
    if (!videoId) {
        console.log(`   ⚠️ ID inválido: ${video.url}`);
        return;
    }

    console.log(`\n   📹 Processando: ${video.metadata?.title || videoId}`);

    try {
        // Extrair transcrição com Firecrawl
        const transcript = await firecrawl.scrape({
            url: video.url,
            formats: ['markdown'],
            includeYouTubeTranscript: true
        });

        if (!transcript.markdown || transcript.markdown.length < 100) {
            console.log(`      ⚠️ Sem transcrição disponível`);
            return;
        }

        console.log(`      ✅ Transcrição extraída (${transcript.markdown.length} chars)`);

        // Extrair FAQs com OpenAI
        const faqs = await extractFAQsWithOpenAI(transcript.markdown, video.metadata);

        if (!faqs || faqs.length === 0) {
            console.log(`      ⚠️ Nenhuma FAQ extraída`);
            return;
        }

        console.log(`      ✅ ${faqs.length} FAQs extraídas`);

        // Salvar FAQs no banco
        for (const faq of faqs) {
            await saveFAQToDatabase(faq, canal, video.metadata);
        }

    } catch (error) {
        console.error(`      ❌ Erro ao processar vídeo:`, error.message);
    }
}

async function extractFAQsWithOpenAI(transcript, metadata) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Você é um especialista em HVAC-R. Extraia as top 3-5 perguntas técnicas respondidas neste vídeo.

Formato de saída (JSON):
{
  "faqs": [
    {
      "pergunta": "Como diagnosticar erro E1 em Midea inverter?",
      "resposta": "Resposta detalhada com passo a passo...",
      "timestamp": "00:03:45",
      "tags": ["erro-E1", "Midea", "inverter", "diagnostico"]
    }
  ]
}

IMPORTANTE: Respostas devem ser práticas, diretas e em português Brasil.`
                },
                {
                    role: 'user',
                    content: `Vídeo: ${metadata?.title || 'Sem título'}\n\nTranscrição:\n${transcript.slice(0, 8000)}`
                }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result.faqs || [];
}

async function saveFAQToDatabase(faq, canal, videoMetadata) {
    try {
        // Gerar embedding
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: `${faq.pergunta} ${faq.resposta}`
            })
        });

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Inserir no Supabase
        const { error } = await supabase.from('faq_knowledge_base').insert({
            pergunta: faq.pergunta,
            resposta: faq.resposta,
            fonte_tipo: 'youtube',
            fonte_canal: canal.nome,
            fonte_url: videoMetadata?.url || '',
            fonte_titulo: videoMetadata?.title || '',
            timestamp: faq.timestamp || null,
            tags: faq.tags || [],
            idioma: canal.idioma,
            embedding: embedding,
            prioridade: canal.prioridade,
            criado_em: new Date().toISOString()
        });

        if (error) {
            console.error(`         ❌ Erro ao salvar FAQ:`, error.message);
        } else {
            console.log(`         ✅ FAQ salva: ${faq.pergunta.slice(0, 50)}...`);
        }
    } catch (error) {
        console.error(`         ❌ Erro ao processar FAQ:`, error.message);
    }
}

function extractVideoId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
    return match ? match[1] : null;
}

// Executar crawling
async function main() {
    console.log('🚀 Iniciando crawling YouTube HVAC-R...\n');
    console.log(`📊 Configuração:`);
    console.log(`   - Canais Brasil: ${sources.canais_brasil.length}`);
    console.log(`   - Canais Mundial: ${sources.canais_mundial.length}`);
    console.log(`   - Max vídeos/canal: ${sources.configuracao.max_videos_por_canal}`);
    console.log(`   - Max FAQs/vídeo: ${sources.configuracao.max_faqs_por_video}\n`);

    // Crawl canais Brasil (prioridade)
    for (const canal of sources.canais_brasil) {
        await crawlYouTubeChannel(canal);
    }

    // Crawl canais mundial (se configurado)
    if (process.env.CRAWL_MUNDIAL === 'true') {
        console.log('\n🌍 Crawling canais mundiais...\n');
        for (const canal of sources.canais_mundial) {
            await crawlYouTubeChannel(canal);
        }
    }

    console.log('\n✅ Crawling completo!');
}

main().catch(console.error);
