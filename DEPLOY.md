# 🚀 Guia de Deploy - Bot WhatsApp AI

## 📋 Requisitos

### Node.js Version
- **Mínimo:** Node.js 20.0.0+
- **Recomendado:** Node.js 20.18.0 (LTS)
- **NPM:** 10.0.0+

### Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` ou configure no painel do Railway:

```env
# API Keys
GEMINI_API_KEY=sua_chave_gemini_aqui

# WhatsApp
WHATSAPP_PHONE_NUMBER=5511999999999

# Banco de Dados (opcional)
DB_PATH=./data/database.sqlite

# Configurações (opcional)
CHATS_CONFIG_PATH=./config/chats.json
```

---

## 🚂 Deploy na Railway

### 1️⃣ Preparação

O projeto já está configurado para Railway com os arquivos:
- `.node-version` - Especifica Node 20.18.0
- `railway.json` - Configuração do Railway
- `nixpacks.toml` - Build config do Nixpacks
- `package.json` - Engines atualizados

### 2️⃣ Deploy via GitHub

1. **Conecte seu repositório no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha este repositório

2. **Configure as Variáveis de Ambiente:**
   - No painel do Railway, vá em "Variables"
   - Adicione:
     ```
     GEMINI_API_KEY=sua_chave_aqui
     WHATSAPP_PHONE_NUMBER=seu_numero
     ```

3. **Deploy Automático:**
   - Railway detecta automaticamente Node 20
   - Instala dependências com `npm ci`
   - Inicia com `npm start`

### 3️⃣ Deploy via Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Linkar projeto
railway link

# Deploy
railway up
```

---

## 🐳 Deploy com Docker (Alternativa)

### Dockerfile (criar se necessário)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar diretórios necessários
RUN mkdir -p data config

# Expor porta (se necessário)
EXPOSE 3000

# Comando de início
CMD ["npm", "start"]
```

### Build e Run

```bash
# Build
docker build -t whatsapp-bot .

# Run
docker run -d \
  --name whatsapp-bot \
  -e GEMINI_API_KEY=sua_chave \
  -e WHATSAPP_PHONE_NUMBER=seu_numero \
  -v $(pwd)/data:/app/data \
  whatsapp-bot
```

---

## ☁️ Outras Plataformas

### Render.com

1. Conecte o GitHub
2. Configure Build Command: `npm install`
3. Configure Start Command: `npm start`
4. Adicione variáveis de ambiente
5. **Importante:** Selecione Node 20+ no painel

### Heroku

```bash
# Instalar Heroku CLI
heroku create seu-bot-whatsapp

# Especificar Node version
echo "20.18.0" > .node-version

# Deploy
git push heroku main

# Configurar env vars
heroku config:set GEMINI_API_KEY=sua_chave
heroku config:set WHATSAPP_PHONE_NUMBER=seu_numero
```

### VPS (Ubuntu/Debian)

```bash
# Instalar Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar projeto
git clone seu-repositorio
cd bot-whatsapp

# Instalar dependências
npm install

# Criar .env
nano .env
# Adicionar suas variáveis

# Iniciar com PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔍 Verificação de Deploy

### Checklist Pós-Deploy

- [ ] Bot iniciou sem erros
- [ ] Conectou ao WhatsApp (QR Code ou pairing code)
- [ ] Gemini API Key válida
- [ ] Banco de dados criado
- [ ] Chats autorizados carregados
- [ ] Primeira mensagem de teste respondida

### Logs

**Railway:**
```bash
railway logs
```

**PM2:**
```bash
pm2 logs whatsapp-ai-bot
```

**Docker:**
```bash
docker logs -f whatsapp-bot
```

---

## ⚠️ Problemas Comuns

### Erro: Node version incompatível

**Solução:**
- Certifique-se de usar Node 20+
- Railway: Verificar `.node-version` está presente
- Heroku: `heroku buildpacks:set heroku/nodejs`

### Erro: GEMINI_API_KEY não definida

**Solução:**
- Configurar variável de ambiente
- Railway: Painel > Variables
- VPS: Criar arquivo `.env`

### Erro: WhatsApp não conecta

**Solução:**
- Verificar WHATSAPP_PHONE_NUMBER está correto
- Verificar se o número tem WhatsApp ativo
- Limpar pasta `data/auth` e tentar novamente

### Erro: Banco de dados travado

**Solução:**
```bash
rm data/database.sqlite
# Reiniciar o bot
```

---

## 📊 Monitoramento

### Logs Importantes

```bash
# Ver logs em tempo real
tail -f logs/app.log

# Buscar erros
grep "ERROR" logs/app.log

# Ver status de conexão
grep "Conectado ao WhatsApp" logs/app.log
```

### Healthcheck

Adicione este endpoint no `src/index.js`:

```javascript
// Healthcheck HTTP (opcional)
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  }
});

server.listen(process.env.PORT || 3000);
```

---

## 🔄 Atualização

### Railway (Auto-deploy)
- Push para GitHub = Deploy automático

### Manual
```bash
git pull origin main
npm install
pm2 restart whatsapp-ai-bot
```

---

## 🛡️ Segurança

### Checklist de Segurança

- [ ] `.env` no `.gitignore`
- [ ] API Keys nunca commitadas
- [ ] `data/` e `auth/` no `.gitignore`
- [ ] HTTPS habilitado (se aplicável)
- [ ] Rate limiting configurado
- [ ] Logs não expõem dados sensíveis

---

## 📞 Suporte

**Problemas de deploy?**
- Verifique os logs primeiro
- Confira se todas as variáveis de ambiente estão configuradas
- Certifique-se de usar Node 20+
- Verifique se a API Key do Gemini é válida

---

**Última atualização:** 28 de Outubro de 2025  
**Node Version:** 20.18.0+  
**Plataformas Testadas:** Railway, VPS Ubuntu 22.04
