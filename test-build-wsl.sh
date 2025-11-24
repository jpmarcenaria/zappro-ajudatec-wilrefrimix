#!/bin/bash
# Script de teste de build WSL para ZapPRO

echo "🧪 Iniciando testes de build WSL..."
echo "=================================="

# Verificar se estamos no WSL
if ! grep -qi microsoft /proc/version; then
    echo "❌ Este script deve ser executado no WSL Ubuntu 24.04"
    exit 1
fi

# Navegar para o diretório do projeto
cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix

echo "📍 Diretório atual: $(pwd)"

# Testar build do projeto raiz (Vite)
echo ""
echo "🔨 Testando build do projeto raiz (Vite)..."
echo "Limpando cache..."
rm -rf node_modules/.vite
rm -rf dist

echo "Instalando dependências do projeto raiz..."
npm install

echo "Executando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build do projeto raiz Vite: SUCESSO"
else
    echo "❌ Build do projeto raiz Vite: FALHA"
    exit 1
fi

# Testar build do SaaS (Next.js)
echo ""
echo "🔨 Testando build do SaaS (Next.js)..."
cd apps/saas

echo "Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "Instalando dependências do SaaS..."
npm install

echo "Executando typecheck..."
npm run typecheck

if [ $? -eq 0 ]; then
    echo "✅ Typecheck do SaaS: SUCESSO"
else
    echo "❌ Typecheck do SaaS: FALHA"
    exit 1
fi

echo "Executando lint..."
npm run lint

echo "Executando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build do SaaS Next.js: SUCESSO"
else
    echo "❌ Build do SaaS Next.js: FALHA"
    exit 1
fi

echo ""
echo "🎉 Todos os testes de build foram concluídos com sucesso!"
echo "✅ O projeto está totalmente compatível com WSL Ubuntu 24.04"