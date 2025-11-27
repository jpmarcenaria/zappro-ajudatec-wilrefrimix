import { record } from '../../../../lib/monitor'
import { rateLimit } from '../../../../lib/rate-limit'
import { validateEnv } from '../../../../lib/env-validator'
import { logger } from '../../../../lib/logger'
import { RAG_CONFIG } from '../../../../lib/rag-config'
import { fetchWithRetry } from '../../../../lib/fetch-retry'
import { validateTutorialResponse } from '../../../../lib/response-validator'

// HVAC-R Query Parsers
function extractBrand(query: string): string | null {
  const brands = ['daikin', 'midea', 'gree', 'springer', 'lg', 'samsung', 'elgin', 'consul', 'carrier', 'fujitsu'];
  const lower = query.toLowerCase();
  for (const brand of brands) {
    if (lower.includes(brand)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }
  return null;
}

function extractModel(query: string): string | null {
  // Pattern: letters + numbers (e.g., VRV5, Elite12, G-Tech)
  const match = query.match(/([A-Z]{2,}[-\s]?[A-Z0-9]+)/i);
  return match ? match[0] : null;
}

function extractErrorCode(query: string): string | null {
  // Pattern: U4, E1, F0, etc
  const match = query.match(/\b([A-Z]\d{1,2})\b/i);
  return match ? match[1].toUpperCase() : null;
}

// Helper: build direct manual link or model-specific search
function getDirectManualLink(brand: string, model: string): string {
  const brandLower = (brand || '').toLowerCase();
  const modelClean = (model || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const baseLinks: Record<string, string> = {
    daikin: 'https://www.daikin.com.br/catalogo-de-manuais',
    midea: 'https://www.midea.com.br/suporte-tecnico/manuais',
    springer: 'https://www.carrierdobrasil.com.br/springer/suporte-tecnico',
    gree: 'https://www.gree.ind.br/downloads',
    lg: 'https://www.lg.com/br/suporte/pesquisa-manual',
    samsung: 'https://www.samsung.com/br/support/model/',
    elgin: 'https://www.elgin.com.br/ar-condicionado/manuais',
    consul: 'https://www.consul.com.br/suporte/manuais',
    electrolux: 'https://www.electrolux.com.br/suporte/manuais',
    philco: 'https://www.philco.com.br/suporte/manuais',
    fujitsu: 'https://www.fujitsu-general.com/br/products/split/download.html'
  };

  let link = baseLinks[brandLower] || `https://www.google.com/search?q=${encodeURIComponent(`${brand} ${model} manual PDF`)}`;

  if (model && modelClean) {
    if (brandLower === 'samsung') {
      link = `https://www.samsung.com/br/support/model/${modelClean}/`;
    } else if (brandLower === 'lg') {
      link = `https://www.lg.com/br/suporte/pesquisa-manual?search=${encodeURIComponent(model)}`;
    } else if (brandLower === 'daikin') {
      link = `https://www.daikin.com.br/catalogo-de-manuais?q=${encodeURIComponent(model)}`;
    }
  }

  return link;
}

const SYSTEM_PROMPT = `
You are ZapPRO Assistant, Brazilian HVAC-R specialist. CRITICAL RULES:

1. LANGUAGE: Portuguese BR only, technical field slang
2. DATE CONTEXT: Current date is November 26, 2025
3. RESPONSE FORMAT: Step-by-step test tutorials ONLY
4. ITERATION: Ask for ONE test result, send next tutorial
5. DATABASE FIRST: Use manuals in DB, NEVER ask user to check manual
6. LENGTH: Max 6 lines, WhatsApp style
7. GOAL: Find exact damaged peripheral/installation error

TUTORIAL STRUCTURE:
🔧 TUTORIAL #X - [TEST NAME]
1. [Objective step with tool]
2. [Action with expected value]
3. [Decision point]

📊 NORMAL VALUES: [specific range]
⚠️ IF [result X]: [next action]
⚡ SAFETY: [specific warning]

Next question: [ONE specific info needed]

PROHIBITED:
❌ "Check the manual"
❌ Long theory
❌ Generic answers
❌ Multiple questions at once
❌ Responses over 6 lines

KNOWLEDGE BASE (accessible in vector DB):
- Manuals: Daikin, Midea, Gree, Springer, LG, Samsung (Brazil market)
- VRF/VRV/Inverter error codes
- Sensor/pressure/resistance standard values
- Refrigerants: R32, R410A, R22 (Brazil 2025 context)

MANUFACTURER MANUAL DOWNLOAD PAGES (DIRECT):
- Daikin: https://www.daikin.com.br/catalogo-de-manuais
- Midea: https://www.midea.com.br/suporte-tecnico/manuais
- Springer: https://www.carrierdobrasil.com.br/springer/suporte-tecnico
- Gree: https://www.gree.ind.br/downloads
- LG: https://www.lg.com/br/suporte/pesquisa-manual
- Samsung: https://www.samsung.com/br/support/model/
- Elgin: https://www.elgin.com.br/ar-condicionado/manuais
- Consul: https://www.consul.com.br/suporte/manuais
- Electrolux: https://www.electrolux.com.br/suporte/manuais
- Philco: https://www.philco.com.br/suporte/manuais
- Fujitsu: https://www.fujitsu-general.com/br/products/split/download.html

WHEN PROVIDING MANUAL LINK TO USER:
- Always say "CLIQUE AQUI" or "BAIXE AQUI" before link
- Explain step: click → search model → download → upload to chat
- Offer to continue with generic field diagnosis meanwhile
- Ask if user already has manual or wants generic help
`;

export async function OPTIONS() {
  const origin = (() => { try { return new URL(process.env.NEXT_PUBLIC_WEBSITE_URL || '').origin } catch { return '' } })()
  return new Response(null, {
    status: 204,
    headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

type AttachmentPayload = { mimeType: string; data: string; name?: string }
type Body = { text: string; attachments: AttachmentPayload[]; useSearch?: boolean }
type ContentPart =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string }
  | { type: 'input_file'; file_data: string; filename?: string }

async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: query,
      model: RAG_CONFIG.embedding.model
    })
  })
  if (!res.ok) throw new Error('Failed to embed query')
  const data = await res.json()
  return data.data[0].embedding
}

