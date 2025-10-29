#!/bin/bash

# Script para resetar completamente o bot na VM
# Execute com: bash vm-reset.sh

set -e

echo "🔥 RESETANDO BOT COMPLETAMENTE..."
echo ""

# 1. Parar PM2
echo "⏹️  Parando PM2..."
pm2 stop all || true
pm2 delete all || true

# 2. Backup do .env
echo "💾 Fazendo backup do .env..."
cp .env .env.backup || echo "⚠️  Sem .env para backup"

# 3. Limpar node_modules e reinstalar
echo "🧹 Limpando node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# 4. Git pull para garantir código atualizado
echo "📥 Atualizando código..."
git fetch origin
git reset --hard origin/main

# 5. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 6. Verificar versão do Baileys
echo "🔍 Verificando versão do Baileys..."
BAILEYS_VERSION=$(npm list @whiskeysockets/baileys | grep @whiskeysockets/baileys)
echo "   $BAILEYS_VERSION"

if [[ $BAILEYS_VERSION != *"7.0.0"* ]]; then
  echo "❌ ERRO: Baileys não está na versão 7.0.0!"
  echo "   Forçando instalação da versão correta..."
  npm install @whiskeysockets/baileys@latest
fi

# 7. Limpar credenciais antigas
echo "🗑️  Limpando credenciais antigas..."
rm -rf data/auth/*

# 8. Verificar se o código está correto
echo "🔍 Verificando código atualizado..."
if grep -q "type, messages" src/index.js; then
  echo "   ✅ Código está atualizado (Baileys 7.0 format)"
else
  echo "   ❌ ERRO: Código não está atualizado!"
  exit 1
fi

# 9. Iniciar PM2
echo "🚀 Iniciando bot com PM2..."
pm2 start src/index.js --name whatsapp-bot --time

# 10. Configurar PM2 startup
echo "🔧 Configurando PM2 startup..."
pm2 save

# 11. Mostrar status
echo ""
echo "✅ BOT RESETADO COM SUCESSO!"
echo ""
echo "📊 Status do PM2:"
pm2 status

echo ""
echo "📝 Agora execute:"
echo "   pm2 logs whatsapp-bot"
echo ""
echo "E escaneie o QR Code quando aparecer!"
