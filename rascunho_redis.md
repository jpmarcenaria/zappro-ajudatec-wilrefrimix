## 🌐 3. ENDPOINTS DE CONEXÃO

| Tipo | Endpoint |
|------|----------|
| **TCP Host** | upward-trout-29626.upstash.io |
| **TCP Port** | 6379 |
| **REST URL** | https://upward-trout-29626.upstash.io |
| **TLS/SSL** | ✅ Habilitado |
| **Protocolo** | rediss:// (TLS obrigatório) |

***

## 📡 4. TESTE DE CONECTIVIDADE

| Aspecto | Status | Detalhes |
|--------|--------|----------|
| **Conectividade** | ✅ OK | Servidor respondendo normalmente |
| **Tempo de Resposta** | 132 ms | Latência aceitável do Brasil |
| **TLS/SSL** | ✅ Habilitado | Conexões criptografadas |
| **Autenticação** | ✅ Configurável | Tokens válidos e funcionais |
| **Região** | ✅ Otimizada | São Paulo = menor latência para BR |

***

## 💾 5. COMO USAR EM SEU PROJETO

### **Node.js com ioredis**
```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Set cache com TTL de 900 segundos (15 minutos)
await redis.setex(
  `cache:test:${Date.now()}`,
  900,
  'ok'
);

// Get valor do cache
const value = await redis.get(`cache:test:${key}`);
```

### **Python com redis-py**
```python
import redis
import os

r = redis.from_url(os.getenv('REDIS_URL'), ssl_certfile_reqs='required')

# Set cache
r.setex(f"cache:test:{int(time.time())}", 900, 'ok')

# Get valor
value = r.get(f"cache:test:{key}")
```

### **Integração com Next.js/API Route**
```javascript
// /pages/api/cache-test.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const timestamp = Date.now();
  
  // SET
  await redis.set(`cache:test:${timestamp}`, 'ok', { ex: 900 });
  
  // GET
  const value = await redis.get(`cache:test:${timestamp}`);
  
  res.status(200).json({ status: 'ok', value });
}
```

***

## 📊 6. PRÓXIMAS AÇÕES RECOMENDADAS

1. **Integrar Cache na rota `/api/openai/chat`**
   - Cache respostas de queries similares (tempo de vida: 15 minutos)
   - Reduzir chamadas à API OpenAI

2. **Implementar Semantic Caching com pgvector**
   - Usar Supabase pgvector + Redis para cache inteligente
   - Armazenar embeddings e respostas

3. **Monitorar Métricas**
   - Acompanhar hit rate do cache
   - Ajustar TTL conforme uso

4. **Backup e Persistência**
   - Ativar snapshots automáticos
   - Implementar fallback para banco principal

***

## 🔍 7. COMANDOS ÚTEIS PARA TESTE

### **Via Redis CLI**
```bash
redis-cli --tls -u rediss://default:PASSWORD@upward-trout-29626.upstash.io:6379

# Dentro do CLI:
> set cache:test:timestamp "ok" EX 900
> get cache:test:timestamp
> TTL cache:test:timestamp
> KEYS cache:*
```

### **Via curl (REST)**
```bash
# SET
curl -X POST https://upward-trout-29626.upstash.io/set/cache:test:timestamp/ok?EX=900 \
  -H "Authorization: Bearer AXQ6AAImcD..."

# GET
curl https://upward-trout-29626.upstash.io/get/cache:test:timestamp \
  -H "Authorization: Bearer AXQ6AAImcD..."
```

***

## ⚠️ 8. INFORMAÇÕES DE SEGURANÇA

- **Token exposto?** Regenere em `Settings > Reset Credentials` no Upstash
- **Usar variáveis de ambiente** (nunca commit no Git)
- **Ativar "Protect Credentials"** em configurações avançadas
- **TLS obrigatório**: sempre usar `rediss://` protocol

***

## 📌 RESUMO FINAL

```
✅ Database: zappro-cache
✅ Provedor: Upstash (São Paulo, BR)
✅ Conectividade: OK (132ms latência)
✅ TLS/SSL: Habilitado
✅ Credenciais: Geradas e testadas
✅ Status: Pronto para integração

🎯 Próximo Passo: Integrar na rota /api/openai/chat
```

***

**Data de Criação:** 2025-11-27 | **Timestamp:** 08:XX AM -03:00