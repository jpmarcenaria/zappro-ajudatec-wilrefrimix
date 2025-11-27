import { fetchWithRetry } from './fetch-retry'

type SearchResult = { title: string; url: string; score?: number }

export async function searchTavily(q: string, apiKey?: string): Promise<SearchResult[]> {
  if (!apiKey) return []
  try {
    const res = await fetchWithRetry('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ query: q, max_results: 10, include_domains: [], include_answer: false })
    }, 2)
    if (!res.ok) return []
    const data: any = await res.json()
    const results = Array.isArray(data?.results) ? data.results : []
    return results.map((r: any) => ({ title: r.title || '', url: r.url || '', score: r.score || undefined }))
  } catch { return [] }
}

export async function searchBrave(q: string, apiKey?: string): Promise<SearchResult[]> {
  if (!apiKey) return []
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`
    const res = await fetchWithRetry(url, { method: 'GET', headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey } }, 2)
    if (!res.ok) return []
    const data: any = await res.json()
    const web = Array.isArray(data?.web?.results) ? data.web.results : []
    return web.map((r: any) => ({ title: r.title || '', url: r.url || '', score: r.languageScore || undefined }))
  } catch { return [] }
}

export async function crawlFirecrawl(url: string, apiKey?: string): Promise<string[]> {
  if (!apiKey) return []
  try {
    const mod: any = await import('@mendable/firecrawl-js')
    const app = new mod.FirecrawlApp({ apiKey })
    const resp: any = await app.extractUrls({ url })
    const links: string[] = Array.isArray(resp?.urls) ? resp.urls : []
    return links
  } catch { return [] }
}

export async function aggregateSearch(q: string): Promise<SearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY || ''
  const braveKey = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY || ''
  const firecrawlKey = process.env.FIRECRAWL_API_KEY || ''
  const results: SearchResult[] = []
  const base = [
    ...(await searchTavily(q, tavilyKey)),
    ...(await searchBrave(q, braveKey))
  ]
  results.push(...base)
  // Crawl first 3 manufacturer pages from base results
  for (const r of base.slice(0, 3)) {
    if (!/\.(pdf)$/i.test(r.url)) {
      const urls = await crawlFirecrawl(r.url, firecrawlKey)
      for (const u of urls) {
        if (/\.(pdf)$/i.test(u)) results.push({ title: 'PDF', url: u })
      }
    }
  }
  // Deduplicate by URL
  const seen = new Set<string>()
  const out: SearchResult[] = []
  for (const r of results) {
    const key = r.url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}
