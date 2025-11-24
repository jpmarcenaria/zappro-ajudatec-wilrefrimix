#!/bin/bash
# Script de teste de execução da aplicação no WSL

echo "🚀 Testando execução da aplicação no WSL Ubuntu 24.04..."
echo "=================================="

# Verificar se estamos no WSL
if ! grep -qi microsoft /proc/version; then
    echo "❌ Este script deve ser executado no WSL Ubuntu 24.04"
    exit 1
fi

# Navegar para o diretório do projeto
cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix

echo "📍 Diretório atual: $(pwd)"

# Verificar se as dependências estão instaladas
echo ""
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do projeto raiz..."
    npm install
fi

if [ ! -d "apps/saas/node_modules" ]; then
    echo "Instalando dependências do SaaS..."
    cd apps/saas && npm install && cd ../..
fi

# Testar aplicação React (Vite)
echo ""
echo "🌐 Testando aplicação React (Vite)..."
echo "Iniciando servidor de desenvolvimento..."
echo "Acesse: http://localhost:3000"
echo "Pressione Ctrl+C para parar"
echo ""

npm run dev

echo ""
echo "✅ Teste de execução concluído!"
echo "📋 Resumo:"
echo "- Aplicação React (Vite) executando em: http://localhost:3000"
echo "- Aplicação Next.js SaaS pode ser executada com: npm run saas:dev"
echo "- Ambiente WSL Ubuntu 24.04 configurado com sucesso!"