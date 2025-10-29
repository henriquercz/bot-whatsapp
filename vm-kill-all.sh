#!/bin/bash

# Script ULTRA RADICAL para matar TUDO e começar do zero
# Execute com: bash vm-kill-all.sh

set -e

echo "💀 MATANDO TUDO E RECOMEÇANDO DO ZERO..."
echo ""

# 1. Matar PM2 completamente
echo "💀 Matando PM2..."
pm2 kill || true

# 2. Matar TODOS os processos node
echo "💀 Matando todos os processos Node..."
pkill -9 node || true
sleep 2

# 3. Verificar se ainda há processos node
NODE_PROCS=$(ps aux | grep node | grep -v grep || true)
if [ -n "$NODE_PROCS" ]; then
  echo "⚠️  Ainda há processos node rodando:"
  echo "$NODE_PROCS"
  echo "💀 Tentando matar novamente..."
  killall -9 node || true
  sleep 2
fi

# 4. Backup do .env
echo "💾 Backup do .env..."
cp .env .env.backup || true

# 5. Ir para home
cd ~

# 6. Deletar TUDO
echo "🗑️  Deletando projeto antigo..."
rm -rf bot-whatsapp

# 7. Clonar novamente
echo "📥 Clonando projeto novamente..."
git clone https://github.com/henriquercz/bot-whatsapp.git
cd bot-whatsapp

# 8. Restaurar .env
echo "💾 Restaurando .env..."
if [ -f ~/.env.backup ]; then
  cp ~/.env.backup .env
  echo "   ✅ .env restaurado"
else
  echo "   ⚠️  Sem backup do .env - você precisará criar manualmente"
fi

# 9. Verificar versão do Node
echo "🔍 Versão do Node:"
node --version

# 10. Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# 11. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 12. Verificar Baileys
echo "🔍 Verificando Baileys:"
npm list @whiskeysockets/baileys

# 13. Verificar se o código está correto
echo "🔍 Verificando código..."
if grep -q "type, messages" src/index.js; then
  echo "   ✅ Código correto (Baileys 7.0)"
else
  echo "   ❌ ERRO: Código incorreto!"
  exit 1
fi

# 14. Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p data/auth
mkdir -p config

# 15. Verificar permissões
echo "🔧 Verificando permissões..."
chmod -R 755 .
chmod +x src/index.js

# 16. Testar se o arquivo funciona diretamente
echo ""
echo "🧪 TESTE 1: Executar diretamente com Node (será interrompido em 10 segundos)"
timeout 10 node src/index.js || true

echo ""
echo "✅ Se você viu '🚀🚀🚀 REGISTRANDO LISTENER' acima, o código está OK!"
echo ""

# 17. Iniciar com PM2
echo "🚀 Iniciando com PM2..."
pm2 start src/index.js --name whatsapp-bot --time --log-date-format="YYYY-MM-DD HH:mm:ss"

# 18. Esperar 3 segundos
sleep 3

# 19. Verificar status
echo ""
echo "📊 Status do PM2:"
pm2 status

# 20. Configurar startup
echo ""
echo "🔧 Configurando PM2 startup..."
pm2 save

echo ""
echo "=" 
echo "✅ TUDO RESETADO!"
echo "="
echo ""
echo "📝 Próximo passo:"
echo "   pm2 logs whatsapp-bot --lines 50"
echo ""
echo "🔍 Se não funcionar, execute:"
echo "   pm2 logs whatsapp-bot --err"
echo ""