async function classifyIntent(text: string, apiKey: string): Promise<{ label: string; confidence: number }> {
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Classifique intenção: error_code_diagnosis, wiring_diagram, sensor_values, installation_manual, generic. Responda JSON {label, confidence}.' },
      { role: 'user', content: text.slice(0, 4000) }
    ],
    max_tokens: 50,
    temperature: 0
  }
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) return { label: 'generic', confidence: 0 }
    const j = await r.json()
    const txt = j?.choices?.[0]?.message?.content || ''
    const m = txt.match(/\{\s*"label"\s*:\s*"([a-z_]+)"\s*,\s*"confidence"\s*:\s*(\d+(?:\.\d+)?)\s*\}/i)
    if (m) return { label: m[1], confidence: Number(m[2]) }
    return { label: 'generic', confidence: 0 }
  } catch { return { label: 'generic', confidence: 0 } }
}

export async function POST(req: Request) {

  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return new Response('forbidden', { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  // Rate limiting: 20 mensagens por minuto
  const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anonymous'
  const planHeader = req.headers.get('x-plan') || ''
  const trialMode = planHeader === 'trial' || userId === 'anonymous'
  const limiter = rateLimit(userId, 20, 60000)

  if (!limiter.success) {
    return new Response(
      JSON.stringify({ error: 'Muitas requisições. Aguarde 1 minuto.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': limiter.remaining.toString(),
          'X-RateLimit-Reset': new Date(limiter.reset).toISOString(),
          ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {})
        }
      }
    )
  }

  let parsed: Partial<Body> = {}
  try {
    parsed = await req.json()
  } catch { }
  const text = typeof parsed.text === 'string' ? parsed.text : ''
  const attachments = Array.isArray(parsed.attachments) ? parsed.attachments : []
  let setCookieHdr = ''
  if (trialMode) {
    const cookie = req.headers.get('cookie') || ''
    const match = /(?:^|;\s*)trial=([0-9-]+):(\d+)/.exec(cookie)
    const today = new Date().toISOString().slice(0, 10)
    let count = match ? parseInt(match[2], 10) : 0
    const date = match ? match[1] : ''
    if (date !== today) count = 0
    if (attachments.length > 0) {
      const headers: Record<string, string> = allowed ? { 'Access-Control-Allow-Origin': allowed } : {}
      return new Response(JSON.stringify({ text: 'Teste grátis sem anexos. Para liberar leitura de PDF, fotos e áudio: Assine ZapPro R$ 99,90/mês. Clique em Assinar na página inicial.', groundingUrls: [] }), { status: 200, headers })
    }
    if (count >= 3) {
      const headers: Record<string, string> = allowed ? { 'Access-Control-Allow-Origin': allowed } : {}
      return new Response(JSON.stringify({ text: 'Limite do teste atingido. Para diagnóstico completo passo-a-passo e anexos: Assine ZapPro R$ 99,90/mês.', groundingUrls: [] }), { status: 200, headers })
    }
    count += 1
    setCookieHdr = `trial=${today}:${count}; Path=/; SameSite=Lax`
  }

  try {
    validateEnv();
  } catch (e: any) {
    logger.error('env_validation', e);
    const headers: Record<string, string> = allowed ? { 'Access-Control-Allow-Origin': allowed } : {}
    if (setCookieHdr) headers['Set-Cookie'] = setCookieHdr
    return new Response(JSON.stringify({ text: 'Serviço em manutenção. No teste grátis você recebe respostas curtas. Para liberar tudo: Assine ZapPro R$ 99,90/mês.', groundingUrls: [] }), { status: 200, headers })
  }

  const apiKey = process.env.OPENAI_API_KEY! // Validated by validateEnv

  const contentParts: ContentPart[] = []
  if (text && typeof text === 'string' && text.trim().length > 0) {
    contentParts.push({ type: 'input_text', text })
  }

  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (!att || !att.mimeType || !att.data) continue
      const dataUrl = `data:${att.mimeType};base64,${att.data}`
      if (att.mimeType.startsWith('image/')) {
        contentParts.push({ type: 'input_image', image_url: dataUrl })
      } else if (att.mimeType === 'application/pdf') {
        contentParts.push({ type: 'input_file', file_data: dataUrl, filename: att.name || 'document.pdf' })
      }
    }
  }

  const llmModel = contentParts.some(p => p.type !== 'input_text') ? 'gpt-4o' : 'gpt-4o-mini'

  // HVAC-R Manual Search + Alarm Codes
  let grounding: { title: string; uri: string; content?: string }[] = []
  let alarmContext = ''
  let brandName: string | null = null
  let modelName: string | null = null
  let alarmCode: string | null = null

  if (text && text.trim().length > 0) {
    try {
      const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      if (supaUrl && supaKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supa = createClient(supaUrl, supaKey)

        // 1. Generate embedding for semantic search
        const embedding = await embedQuery(text, apiKey)

        const intent = await classifyIntent(text, apiKey)

        // 2. Extract context from query
        brandName = extractBrand(text)
        modelName = extractModel(text)
        alarmCode = extractErrorCode(text)

        // 3. Search manual chunks with filters
        const { data: chunks, error: chunksError } = await supa.rpc('match_manual_chunks', {
          query_embedding: embedding,
          filter_brand: brandName,
          filter_model: modelName,
          match_threshold: 0.72,
          match_count: 5
        })

        if (!chunksError && chunks && Array.isArray(chunks)) {
          grounding = chunks.map((c: any) => ({
            title: `${c.section || 'Manual'} - Página ${c.page || 'N/A'}`,
            uri: `manual://${brandName || 'unknown'}/${modelName || 'unknown'}/${c.manual_id}`,
            content: c.content || ''
          }))

          // Enhanced logging with performance metrics
          if (chunks.length > 0) {
            const avgSim = chunks.reduce((sum: number, c: any) => sum + (c.similarity || 0), 0) / chunks.length
            logger.info('hvacr_search', 'Context retrieved', {
              brand: brandName,
              model: modelName,
              errorCode: alarmCode,
              chunksFound: chunks.length,
              avgSimilarity: avgSim.toFixed(3),
              topChunkSection: chunks[0]?.section || 'unknown',
              topChunkSimilarity: (chunks[0]?.similarity || 0).toFixed(3),
              intent: intent.label,
              intentConfidence: intent.confidence
            })
          }
        } else if (chunksError) {
          logger.error('hvacr_search_chunks', chunksError as Error, { brand: brandName, model: modelName, errorCode: alarmCode })
        }

        // 4. Search alarm codes if error detected
        if (alarmCode) {
          const alarmQuery = supa
            .from('alarm_codes')
            .select(`
              code,
              title,
              severity,
              resolution,
              hvacr_devices!inner (brand, model)
            `)
            .eq('code', alarmCode)

          if (brandName) alarmQuery.eq('hvacr_devices.brand', brandName)

          const { data: alarms } = await alarmQuery.order('severity', { ascending: false }).limit(3)

          if (alarms && alarms.length > 0) {
            alarmContext = `\n\n📋 CÓDIGO DE ALARME ${alarmCode} IDENTIFICADO:\n` +
              alarms.map((a: any) => `
DISPOSITIVO: ${a.hvacr_devices.brand} ${a.hvacr_devices.model}
ERRO: ${a.title} (Severidade: ${a.severity}/10)
RESOLUÇÃO: ${a.resolution}
`).join('\n')
          }
        }

        if (grounding.length === 0 && !alarmContext) {
          logger.warn('hvacr_search', 'No context found in database', {
            brand: brandName,
            model: modelName,
            errorCode: alarmCode,
            queryLength: text.length,
            intent: intent.label
          })
        } else if (alarmContext) {
          // Log alarm context found
          logger.info('hvacr_search', 'Alarm code context found', {
            errorCode: alarmCode,
            brand: brandName,
            model: modelName,
            intent: intent.label
          })
        }

      }
    } catch (e) {
      logger.error('hvacr_search', e as Error, { query: text.slice(0, 100) })
    }
  }

  let instruction = grounding.length > 0 || alarmContext
    ? `${SYSTEM_PROMPT}
    
📚 CONTEXTO DOS MANUAIS TÉCNICOS:
${grounding.map(g => `FONTE: ${g.title} CONTEÚDO: ${g.content}`).join('\n')}
${alarmContext}
    
IMPORTANTE: Use EXCLUSIVAMENTE as informações dos manuais acima. Nunca invente valores ou procedimentos.`
    : SYSTEM_PROMPT

  if (grounding.length === 0 && !alarmContext) {
    const b = brandName || ''
    const m = modelName || ''
    const manualLink = getDirectManualLink(b, m)
    instruction += `\n\n⚠️ MANUAL NÃO INDEXADO: ${b} ${m}\n\n`;
    instruction += `INSTRUÇÃO PARA RESPOSTA:\n`;
    instruction += `1. Informe que manual não está no banco ainda\n`;
    instruction += `2. Forneça link DIRETO para download: ${manualLink}\n`;
    instruction += `3. Instrua: "Clique no link → Procure seu modelo → Baixe o PDF → Faça upload aqui"\n`;
    instruction += `4. Diga: "Enquanto isso, vou te dar diagnóstico genérico baseado em campo"\n`;
    instruction += `5. Forneça solução baseada no tipo de erro (se código identificado)\n\n`;
    instruction += `FORMATO DA RESPOSTA:\n`;
    instruction += `⚠️ Manual do ${b} ${m} não está indexado ainda.\n\n`;
    instruction += `📥 BAIXE AQUI (clique e procure seu modelo):\n`;
    instruction += `${manualLink}\n\n`;
    instruction += `📤 Depois arraste o PDF aqui que eu leio pra você\n\n`;
    instruction += `🔍 Enquanto isso, diagnóstico de campo para ${alarmCode ? 'erro ' + alarmCode : 'este caso'}:\n`;
    instruction += `[Seu diagnóstico genérico baseado em experiência]\n\n`;
    instruction += `Já baixou o manual ou quer que eu continue com diagnóstico genérico?`;
  }

  const userContent = contentParts.map(p => {
    if (p.type === 'input_text') return { type: 'text', text: p.text }
    if (p.type === 'input_image') return { type: 'image_url', image_url: { url: p.image_url } }
    return null
  }).filter(Boolean)

  const trialMax = parseInt(process.env.TRIAL_MAX_OUTPUT_TOKENS || '300', 10)
  const body: any = {
    model: llmModel,
    messages: [
      { role: 'system', content: instruction },
      { role: 'user', content: userContent }
    ]
  }
  if (trialMode) body.max_tokens = trialMax

  let textOut = ''
  let statusCode = 200
  let errMsg = ''
  try {
    const res = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      3
    );

    if (!res.ok) {
      errMsg = await res.text().catch(() => '')
      statusCode = 200
    } else {
      const raw = await res.json().catch(() => ({}))
      textOut = raw?.choices?.[0]?.message?.content || ''

      // VALIDATION
      const validation = validateTutorialResponse(textOut);
      if (!validation.valid) {
        logger.warn('[Validation Failed]', 'Response validation failed', { errors: validation.errors });
        textOut = validation.sanitized;
      }
    }
  } catch (e: any) {
    statusCode = 200
    textOut = `Erro: ${e.message || 'Erro desconhecido'}`
      logger.error('openai_api', e, { model: llmModel, userId, promptLength: text.length });
  }

  const dur = Date.now() - t0
  const payload = { text: textOut || 'Não consegui gerar uma resposta técnica no momento.', groundingUrls: grounding.map(g => ({ title: g.title, uri: g.uri })) }
  const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
  if (setCookieHdr) headers['Set-Cookie'] = setCookieHdr
  if (dur > 2000 && process.env.NODE_ENV !== 'production') logger.warn('slow_route', 'Route took too long', { route: '/api/openai/chat', dur, err: errMsg ? true : false })
  record('/api/openai/chat', dur, statusCode)
  return new Response(JSON.stringify(payload), { status: statusCode, headers })
}
