# 🔧 DIAGNÓSTICO COMPLETO - VM NÃO RECEBE MENSAGENS

Execute esses comandos **NA VM** e me envie a saída completa:

## 1️⃣ Verificar versão do Baileys
```bash
cd ~/bot-whatsapp
npm list @whiskeysockets/baileys
```

**Esperado:** `@whiskeysockets/baileys@7.0.0-rc.6`

---

## 2️⃣ Verificar código atualizado
```bash
git log -1 --pretty=format:"%h - %s"
```

**Esperado:** `2e03fc7 - fix: corrigir formato do evento messages.upsert para baileys 7.0`

---

## 3️⃣ Verificar conteúdo do arquivo
```bash
grep -n "type, messages" src/index.js
```

**Esperado:** deve mostrar uma linha com `({ type, messages })`

---

## 4️⃣ Verificar se PM2 está usando o código novo
```bash
pm2 describe whatsapp-bot | grep "script path"
cat $(pm2 describe whatsapp-bot | grep "script path" | awk '{print $4}')
```

---

## 5️⃣ Ver todos os processos node
```bash
ps aux | grep node
```

---

## 6️⃣ Verificar logs completos do PM2
```bash
pm2 logs whatsapp-bot --lines 200 --nostream
```

---

## 🚨 SE ALGUM DESSES FALHAR:

### SOLUÇÃO RADICAL (LIMPAR TUDO E REINSTALAR):

```bash
# 1. Parar e deletar tudo do PM2
pm2 stop all
pm2 delete all
pm2 kill

# 2. Fazer backup do .env
cp .env .env.backup

# 3. Deletar TUDO e clonar de novo
cd ~
rm -rf bot-whatsapp
git clone https://github.com/henriquercz/bot-whatsapp.git
cd bot-whatsapp

# 4. Restaurar .env
cp ~/.env.backup .env

# 5. Instalar dependências limpas
npm install

# 6. Verificar versão do baileys
npm list @whiskeysockets/baileys

# 7. Iniciar com PM2
pm2 start src/index.js --name whatsapp-bot --time

# 8. Ver logs
pm2 logs whatsapp-bot
```

**Se isso não funcionar, o problema é outra coisa que vamos investigar!**
