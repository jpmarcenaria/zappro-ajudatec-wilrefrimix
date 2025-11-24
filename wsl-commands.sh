#!/bin/bash
# Comandos WSL específicos para ZapPRO no Ubuntu 24.04

echo "🐧 Comandos WSL Ubuntu 24.04 - ZapPRO"
echo "=================================="

# Comandos básicos do sistema
echo "📋 Comandos do sistema:"
echo "- Atualizar sistema: sudo apt update && sudo apt upgrade -y"
echo "- Verificar versão: lsb_release -a"
echo "- Verificar espaço em disco: df -h"
echo "- Verificar memória: free -h"

echo ""
echo "🐳 Comandos Docker:"
echo "- Iniciar Docker: sudo systemctl start docker"
echo "- Verificar status: sudo systemctl status docker"
echo "- Adicionar usuário ao grupo docker: sudo usermod -aG docker \$USER"
echo "- Testar Docker: docker run hello-world"

echo ""
echo "⬢ Comandos Node.js:"
echo "- Verificar versão: node --version"
echo "- Verificar npm: npm --version"
echo "- Limpar cache npm: npm cache clean --force"
echo "- Verificar pacotes globais: npm list -g --depth=0"

echo ""
echo "🔷 Comandos Supabase:"
echo "- Versão: supabase --version"
echo "- Iniciar Supabase local: npx supabase start"
echo "- Parar Supabase: npx supabase stop"
echo "- Resetar banco: npx supabase db reset"
echo "- Status: npx supabase status"

echo ""
echo "📁 Navegação de diretórios:"
echo "- Projeto raiz: cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix"
echo "- SaaS app: cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas"
echo "- Verificar arquivos: ls -la"
echo "- Verificar permissões: ls -la | grep -E '\.sh$|\.json$|\.ts$|\.tsx$'"

echo ""
echo "🔍 Comandos de debug:"
echo "- Verificar WSL: grep -qi microsoft /proc/version && echo \"WSL detectado\" || echo \"Não é WSL\""
echo "- Verificar Ubuntu: lsb_release -rs"
echo "- Verificar processos: ps aux | grep -E 'node|docker|supabase'"
echo "- Verificar portas: netstat -tulpn | grep -E ':3000|:54321|:54322'"

echo ""
echo "🚀 Scripts do projeto:"
echo "- Setup WSL: ./setup-wsl-ubuntu24.sh"
echo "- Verificar ambiente: ./check-wsl-env.sh"
echo "- Converter paths: ./convert-paths-wsl.sh"
echo "- Testar build: ./test-build-wsl.sh"
echo "- Executar aplicação: ./test-run-wsl.sh"
echo "- Verificar versões: ./check-versions-compatibility.sh"

echo ""
echo "✅ Use 'wsl bash -lc \"comando\"' para executar do Windows"