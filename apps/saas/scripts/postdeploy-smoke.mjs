const base = process.env.BASE_URL || 'http://localhost:3001'
const sleep = (ms) => new Promise(res => setTimeout(res, ms))
const fetchJson = async (url) => {
  try { const r = await fetch(url); const t = await r.text(); return { status: r.status, len: t.length } } catch { return { status: 0, len: 0 } }
}
const main = async () => {
  const targets = [
    '/',
    '/api/search/professors',
    '/api/openai/chat',
    '/api/openai/transcribe',
    '/api/openai/tts',
    '/api/checkout'
  ]
  const out = []
  for (const path of targets) {
    const url = `${base}${path}`
    const r = await fetchJson(url)
    out.push({ path, status: r.status, len: r.len })
    await sleep(100)
  }
  console.log(JSON.stringify({ base, results: out }, null, 2))
}
main()
