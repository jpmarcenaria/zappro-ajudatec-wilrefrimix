# Guia de Deploy

Este documento descreve os processos para fazer o deploy da aplicação na Vercel e para construir a imagem Docker.

## Deploy na Vercel

O deploy na Vercel é o método recomendado para produção.

### Configuração do Projeto

1.  **Importar o Projeto:** Importe o repositório do GitHub para a Vercel.
2.  **Diretório Raiz:** A Vercel deve detectar automaticamente que o diretório raiz é `apps/saas` graças ao arquivo `vercel.json` na raiz do projeto. Se não, configure manualmente `apps/saas` como o "Root Directory" nas configurações do projeto.
3.  **Variáveis de Ambiente:** Configure as seguintes variáveis de ambiente nas configurações do projeto na Vercel (Project Settings → Environment Variables):

    ```
    NEXT_PUBLIC_WEBSITE_URL
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    OPENAI_API_KEY
    ```

4.  **Redeploy:** Após configurar as variáveis, faça o redeploy da aplicação para que as alterações tenham efeito.

### Configuração do Webhook do Stripe

Após o deploy, você precisa configurar o endpoint de webhook no painel do Stripe para receber eventos de assinatura.

1.  **Endpoint URL:** `https://<seu-dominio-na-vercel>.app/api/webhook/stripe`
2.  **Eventos:** Configure o webhook para enviar todos os eventos (`all_events`) para este endpoint.

### Monitoramento de Saúde (Health Check)

A aplicação expõe um endpoint de health check em `/api/health` que pode ser usado por serviços de monitoramento (como a própria Vercel) para verificar a disponibilidade da aplicação. Este endpoint retorna um status `200 OK` quando a aplicação está operacional.

## Build com Docker

A aplicação inclui um `Dockerfile` otimizado para criar uma imagem de produção leve e segura.

### Estrutura do Dockerfile

-   **Base:** Utiliza a imagem `node:20-alpine`, que é mínima e segura.
-   **Usuário Non-Root:** Cria e utiliza um usuário `nextjs` sem privilégios de root para executar a aplicação, seguindo as melhores práticas de segurança.
-   **Build Multi-Stage:**
    1.  **`deps` stage:** Instala as dependências.
    2.  **`builder` stage:** Constrói a aplicação Next.js.
    3.  **`runner` stage:** Copia apenas os artefatos de build necessários da fase `builder` para uma imagem final limpa, resultando em uma imagem menor e com superfície de ataque reduzida.
-   **Execução:** A aplicação é iniciada com `npm start`.

### Scan de Vulnerabilidades

O repositório está configurado com um workflow de GitHub Actions (`.github/workflows/scan.yml`) que utiliza o Trivy para escanear a imagem Docker em busca de vulnerabilidades a cada push para a branch `main`.
