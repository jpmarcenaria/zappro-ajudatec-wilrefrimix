# 🔥 Melhores Práticas - Firecrawl + Tavily

## 📊 Limites e Custos

### Firecrawl
- **Plano Starter**: $20/mês
- **Limite**: 1000 scrapes/mês
- **Rate Limit**: ~10 requests/minuto
- **Custo por scrape**: $0.02

### Tavily
- **Plano Starter**: $8/mês
- **Limite**: 1000 searches/mês
- **Rate Limit**: ~60 requests/minuto
- **Custo por search**: $0.008

---

## ✅ Melhores Práticas Firecrawl

### 1. Rate Limiting
```typescript
// Sempre adicionar delay entre requests
for (const video of videos) {
  await processVideo(video);
  await new Promise(r => setTimeout(r, 2000)); // 2s delay
}
```

### 2. Retry com Backoff Exponencial
```typescript
async function firecrawlWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await firecrawl.scrape({ url });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 3. Filtrar Vídeos por Duração
```typescript
// Ignorar vídeos muito curtos (< 5 min)
const MIN_DURATION_SECONDS = 300;

if (video.metadata?.duration < MIN_DURATION_SECONDS) {
  console.log('Vídeo muito curto, pulando...');
  continue;
}
```

### 4. Cache de Transcrições
```typescript
// Salvar transcrições para não re-scrape
const cacheKey = `transcript:${videoId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const transcript = await firecrawl.scrape({ url });
await redis.set(cacheKey, JSON.stringify(transcript), 'EX', 86400); // 24h
```

### 5. Monitorar Uso
```typescript
// Logar uso para não exceder limite
console.log(`[Firecrawl] Scrapes este mês: ${scrapesCount}/1000`);

if (scrapesCount > 900) {
  console.warn('[Firecrawl] Próximo do limite mensal!');
}
```

---

## ✅ Melhores Práticas Tavily

### 1. Queries Específicas
```typescript
// ❌ Ruim: query genérica
query: "erro E1"

// ✅ Bom: query específica com domínios
query: "erro E1 Midea inverter site:daikin.com.br OR site:midea.com.br"
```

### 2. Usar `search_depth: 'advanced'`
```typescript
const response = await fetch('https://api.tavily.com/search', {
  body: JSON.stringify({
    query: 'VRF troubleshooting',
    search_depth: 'advanced', // Mais resultados relevantes
    max_results: 3,
    include_domains: ['daikin.com.br', 'midea.com.br', 'lg.com']
  })
});
```

### 3. Filtrar Resultados por Relevância
```typescript
const results = data.results
  .filter(r => r.score > 0.7) // Apenas alta relevância
  .slice(0, 3); // Top 3
```

### 4. Batch Processing
```typescript
// Processar em lotes de 10 para não estourar rate limit
const batches = chunk(faqs, 10);

for (const batch of batches) {
  await Promise.all(batch.map(faq => enrichWithTavily(faq)));
  await new Promise(r => setTimeout(r, 1000)); // 1s entre batches
}
```

### 5. Fallback para Brave Search
```typescript
// Se Tavily falhar, usar Brave como backup
try {
  return await tavilySearch(query);
} catch (error) {
  console.warn('[Tavily] Falhou, usando Brave...');
  return await braveSearch(query);
}
```

---

## 🎯 Estratégia de Crawling Otimizada

### 1. Priorizar Canais por ROI
```typescript
const canais = [
  { handle: '@RodrigoMenVRF', prioridade: 1, limit: 10 }, // Top canal
  { handle: '@AndreSilvaVRF', prioridade: 2, limit: 5 },
  { handle: '@DescomplicandoClimatizacao', prioridade: 3, limit: 3 }
];

// Crawl mais vídeos dos canais prioritários
```

### 2. Crawling Incremental
```typescript
// Apenas vídeos novos (últimos 7 dias)
const lastCrawl = await getLastCrawlDate();
const videos = await searchVideos({
  publishedAfter: lastCrawl,
  maxResults: 10
});
```

### 3. Horários de Baixo Custo
```typescript
// Rodar às 3h da madrugada (menos concorrência)
// Configurar em vercel.json:
{
  "crons": [{
    "path": "/api/cron/crawl-faqs",
    "schedule": "0 3 * * *" // 3h UTC (0h BRT)
  }]
}
```

### 4. Monitoramento de Custos
```typescript
// Calcular custo estimado antes de crawl
const estimatedCost = (videosCount * 0.02) + (enrichCount * 0.008);

if (estimatedCost > 5) { // Limite de $5/dia
  console.warn(`Custo estimado muito alto: $${estimatedCost}`);
  return;
}
```

---

## 📈 Métricas Recomendadas

### Firecrawl
- Scrapes/dia: ~30 (900/mês)
- Custo/dia: ~$0.60
- Taxa de sucesso: > 80%

### Tavily
- Searches/dia: ~30 (900/mês)
- Custo/dia: ~$0.24
- Taxa de sucesso: > 90%

### Total
- **Custo diário**: ~$0.84
- **Custo mensal**: ~$25
- **FAQs geradas/mês**: ~150-200

---

## 🚨 Alertas e Monitoramento

### 1. Webhook para Erros
```typescript
if (failedCount > 5) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `⚠️ Crawling falhou ${failedCount} vezes!`
    })
  });
}
```

### 2. Dashboard de Métricas
```typescript
// Salvar métricas no Supabase
await supabase.from('crawl_metrics').insert({
  date: new Date(),
  firecrawl_scrapes: scrapesCount,
  tavily_searches: searchesCount,
  faqs_created: faqsCount,
  cost_usd: totalCost
});
```

### 3. Limite de Segurança
```typescript
// Nunca exceder 50 scrapes/dia
const MAX_DAILY_SCRAPES = 50;

if (scrapesCount >= MAX_DAILY_SCRAPES) {
  console.log('[LIMIT] Limite diário atingido, parando...');
  return;
}
```

---

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas (`FIRECRAWL_API_KEY`, `TAVILY_API_KEY`)
- [ ] `CRON_SECRET` gerado e configurado
- [ ] `vercel.json` com cron configurado
- [ ] Rate limiting implementado (2s Firecrawl, 1s Tavily)
- [ ] Retry com backoff exponencial
- [ ] Monitoramento de custos ativo
- [ ] Alertas configurados
- [ ] Limite diário de segurança (50 scrapes)

**Pronto para rodar em produção!** 🚀
