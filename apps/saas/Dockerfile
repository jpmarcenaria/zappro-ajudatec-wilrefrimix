FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm ci
COPY . /app
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static ./apps/saas/.next/static
COPY --from=builder /app/public ./apps/saas/public
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||'3001')+'/api/search/professors', r=>{ if(r.statusCode!==200) process.exit(1) }).on('error',()=>process.exit(1))"
CMD ["node","apps/saas/server.js"]
