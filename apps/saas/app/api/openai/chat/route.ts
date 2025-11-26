import { record } from '../../../../lib/monitor'
import { rateLimit } from '../../../../lib/rate-limit'
import { validateEnv } from '../../../../lib/env-validator'
import { logger } from '../../../../lib/logger'
import { RAG_CONFIG } from '../../../../lib/rag-config'
import { fetchWithRetry } from '../../../../lib/fetch-retry'
import { validateTutorialResponse } from '../../../../lib/response-validator'

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

export async function POST(req: Request) {
  try {
    validateEnv();
  } catch (e: any) {
    logger.error('env_validation', e);
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return new Response('forbidden', { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  // Rate limiting: 20 mensagens por minuto
  const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anonymous'
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

  const model = contentParts.some(p => p.type !== 'input_text') ? 'gpt-4o' : 'gpt-4o-mini'

  // Vector DB Search
  let grounding: { title: string; uri: string; content?: string }[] = []
  if (text && text.trim().length > 0) {
    try {
      const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      if (supaUrl && supaKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supa = createClient(supaUrl, supaKey)

        const embedding = await embedQuery(text, apiKey)
        const { data: results, error } = await supa.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: RAG_CONFIG.retrieval.matchThreshold,
          match_count: RAG_CONFIG.retrieval.matchCount
        })

        if (error) throw error;

        if (results && Array.isArray(results)) {
          grounding = results.map((r: any) => ({
            title: r.title || 'Documento',
            uri: r.url || r.uri || '',
            content: r.content || ''
          }))
        }
      }
    } catch (e) {
      logger.error('vector_db_search', e as Error, { query: text.slice(0, 100) });
    }
  }

  const instruction = grounding.length > 0
    ? `${SYSTEM_PROMPT}\n\nCONTEXTO DO BANCO DE DADOS:\n${grounding.map(g => `FONTE: ${g.title} (${g.uri})\nCONTEÚDO: ${g.content}`).join('\n\n')}`
    : SYSTEM_PROMPT

  const userContent = contentParts.map(p => {
    if (p.type === 'input_text') return { type: 'text', text: p.text }
    if (p.type === 'input_image') return { type: 'image_url', image_url: { url: p.image_url } }
    return null
  }).filter(Boolean)

  const body = {
    model,
    messages: [
      { role: 'system', content: instruction },
      { role: 'user', content: userContent }
    ]
  }

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
    logger.error('openai_api', e, { model, userId, promptLength: text.length });
  }

  const dur = Date.now() - t0
  const payload = { text: textOut || 'Não consegui gerar uma resposta técnica no momento.', groundingUrls: grounding.map(g => ({ title: g.title, uri: g.uri })) }
  const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
  if (dur > 2000 && process.env.NODE_ENV !== 'production') logger.warn('slow_route', 'Route took too long', { route: '/api/openai/chat', dur, err: errMsg ? true : false })
  record('/api/openai/chat', dur, statusCode)
  return new Response(JSON.stringify(payload), { status: statusCode, headers })
}
