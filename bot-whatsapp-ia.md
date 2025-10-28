# 🤖 Prompt Completo para Desenvolvedor de IA - Bot WhatsApp Personalizado

**Versão:** 1.0  
**Data:** Outubro 2025  
**Objetivo:** Fornecer um prompt detalhado e estruturado para um AI Developer implementar um bot de WhatsApp com inteligência artificial personalizada

---

## 📋 Sumário Executivo

Este é um **prompt técnico completo e estruturado** para desenvolvimento de um bot de WhatsApp que:
- ✅ **Aprende o padrão de respostas do usuário** através de suas próprias mensagens
- ✅ **Funciona 100% localmente** via Node.js (executável com `node index.js`)
- ✅ **Mantém memória de conversas** para contexto contínuo
- ✅ **Usa Gemini 2.5 Flash** da Google para geração de respostas
- ✅ **Filtra chats/grupos autorizados** via arquivo de configuração JSON
- ✅ **Roda como daemon** via PM2 com logs e monitoramento
- ✅ **Estrutura modular e profissional** seguindo best practices de produção

O bot **não requer fluxos visuais (N8N)**, apenas um comando simples do Node.js para execução.

---

## 🎯 Requisitos do Projeto

### Requisitos Funcionais

| Requisito | Descrição | Prioridade |
|-----------|-----------|-----------|
| **Autenticação WhatsApp** | Conectar com conta WhatsApp via QR Code (Linked Devices) | 🔴 Crítica |
| **Processamento de Mensagens** | Ler mensagens recebidas e identificar contexto | 🔴 Crítica |
| **IA Personalizada** | Usar Gemini 2.5 Flash para gerar respostas | 🔴 Crítica |
| **Aprendizado de Estilo** | Analisar próprias mensagens para extrair padrões | 🔴 Crítica |
| **Memória de Contexto** | Armazenar histórico de conversas por chat | 🔴 Crítica |
| **Filtro de Chats** | Autorizar/rejeitar chats e grupos específicos | 🔴 Crítica |
| **Arquivo de Configuração** | Config editável em `config/chats.json` | 🟠 Alta |
| **Execução Local** | Rodar na máquina do usuário sem dependências externas | 🟠 Alta |
| **Gerenciamento de Processo** | Execução como daemon com PM2 | 🟠 Alta |
| **Logging e Monitoramento** | Sistema de logs para debug e monitoramento | 🟡 Média |

### Requisitos Técnicos

**Ambiente:**
- Node.js: v18+ (com suporte nativo a SQLite)
- Sistemas: Windows, Linux, macOS
- Memória: Mínimo 512MB
- Conexão: Internet estável (WebSocket para WhatsApp)

**Tecnologias Mandatórias:**
1. **WhatsApp Client**: `@whiskeysockets/baileys` (recomendado) ou `whatsapp-web.js` (alternativa)
2. **IA API**: `@google/generative-ai` (Gemini 2.5 Flash)
3. **Database**: `node:sqlite` (nativo do Node.js)
4. **Config**: `dotenv` + `js-yaml`
5. **Process Manager**: `pm2` (daemon + logs + auto-restart)
6. **Logger**: `pino` (estruturado, performático)

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios

```
whatsapp-ai-bot/
├── src/
│   ├── index.js                          # 🔴 Ponto de entrada principal
│   ├── whatsapp/
│   │   ├── client.js                     # Inicialização e gerenciamento do cliente Baileys
│   │   ├── auth.js                       # Autenticação, QR Code, armazenamento de credenciais
│   │   ├── messageHandler.js             # Processamento de mensagens recebidas
│   │   └── eventListeners.js             # Listeners de eventos WhatsApp
│   ├── ai/
│   │   ├── gemini.js                     # Integração com Google Gemini 2.5 Flash
│   │   ├── promptBuilder.js              # Construção dinâmica de prompts personalizados
│   │   ├── styleAnalyzer.js              # Análise de padrões do estilo de escrita
│   │   └── responseGenerator.js          # Geração de respostas com contexto
│   ├── database/
│   │   ├── db.js                         # Inicialização e gerenciamento SQLite
│   │   ├── messageStorage.js             # CRUD de mensagens
│   │   ├── chatConfig.js                 # Gerenciamento de chats autorizados
│   │   └── userProfile.js                # Perfil e estilo do usuário
│   ├── memory/
│   │   ├── conversationMemory.js         # Buffer de histórico de conversas
│   │   ├── contextManager.js             # Gerenciamento de contexto por chat
│   │   └── embeddingManager.js           # (Opcional) Embeddings para busca semântica
│   ├── config/
│   │   ├── configLoader.js               # Carregamento de configs de arquivo
│   │   └── validator.js                  # Validação de configurações
│   ├── security/
│   │   ├── encryption.js                 # (Opcional) Criptografia de dados sensíveis
│   │   └── rateLimiter.js                # Rate limiting para APIs
│   ├── commands/
│   │   ├── commandParser.js              # Parser de comandos admin
│   │   └── handlers/
│   │       ├── authorizeHandler.js       # !authorize command
│   │       ├── statusHandler.js          # !status command
│   │       └── learnHandler.js           # !relearn command
│   └── utils/
│       ├── logger.js                     # Sistema de logging com pino
│       ├── formatter.js                  # Formatação de dados
│       └── helpers.js                    # Funções auxiliares
├── config/
│   ├── default.yaml                      # Configurações padrão (ambiente, timeouts, etc)
│   ├── chats.json                        # ⭐ Chats e grupos autorizados (EDITÁVEL)
│   ├── prompts.yaml                      # Templates de prompts para Gemini
│   └── example-chats.json                # Exemplo de configuração
├── data/
│   ├── auth/                             # Credenciais Baileys (geradas automaticamente)
│   │   ├── creds.json
│   │   └── sessions.json
│   └── database.sqlite                   # Banco de dados SQLite (gerado automaticamente)
├── logs/
│   ├── combined.log                      # Logs gerais
│   ├── error.log                         # Logs de erros
│   └── app.log                           # Logs da aplicação
├── .env.example                          # Exemplo de variáveis de ambiente
├── .env                                  # ⭐ Variáveis de ambiente (NÃO COMMITAR)
├── .gitignore                            # Ignorar arquivos sensíveis
├── ecosystem.config.js                   # Configuração PM2
├── package.json                          # Dependências e scripts
├── package-lock.json                     # Lock de versões
└── README.md                             # Documentação do projeto
```

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    WhatsApp Bot IA                       │
└─────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼─────┐
    │  WhatsApp   │  │     IA      │  │ Database  │
    │   Client    │  │   Engine    │  │   SQLite  │
    │  (Baileys)  │  │   (Gemini)  │  │           │
    └─────┬──────┘  └──────┬──────┘  └─────┬─────┘
          │                │                │
          └────────────┬───┴────────────────┘
                       │
          ┌────────────▼───────────────┐
          │   Message Handler &        │
          │   AI Response Generator    │
          └────────────┬───────────────┘
                       │
          ┌────────────▼───────────────┐
          │  Chat Authorization        │
          │  (config/chats.json)       │
          └────────────────────────────┘
```

---

## 🔧 Guia Técnico Detalhado por Componente

### 1️⃣ INDEX.JS - Ponto de Entrada Principal

**Arquivo:** `src/index.js`

**Responsabilidades:**
- Inicializar logger e variáveis de ambiente
- Conectar ao banco de dados SQLite
- Iniciar cliente WhatsApp (Baileys)
- Registrar listeners de eventos
- Tratamento de erros global

**Código Exemplo:**

```javascript
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { initializeDatabase } from './database/db.js';
import { startWhatsAppClient } from './whatsapp/client.js';
import { MessageHandler } from './whatsapp/messageHandler.js';
import { GeminiAI } from './ai/gemini.js';
import { ChatConfigManager } from './database/chatConfig.js';
import { ConversationMemory } from './memory/conversationMemory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    logger.info('🚀 Iniciando WhatsApp AI Bot...');
    
    // 1. Inicializar banco de dados
    const db = initializeDatabase(process.env.DB_PATH || './data/database.sqlite');
    logger.info('✅ Banco de dados inicializado');
    
    // 2. Carregar configurações
    const chatConfig = new ChatConfigManager('./config/chats.json');
    logger.info(`✅ Configuração carregada. Chats autorizados: ${chatConfig.config.authorizedChats.length}`);
    
    // 3. Inicializar IA
    const geminiAI = new GeminiAI(process.env.GEMINI_API_KEY);
    logger.info('✅ Gemini AI inicializado');
    
    // 4. Inicializar memória
    const memory = new ConversationMemory(db);
    logger.info('✅ Memória de conversação inicializada');
    
    // 5. Iniciar cliente WhatsApp
    const sock = await startWhatsAppClient();
    logger.info('✅ Cliente WhatsApp iniciado');
    
    // 6. Configurar handlers de mensagem
    const messageHandler = new MessageHandler(
      sock,
      geminiAI,
      memory,
      chatConfig
    );
    
    // Listener de mensagens
    sock.ev.on('messages.upsert', async (m) => {
      for (const msg of m.messages) {
        await messageHandler.handleIncomingMessage(msg);
      }
    });
    
    logger.info('🤖 Bot pronto para receber mensagens!');
    
  } catch (error) {
    logger.error('❌ Erro fatal ao iniciar bot:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para shutdown gracioso
process.on('SIGINT', () => {
  logger.info('⏹️ Encerrando bot graciosamente...');
  process.exit(0);
});

main().catch(logger.error);
```

**Checklist de Inicialização:**
- [ ] Logger funcionando e exportando para arquivo
- [ ] SQLite banco criado em `./data/database.sqlite`
- [ ] Variáveis de ambiente carregadas de `.env`
- [ ] Cliente WhatsApp exibindo QR Code no terminal
- [ ] Conexão com Gemini testada (chamada de teste)
- [ ] Handlers de evento registrados

---

### 2️⃣ WHATSAPP CLIENT - Baileys Integration

**Arquivo:** `src/whatsapp/client.js`

**Recomendação: Usar `@whiskeysockets/baileys` (v6.7.0+)**

**Razões:**
- ✅ Multi-device support nativo
- ✅ Sem dependência de navegador/Puppeteer
- ✅ WebSocket direto (mais rápido)
- ✅ Autenticação via QR Code ou Pairing Code
- ✅ Manutenção ativa (comunidade @whiskeysockets)

**Código Implementação:**

```javascript
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

const AUTH_PATH = './data/auth';

export async function startWhatsAppClient() {
  
  // Garantir que o diretório de autenticação existe
  if (!fs.existsSync(AUTH_PATH)) {
    fs.mkdirSync(AUTH_PATH, { recursive: true });
    logger.info(`📁 Diretório de autenticação criado: ${AUTH_PATH}`);
  }

  // Carregar ou criar estado de autenticação
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  logger.info('🔐 Estado de autenticação carregado/criado');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // 👀 QR Code no terminal
    browser: Browsers.ubuntu('WhatsApp AI Bot v1.0'),
    syncFullHistory: false, // Não sincronizar histórico completo (economia)
    markOnlineOnConnect: true, // Marcar como online
    connectionTimeoutMs: 60_000, // Timeout de 60s
    keepAliveIntervalMs: 30_000, // Keep-alive a cada 30s
    generateHighQualityLinkPreview: false, // Economia de banda
    logger: {
      level: 'silent', // Logs internos do Baileys: silent/info/debug
    },
  });

  // 🔐 Salvar credenciais quando atualizadas
  sock.ev.on('creds.update', async () => {
    logger.info('💾 Credenciais atualizadas e salvas');
    await saveCreds();
  });

  // 📡 Gerenciar conexão
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isNewLogin, qr } = update;

    if (qr) {
      logger.info('📲 Novo QR Code gerado. Escaneie com seu WhatsApp:');
      logger.info('   (Abra WhatsApp → Dispositivos Conectados → Conectar Dispositivo)');
    }

    if (connection === 'connecting') {
      logger.info('⏳ Conectando ao WhatsApp...');
    } else if (connection === 'open') {
      logger.info('✅ Conectado ao WhatsApp com sucesso!');
      if (isNewLogin) {
        logger.info('🆕 Nova autenticação realizada!');
      }
    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error).output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      if (reason === DisconnectReason.loggedOut) {
        logger.warn('⚠️ Logout detectado. Credenciais invalidadas. Escaneie novo QR Code.');
      } else if (reason === DisconnectReason.connectionClosed) {
        logger.warn('⚠️ Conexão fechada. Reconectando...');
      } else if (reason === DisconnectReason.connectionLost) {
        logger.warn('⚠️ Conexão perdida. Reconectando...');
      } else if (reason === DisconnectReason.connectionReplaced) {
        logger.warn('⚠️ Conexão substituída em outro dispositivo.');
      } else if (reason === DisconnectReason.restartRequired) {
        logger.warn('⚠️ Reinício necessário. Reconectando...');
      }

      if (shouldReconnect) {
        // Tentar reconectar após 5 segundos
        logger.info('🔄 Reconectando em 5 segundos...');
        setTimeout(() => startWhatsAppClient(), 5000);
      }
    }
  });

  // 📱 Detectar status de chat (está digitando, etc)
  sock.ev.on('chat.update', (update) => {
    // Pode usar para debug ou análise
  });

  return sock;
}

export async function sendMessage(sock, chatId, text, options = {}) {
  try {
    const result = await sock.sendMessage(chatId, {
      text: text,
      ...options
    });
    logger.debug(`📤 Mensagem enviada para ${chatId}`);
    return result;
  } catch (error) {
    logger.error(`❌ Erro ao enviar mensagem para ${chatId}:`, error);
    throw error;
  }
}

export async function getChatInfo(sock, chatId) {
  try {
    const chat = await sock.groupMetadata?.(chatId) || { id: chatId };
    return {
      id: chat.id,
      name: chat.subject || 'Chat Pessoal',
      isGroup: chat.id?.endsWith('@g.us') || false,
      participants: chat.participants?.length || 0
    };
  } catch (error) {
    logger.error(`❌ Erro ao obter info do chat ${chatId}:`, error);
    return null;
  }
}
```

**Notas Importantes sobre Autenticação:**

```plaintext
┌─ PRIMEIRA EXECUÇÃO ─────────────────────────────────┐
│                                                      │
│ 1. Executar: node src/index.js                       │
│ 2. Terminal exibe: "QR Code gerado..."               │
│ 3. Abrir WhatsApp no celular                         │
│ 4. Ir em: Configurações → Dispositivos Conectados    │
│ 5. Clicar em: "Conectar Dispositivo"                 │
│ 6. Escanear QR Code exibido no terminal              │
│ 7. Credenciais são salvas em ./data/auth/            │
│ 8. Bot conecta e fica pronto!                        │
│                                                      │
├─ PRÓXIMAS EXECUÇÕES ────────────────────────────────┤
│ Bot usa credenciais salvas em ./data/auth/           │
│ Se credenciais expirem (logout), será pedido novo QR │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 3️⃣ MESSAGE HANDLER - Processamento de Mensagens

**Arquivo:** `src/whatsapp/messageHandler.js`

**Fluxo de Processamento:**

```
Mensagem recebida
    ↓
Extrair conteúdo e metadados
    ↓
Salvar para aprendizado (se própria)
    ↓
É mensagem própria? → SIM → Atualizar perfil de estilo
    ↓ NÃO
Verificar autorização do chat
    ↓
Chat autorizado? → NÃO → Ignorar
    ↓ SIM
Verificar se é comando admin
    ↓
É comando? → SIM → Executar comando
    ↓ NÃO
Buscar histórico de conversa
    ↓
Gerar prompt com contexto + estilo
    ↓
Chamar Gemini API
    ↓
Enviar resposta via WhatsApp
    ↓
Salvar resposta no histórico
```

**Código Implementação:**

```javascript
import logger from '../utils/logger.js';
import { sendMessage } from './client.js';
import { CommandParser } from '../commands/commandParser.js';

export class MessageHandler {
  constructor(sock, geminiAI, memory, chatConfig) {
    this.sock = sock;
    this.geminiAI = geminiAI;
    this.memory = memory;
    this.chatConfig = chatConfig;
    this.commandParser = new CommandParser();
    this.responseQueue = new Map(); // Para evitar respostas duplicadas
  }

  async handleIncomingMessage(message) {
    try {
      // Validação básica
      if (!message.message) return;
      if (message.status === 2 && message.status === 3) return; // Ignorar status de leitura

      const chatId = message.key.remoteJid;
      const messageId = message.key.id;
      const isFromMe = message.key.fromMe;
      
      // Evitar processar mesma mensagem duas vezes
      if (this.responseQueue.has(messageId)) return;
      this.responseQueue.set(messageId, true);
      setTimeout(() => this.responseQueue.delete(messageId), 10000);

      // Extrair texto da mensagem
      const messageText = this.extractMessageText(message);
      if (!messageText) return;

      const sender = message.key.participant || chatId;
      const timestamp = message.messageTimestamp * 1000;

      logger.debug(`📨 [${sender}] ${messageText.substring(0, 50)}...`);

      // ============ PASSO 1: Salvar para Aprendizado ============
      this.memory.saveMessage(chatId, sender, messageText, isFromMe, timestamp);

      // ============ PASSO 2: Se é mensagem própria ============
      if (isFromMe) {
        logger.debug('📝 Mensagem própria salva para aprendizado');
        
        // Atualizar perfil de estilo periodicamente
        const lastAnalysis = this.memory.getLastStyleAnalysis();
        const timeSinceAnalysis = Date.now() - lastAnalysis;
        
        // Analisar a cada 50 mensagens ou 6 horas
        const messagesCount = this.memory.getOwnMessageCount();
        if (timeSinceAnalysis > 6 * 60 * 60 * 1000 || messagesCount % 50 === 0) {
          logger.info('📊 Atualizando perfil de estilo...');
          await this.memory.analyzeUserStyle();
        }
        
        return; // Não responder à própria mensagem
      }

      // ============ PASSO 3: Verificar Autorização ============
      if (!this.chatConfig.isAuthorized(chatId)) {
        logger.debug(`🚫 Chat não autorizado: ${chatId}`);
        return;
      }

      logger.debug(`✅ Chat autorizado: ${chatId}`);

      // ============ PASSO 4: Verificar Comandos Admin ============
      if (messageText.startsWith('!')) {
        await this.handleCommand(messageText, chatId, sender);
        return;
      }

      // ============ PASSO 5: Gerar e Enviar Resposta ============
      await this.generateAndSendResponse(chatId, messageText, sender);

    } catch (error) {
      logger.error('❌ Erro ao processar mensagem:', error);
    }
  }

  extractMessageText(message) {
    // Tentar extrair texto de diferentes tipos de mensagem
    const msg = message.message;
    
    if (msg?.conversation) return msg.conversation;
    if (msg?.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg?.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg?.videoMessage?.caption) return msg.videoMessage.caption;
    if (msg?.documentMessage?.caption) return msg.documentMessage.caption;
    if (msg?.audioMessage?.caption) return msg.audioMessage.caption;
    
    return null;
  }

  async handleCommand(text, chatId, sender) {
    try {
      const command = this.commandParser.parse(text);
      
      switch (command.type) {
        case 'authorize':
          await this.chatConfig.addAuthorizedChat(command.chatId || chatId);
          await sendMessage(this.sock, chatId, 
            `✅ Chat autorizado! Agora vou responder mensagens aqui.`);
          logger.info(`✅ Chat autorizado: ${command.chatId || chatId}`);
          break;
          
        case 'deauthorize':
          await this.chatConfig.removeAuthorizedChat(command.chatId || chatId);
          await sendMessage(this.sock, chatId,
            `🚫 Chat desautorizado. Não vou mais responder aqui.`);
          logger.info(`🚫 Chat desautorizado: ${command.chatId || chatId}`);
          break;
          
        case 'status':
          const stats = this.memory.getStatistics();
          await sendMessage(this.sock, chatId, `
🤖 **Status do Bot**

📊 Estatísticas:
- Mensagens armazenadas: ${stats.totalMessages}
- Chats monitorados: ${stats.uniqueChats}
- Autorizado: ${this.chatConfig.isAuthorized(chatId) ? '✅ SIM' : '❌ NÃO'}

⚙️ IA:
- Modelo: Gemini 2.5 Flash
- Status: 🟢 Pronto

🔋 Perfil:
- Tom de escrita: ${stats.userStyle.tone}
- Freq. de emojis: ${stats.userStyle.emojiFrequency}
`.trim());
          break;
          
        case 'relearn':
          await sendMessage(this.sock, chatId, '📊 Reaprendendo seu estilo...');
          await this.memory.analyzeUserStyle(true); // forçar reanálise
          await sendMessage(this.sock, chatId, '✅ Perfil atualizado!');
          break;
          
        default:
          await sendMessage(this.sock, chatId, 
            '❓ Comando não reconhecido. Comandos disponíveis: !authorize, !status, !relearn');
      }
    } catch (error) {
      logger.error('❌ Erro ao processar comando:', error);
      await sendMessage(this.sock, chatId, 
        '❌ Erro ao processar comando. Verifique os parâmetros.');
    }
  }

  async generateAndSendResponse(chatId, incomingMessage, sender) {
    const messageId = `${chatId}-${Date.now()}`;
    
    try {
      // Indicar que está digitando (opcional, economiza banda)
      // await this.sock.presenceSubscribe(chatId);
      // await this.sock.sendPresenceUpdate('composing', chatId);

      logger.info(`🤖 Gerando resposta para: ${sender}`);

      // Buscar histórico recente
      const recentMessages = this.memory.getRecentMessages(chatId, 10);
      
      // Obter perfil de estilo
      const userStyle = this.memory.getUserStyle();
      
      // Formatar histórico para Gemini
      const conversationHistory = this.formatHistoryForGemini(recentMessages);

      // Gerar resposta com Gemini
      const response = await this.geminiAI.generateResponse(
        incomingMessage,
        conversationHistory,
        userStyle,
        chatId
      );

      if (!response) {
        logger.warn('⚠️ Gemini retornou resposta vazia');
        return;
      }

      // Aplicar delay realista (2-4 segundos)
      const delay = 2000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Enviar resposta
      await sendMessage(this.sock, chatId, response);
      
      logger.info(`✅ Resposta enviada para ${chatId}`);

      // Salvar resposta gerada no histórico (para continuar aprendendo)
      this.memory.saveMessage(chatId, 'bot', response, true, Date.now());

    } catch (error) {
      logger.error('❌ Erro ao gerar resposta:', error);
      
      // Enviar mensagem de erro (silencioso, sem expor detalhes técnicos)
      try {
        await sendMessage(this.sock, chatId, 
          '⚠️ Desculpa, tive um problema ao processar sua mensagem. Tenta de novo?');
      } catch (sendError) {
        logger.error('❌ Erro ao enviar mensagem de erro:', sendError);
      }
    }
  }

  formatHistoryForGemini(messages) {
    return messages.map(msg => ({
      role: msg.is_from_me === 1 ? 'model' : 'user',
      parts: [{ text: msg.message }]
    }));
  }
}
```

---

### 4️⃣ GEMINI AI ENGINE - Integração com Google Gemini

**Arquivo:** `src/ai/gemini.js`

**Especificações do Modelo Gemini 2.5 Flash:**

| Característica | Valor |
|---|---|
| **Nome do Modelo** | `gemini-2.5-flash` |
| **Contexto Máximo** | 1.048.576 tokens (~800K palavras) |
| **Output Máximo** | 65.536 tokens |
| **Latência** | ~0.5-2 segundos por request |
| **Custo** | ~50% mais barato que Pro |
| **Melhores casos de uso** | Conversação, processamento em lote, latência baixa |
| **Suporte a mídias** | Texto, imagens, vídeo, áudio |
| **Knowledge cutoff** | Janeiro 2025 |

**Código Implementação:**

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import { PromptBuilder } from './promptBuilder.js';

export class GeminiAI {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não definida em .env');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.85, // Um pouco criativo mas consistente
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500, // Limite para respostas de WhatsApp
        stopSequences: ['Human:', 'Assistant:'], // Parar em padrões específicos
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });
    
    this.promptBuilder = new PromptBuilder();
    this.callCount = 0;
    this.lastCallTime = 0;
    this.requestsPerMinute = 60; // Rate limit: 60 req/min
  }

  async generateResponse(
    currentMessage,
    conversationHistory,
    userStyle,
    chatId
  ) {
    try {
      // ============ RATE LIMITING ============
      await this.checkRateLimit();
      
      this.callCount++;
      logger.debug(`📤 Chamada Gemini #${this.callCount}`);

      // ============ CONSTRUIR PROMPT PERSONALIZADO ============
      const systemPrompt = this.promptBuilder.buildSystemPrompt(userStyle, chatId);
      
      const formattedHistory = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: currentMessage }]
        }
      ];

      // ============ CHAMAR GEMINI ============
      const chat = this.model.startChat({
        history: formattedHistory,
        systemInstruction: systemPrompt,
      });

      const result = await chat.sendMessage('');
      
      if (!result || !result.response) {
        logger.warn('⚠️ Resposta vazia do Gemini');
        return null;
      }

      const responseText = result.response.text();
      
      if (!responseText) {
        logger.warn('⚠️ Texto de resposta vazio');
        return null;
      }

      // ============ PROCESSAR RESPOSTA ============
      const cleanedResponse = this.cleanResponse(responseText);
      
      logger.debug(`✅ Resposta gerada: ${cleanedResponse.substring(0, 80)}...`);

      return cleanedResponse;

    } catch (error) {
      // Tratar erros específicos da API
      if (error.message?.includes('RATE_LIMIT')) {
        logger.warn('⚠️ Rate limit atingido. Aguardando...');
        await this.delay(5000);
        return this.generateResponse(currentMessage, conversationHistory, userStyle, chatId);
      } else if (error.message?.includes('SAFETY')) {
        logger.warn('⚠️ Resposta bloqueada por filtros de segurança');
        return 'Desculpa, não consigo responder isso. 😅';
      } else if (error.message?.includes('INVALID_ARGUMENT')) {
        logger.error('❌ Argumento inválido enviado ao Gemini:', error);
        return null;
      } else if (error.message?.includes('UNAUTHENTICATED')) {
        logger.error('❌ Erro de autenticação com Gemini. Verifique GEMINI_API_KEY');
        return null;
      } else {
        logger.error('❌ Erro ao chamar Gemini:', error);
        throw error;
      }
    }
  }

  cleanResponse(text) {
    // Remover asteriscos de markdown (não suportado no WhatsApp plain text)
    let cleaned = text.replace(/\*\*/g, ''); // **bold** → bold
    cleaned = cleaned.replace(/\*/g, ''); // *italic* → italic
    
    // Remover URLs muito longas
    cleaned = cleaned.replace(
      /https?:\/\/[^\s]{50,}/g,
      '[link]'
    );
    
    // Limitar tamanho máximo
    if (cleaned.length > 4000) {
      cleaned = cleaned.substring(0, 3997) + '...';
    }
    
    return cleaned.trim();
  }

  async checkRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = (now - this.lastCallTime) / 1000; // em segundos
    const minSecondsBetweenCalls = 60 / this.requestsPerMinute;
    
    if (timeSinceLastCall < minSecondsBetweenCalls) {
      const waitTime = (minSecondsBetweenCalls - timeSinceLastCall) * 1000;
      logger.debug(`⏳ Rate limit: aguardando ${waitTime.toFixed(0)}ms`);
      await this.delay(waitTime);
    }
    
    this.lastCallTime = now;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos auxiliares para monitoramento
  getCallStats() {
    return {
      totalCalls: this.callCount,
      lastCallTime: new Date(this.lastCallTime).toISOString(),
    };
  }
}
```

---

### 5️⃣ PROMPT BUILDER - Construção Dinâmica de Prompts

**Arquivo:** `src/ai/promptBuilder.js`

**Estratégia de Prompting:**
- ✅ **System Instruction**: Defini o papel e personalidade
- ✅ **Few-Shot Learning**: Exemplos de estilo do usuário
- ✅ **Context Awareness**: Histórico de conversa incluído
- ✅ **Constraints**: Limites e restrições de formato
- ✅ **Persona Injection**: Estilo de escrita personalizado

**Código Implementação:**

```javascript
import logger from '../utils/logger.js';
import fs from 'fs';
import yaml from 'js-yaml';

export class PromptBuilder {
  constructor(promptsPath = './config/prompts.yaml') {
    this.promptTemplates = this.loadTemplates(promptsPath);
  }

  loadTemplates(path) {
    try {
      const content = fs.readFileSync(path, 'utf8');
      return yaml.load(content);
    } catch (error) {
      logger.warn(`⚠️ Arquivo de prompts não encontrado em ${path}, usando padrão`);
      return this.getDefaultTemplates();
    }
  }

  buildSystemPrompt(userStyle, chatId = null) {
    const basePrompt = `Você é um assistente que imita EXATAMENTE o padrão de conversação de uma pessoa específica.

=== INFORMAÇÕES CRÍTICAS SOBRE O ESTILO ===

**Tom de Voz:** ${userStyle.tone || 'casual, amigável'}
**Nível de Formalidade:** ${userStyle.formality || 'informal'}
**Comprimento Médio de Mensagens:** ${userStyle.avgLength || 100} caracteres
**Frequência de Emojis:** ${userStyle.emojiFrequency || 'moderada'} 
**Expressões Comuns Usadas:** ${(userStyle.commonPhrases || []).slice(0, 5).join(', ') || 'nenhuma específica'}

=== INSTRUÇÕES DE COMPORTAMENTO ===

1. **Responda como essa pessoa responderia**, não como um assistente de IA genérico
2. **Mantenha a naturalidade** - use as mesmas gírias, expressões e padrões gramaticais
3. **Respeite o comprimento** - se a pessoa responde com mensagens curtas, faça o mesmo
4. **Use emojis corretamente** - com a mesma frequência e contexto
5. **Adapte-se ao tema** - mude seu tom conforme necessário, mas mantendo a essência
6. **Seja conciso** - evite explicações longas ou formais desnecessárias

=== EXEMPLOS DE ESTILO (Few-Shot) ===

${this.buildFewShotExamples(userStyle)}

=== RESTRIÇÕES IMPORTANTES ===

- ❌ NÃO se identifique como IA ou assistente
- ❌ NÃO use markdown/formatação (WhatsApp não suporta bem)
- ❌ NÃO use asteriscos para destaque (**negrito**)
- ❌ NÃO faça discursos longos
- ❌ NÃO mude bruscamente de personalidade
- ✅ SIM, use a natureza conversa e informal
- ✅ SIM, responda de forma breve e direta
- ✅ SIM, use emojis apropriados
- ✅ SIM, seja autêntico ao estilo

=== CONTEXTO DO CHAT ===
${chatId ? `Chat ID: ${chatId}` : 'Conversação pessoal'}

Agora, responda a mensagem do usuário mantendo EXATAMENTE esse estilo:`;

    return basePrompt;
  }

  buildFewShotExamples(userStyle) {
    // Usar exemplos de mensagens do usuário se disponível
    if (userStyle.exampleMessages && userStyle.exampleMessages.length > 0) {
      return userStyle.exampleMessages
        .slice(0, 3)
        .map((msg, idx) => `Exemplo ${idx + 1}: "${msg}"`)
        .join('\n');
    }
    
    // Fallback baseado no tom
    const examples = {
      'casual': [
        'Opa, tudo certo?',
        'Blz, flw',
        'Ahahaha boa! 😂'
      ],
      'formal': [
        'Tudo bem? Tudo certo por aqui.',
        'Concordo com você, excelente ponto.',
        'Obrigado pela mensagem.'
      ],
      'entusiasmado': [
        'Que top demais! 🔥',
        'Amei isso cara!!!',
        'Muito legal mesmo 😎'
      ]
    };
    
    const selectedExamples = examples[userStyle.tone] || examples['casual'];
    return selectedExamples
      .map((msg, idx) => `Exemplo ${idx + 1}: "${msg}"`)
      .join('\n');
  }

  getDefaultTemplates() {
    return {
      system_instruction: 'Você é um assistente amigável',
      constraints: [
        'Respostas curtas (max 200 caracteres)',
        'Usar emojis apropriados',
        'Ser natural e conversacional'
      ]
    };
  }
}
```

**Arquivo de Prompts (YAML):**

```yaml
# config/prompts.yaml
system:
  base_personality: "assistente amigável que imita estilo de conversa"
  max_length: 500
  temperature: 0.85
  
constraints:
  - "Não se identifique como IA"
  - "Use a mesma linguagem coloquial"
  - "Evite markdown (WhatsApp não suporta)"
  - "Respeite o comprimento médio de mensagens"
  - "Use emojis com naturalidade"

tone_mapping:
  casual:
    examples: ["opa tudo", "blz", "ahahaha"]
    markers: ["informal", "gírias", "emojis frequentes"]
  formal:
    examples: ["tudo bem", "concordo", "obrigado"]
    markers: ["profissional", "sem gírias", "menos emojis"]
  entusiasmado:
    examples: ["que top", "amei", "muito legal"]
    markers: ["exclamações", "emojis alegres", "palavras positivas"]

response_format:
  min_length: 10
  max_length: 500
  include_emojis: true
  avoid_markdown: true
```

---

### 6️⃣ STYLE ANALYZER - Análise de Padrões de Escrita

**Arquivo:** `src/ai/styleAnalyzer.js`

**Objetivo:** Extrair características do estilo de escrita do usuário

**Métricas Analisadas:**

```javascript
{
  // Dados Básicos
  tone: "casual|formal|entusiasmado|neutro",
  formality: 0-1, // 0 = muito informal, 1 = muito formal
  
  // Comprimento
  avgLength: 150, // caracteres médios por mensagem
  minLength: 10,
  maxLength: 500,
  
  // Emojis
  emojiFrequency: 0.45, // 0-1, percentual de mensagens com emojis
  favoriteEmojis: ["😂", "❤️", "😎"],
  
  // Linguagem
  commonPhrases: ["opa", "blz", "tá bom"],
  commonWords: ["tipo", "sabe", "coisa"],
  usesPunctuation: true,
  avgPunctuation: 1.2, // pontuações por mensagem
  
  // Gírias
  useSlang: true,
  slangPercentage: 0.25,
  
  // Exemplo de mensagens representativas
  exampleMessages: ["msg1", "msg2", "msg3"],
  
  // Metadata
  totalMessagesAnalyzed: 150,
  lastUpdated: "2025-10-28T15:30:00Z"
}
```

**Código Implementação:**

```javascript
import logger from '../utils/logger.js';

export class StyleAnalyzer {
  constructor(db) {
    this.db = db;
    this.emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    this.commonSlang = {
      'tá': 'informal',
      'opa': 'casual',
      'blz': 'casual',
      'tmj': 'very_casual',
      'flw': 'very_casual',
      'vlw': 'casual',
      'tipo': 'casual',
      'sabe': 'casual',
      'tipo assim': 'casual',
      'tipo o que': 'very_casual'
    };
  }

  async analyzeUserStyle(forceReanalyze = false) {
    try {
      // Buscar mensagens próprias
      const userMessages = this.db.prepare(`
        SELECT message FROM messages 
        WHERE is_from_me = 1 
        ORDER BY timestamp DESC 
        LIMIT 200
      `).all();

      if (userMessages.length < 10) {
        logger.info('⚠️ Poucos dados para análise (< 10 mensagens)');
        return null;
      }

      const analysis = {
        // Análise de comprimento
        avgLength: this.calculateAvgLength(userMessages),
        minLength: Math.min(...userMessages.map(m => m.message.length)),
        maxLength: Math.max(...userMessages.map(m => m.message.length)),

        // Análise de emojis
        emojiFrequency: this.calculateEmojiFrequency(userMessages),
        favoriteEmojis: this.extractTopEmojis(userMessages, 5),

        // Análise de tom
        tone: this.detectTone(userMessages),
        formality: this.assessFormality(userMessages),

        // Análise de linguagem
        commonPhrases: this.extractCommonPhrases(userMessages),
        commonWords: this.extractCommonWords(userMessages),
        useSlang: this.detectSlang(userMessages),
        slangPercentage: this.calculateSlangPercentage(userMessages),

        // Análise de pontuação
        usesPunctuation: this.detectPunctuation(userMessages),
        avgPunctuation: this.calculateAvgPunctuation(userMessages),

        // Exemplos
        exampleMessages: userMessages
          .slice(0, 5)
          .map(m => m.message),

        // Metadata
        totalMessagesAnalyzed: userMessages.length,
        lastUpdated: new Date().toISOString()
      };

      // Salvar perfil no banco
      this.saveUserProfile(analysis);
      logger.info('✅ Perfil de estilo atualizado com sucesso');

      return analysis;

    } catch (error) {
      logger.error('❌ Erro ao analisar estilo:', error);
      return null;
    }
  }

  calculateAvgLength(messages) {
    if (messages.length === 0) return 0;
    const total = messages.reduce((sum, msg) => sum + msg.message.length, 0);
    return Math.round(total / messages.length);
  }

  calculateEmojiFrequency(messages) {
    const withEmoji = messages.filter(m => this.emojiRegex.test(m.message)).length;
    return (withEmoji / messages.length).toFixed(2);
  }

  extractTopEmojis(messages, limit = 5) {
    const emojiCount = {};
    
    messages.forEach(msg => {
      const emojis = msg.message.match(this.emojiRegex) || [];
      emojis.forEach(emoji => {
        emojiCount[emoji] = (emojiCount[emoji] || 0) + 1;
      });
    });

    return Object.entries(emojiCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([emoji]) => emoji);
  }

  detectTone(messages) {
    const exclamations = messages.filter(m => m.message.includes('!')).length;
    const questions = messages.filter(m => m.message.includes('?')).length;
    const ellipsis = messages.filter(m => m.message.includes('...')).length;
    
    const exclamationRate = exclamations / messages.length;
    const questionRate = questions / messages.length;

    if (exclamationRate > 0.3) return 'entusiasmado';
    if (questionRate > 0.2) return 'curiosidade';
    if (ellipsis > messages.length * 0.2) return 'pensativo';
    
    return 'casual';
  }

  assessFormality(messages) {
    // Verificar uso de "Sr.", "Prezado", etc (formal)
    // Verificar uso de "blz", "tmj", etc (informal)
    
    let formalityScore = 0;
    const formalPhrases = ['prezado', 'atenciosamente', 'cordialmente', 'sr.', 'sra.'];
    const informalPhrases = ['blz', 'tmj', 'tmj!', 'opa', 'vlw', 'flw', 'tá bom'];

    messages.forEach(msg => {
      const lower = msg.message.toLowerCase();
      
      formalPhrases.forEach(phrase => {
        if (lower.includes(phrase)) formalityScore += 0.5;
      });
      
      informalPhrases.forEach(phrase => {
        if (lower.includes(phrase)) formalityScore -= 0.3;
      });
    });

    // Normalizar entre 0 e 1
    const avgScore = formalityScore / messages.length;
    return Math.max(0, Math.min(1, 0.5 + avgScore));
  }

  extractCommonPhrases(messages, limit = 10) {
    // Dividir mensagens em palavras
    const phrases = {};
    
    messages.forEach(msg => {
      // Expressions comuns (2-3 palavras)
      const words = msg.message.toLowerCase().split(/\s+/);
      
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (phrase.length > 4) {
          phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
      }
    });

    return Object.entries(phrases)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([phrase]) => phrase);
  }

  extractCommonWords(messages, limit = 20) {
    // Palavras muito comuns (stop words) serão filtradas
    const stopWords = new Set([
      'o', 'a', 'um', 'uma', 'os', 'as', 'e', 'é', 'ou', 'de',
      'que', 'pra', 'para', 'por', 'com', 'sem', 'em', 'na', 'no',
      'it', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at'
    ]);

    const wordCount = {};

    messages.forEach(msg => {
      const words = msg.message.toLowerCase().match(/\b\w+\b/g) || [];
      
      words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCount)
      .filter(([, count]) => count >= 3) // Aparecer pelo menos 3 vezes
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  detectSlang(messages) {
    let slangCount = 0;
    
    messages.forEach(msg => {
      const lower = msg.message.toLowerCase();
      Object.keys(this.commonSlang).forEach(slang => {
        if (lower.includes(slang)) slangCount++;
      });
    });

    return slangCount > 0;
  }

  calculateSlangPercentage(messages) {
    let slangMessages = 0;

    messages.forEach(msg => {
      const lower = msg.message.toLowerCase();
      const hasSlang = Object.keys(this.commonSlang).some(slang => 
        lower.includes(slang)
      );
      if (hasSlang) slangMessages++;
    });

    return (slangMessages / messages.length).toFixed(2);
  }

  detectPunctuation(messages) {
    const withPunctuation = messages.filter(m => 
      /[!?.;:-]/.test(m.message)
    ).length;
    
    return withPunctuation / messages.length > 0.5;
  }

  calculateAvgPunctuation(messages) {
    const total = messages.reduce((sum, msg) => {
      const matches = msg.message.match(/[!?.;:-]/g) || [];
      return sum + matches.length;
    }, 0);

    return (total / messages.length).toFixed(2);
  }

  saveUserProfile(profile) {
    const stmt = this.db.prepare(`
      UPDATE user_style 
      SET tone = ?, avg_length = ?, emoji_frequency = ?, 
          formality = ?, common_phrases = ?, updated_at = ?
      WHERE id = 1
    `);

    stmt.run(
      profile.tone,
      profile.avgLength,
      profile.emojiFrequency,
      profile.formality,
      JSON.stringify(profile.commonPhrases),
      Date.now()
    );

    logger.debug('💾 Perfil salvo no banco de dados');
  }
}
```

---

### 7️⃣ DATABASE - SQLite Setup e Gerenciamento

**Arquivo:** `src/database/db.js`

**Schema de Banco de Dados:**

```javascript
import { DatabaseSync } from 'node:sqlite';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

export function initializeDatabase(dbPath = './data/database.sqlite') {
  
  // Garantir que o diretório existe
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`📁 Diretório criado: ${dir}`);
  }

  // Conectar ao banco
  const db = new DatabaseSync(dbPath);
  logger.info(`🗄️ Conectado ao banco de dados: ${dbPath}`);

  // Criar tabelas
  db.exec(`
    ===============================================
    TABELA 1: MENSAGENS
    ===============================================
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      is_from_me INTEGER NOT NULL,
      message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'audio', etc
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_is_from_me ON messages(is_from_me);

    ===============================================
    TABELA 2: PERFIL DO USUÁRIO
    ===============================================
    CREATE TABLE IF NOT EXISTS user_style (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      tone TEXT DEFAULT 'casual',
      avg_length INTEGER DEFAULT 100,
      emoji_frequency REAL DEFAULT 0.5,
      formality REAL DEFAULT 0.3,
      common_phrases TEXT DEFAULT '[]',
      common_words TEXT DEFAULT '[]',
      favorite_emojis TEXT DEFAULT '[]',
      use_slang INTEGER DEFAULT 1,
      example_messages TEXT DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );

    ===============================================
    TABELA 3: CONTEXTO DE CONVERSAS
    ===============================================
    CREATE TABLE IF NOT EXISTS conversation_context (
      chat_id TEXT PRIMARY KEY,
      last_context_summary TEXT,
      last_10_messages TEXT DEFAULT '[]',
      conversation_theme TEXT,
      last_updated INTEGER NOT NULL
    );

    ===============================================
    TABELA 4: CHATS AUTORIZADOS
    ===============================================
    CREATE TABLE IF NOT EXISTS authorized_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT UNIQUE NOT NULL,
      is_group INTEGER DEFAULT 0,
      group_name TEXT,
      authorized_at INTEGER NOT NULL,
      auto_response_enabled INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_auth_chatid ON authorized_chats(chat_id);

    ===============================================
    TABELA 5: HISTÓRICO DE ANÁLISES
    ===============================================
    CREATE TABLE IF NOT EXISTS analysis_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    ===============================================
    TABELA 6: ESTATÍSTICAS
    ===============================================
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_messages INTEGER DEFAULT 0,
      total_responses INTEGER DEFAULT 0,
      unique_chats INTEGER DEFAULT 0,
      last_analyzed INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  logger.info('✅ Tabelas do banco de dados criadas/verificadas');

  // Inserir valores padrão se não existirem
  const checkStyle = db.prepare('SELECT COUNT(*) as count FROM user_style').get();
  if (checkStyle.count === 0) {
    db.prepare(`
      INSERT INTO user_style (id, updated_at) 
      VALUES (1, ?)
    `).run(Date.now());
    logger.info('📝 Perfil padrão criado');
  }

  const checkStats = db.prepare('SELECT COUNT(*) as count FROM statistics').get();
  if (checkStats.count === 0) {
    db.prepare(`
      INSERT INTO statistics (id, created_at) 
      VALUES (1, ?)
    `).run(Date.now());
    logger.info('📊 Estatísticas padrão criadas');
  }

  return db;
}

export function backupDatabase(dbPath, backupDir = './backups') {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `database-${timestamp}.sqlite`);
    
    fs.copyFileSync(dbPath, backupPath);
    logger.info(`💾 Backup criado: ${backupPath}`);

    // Manter apenas últimos 5 backups
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('database-'))
      .sort()
      .reverse();
    
    if (files.length > 5) {
      files.slice(5).forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
      });
      logger.debug(`🗑️ Backups antigos removidos`);
    }

  } catch (error) {
    logger.error('❌ Erro ao fazer backup:', error);
  }
}
```

---

### 8️⃣ MEMORY SYSTEM - Gerenciamento de Conversas

**Arquivo:** `src/memory/conversationMemory.js`

```javascript
import logger from '../utils/logger.js';

export class ConversationMemory {
  constructor(db) {
    this.db = db;
    this.conversationCache = new Map(); // Cache em memória
    this.MAX_CACHE_SIZE = 100;
  }

  saveMessage(chatId, sender, message, isFromMe = false, timestamp = null) {
    try {
      timestamp = timestamp || Date.now();

      const stmt = this.db.prepare(`
        INSERT INTO messages (chat_id, sender, message, timestamp, is_from_me)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(chatId, sender, message, timestamp, isFromMe ? 1 : 0);

      // Atualizar cache
      if (!this.conversationCache.has(chatId)) {
        this.conversationCache.set(chatId, []);
      }

      const cache = this.conversationCache.get(chatId);
      cache.push({ sender, message, timestamp, isFromMe });

      // Limitar tamanho do cache
      if (cache.length > 50) {
        cache.shift();
      }

      logger.debug(`💾 Mensagem salva para ${chatId}`);

    } catch (error) {
      logger.error('❌ Erro ao salvar mensagem:', error);
    }
  }

  getRecentMessages(chatId, limit = 10) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM messages 
        WHERE chat_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);

      const messages = stmt.all(chatId, limit);
      return messages.reverse(); // Ordem cronológica

    } catch (error) {
      logger.error('❌ Erro ao buscar mensagens:', error);
      return [];
    }
  }

  getContextSummary(chatId) {
    try {
      const stmt = this.db.prepare(`
        SELECT last_context_summary, conversation_theme 
        FROM conversation_context 
        WHERE chat_id = ?
      `);

      return stmt.get(chatId);

    } catch (error) {
      logger.error('❌ Erro ao buscar contexto:', error);
      return null;
    }
  }

  updateContextSummary(chatId, summary, theme = null) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO conversation_context 
        (chat_id, last_context_summary, conversation_theme, last_updated)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET
        last_context_summary = excluded.last_context_summary,
        conversation_theme = excluded.conversation_theme,
        last_updated = excluded.last_updated
      `);

      stmt.run(chatId, summary, theme, Date.now());
      logger.debug(`📝 Contexto atualizado para ${chatId}`);

    } catch (error) {
      logger.error('❌ Erro ao atualizar contexto:', error);
    }
  }

  getUserStyle() {
    try {
      const stmt = this.db.prepare(`SELECT * FROM user_style WHERE id = 1`);
      const style = stmt.get();

      if (!style) return this.getDefaultStyle();

      return {
        tone: style.tone,
        avgLength: style.avg_length,
        emojiFrequency: style.emoji_frequency,
        formality: style.formality,
        commonPhrases: JSON.parse(style.common_phrases || '[]'),
        commonWords: JSON.parse(style.common_words || '[]'),
        favoriteEmojis: JSON.parse(style.favorite_emojis || '[]'),
        useSlang: style.use_slang === 1,
        exampleMessages: JSON.parse(style.example_messages || '[]'),
      };

    } catch (error) {
      logger.error('❌ Erro ao obter estilo:', error);
      return this.getDefaultStyle();
    }
  }

  getDefaultStyle() {
    return {
      tone: 'casual',
      avgLength: 100,
      emojiFrequency: 0.5,
      formality: 0.3,
      commonPhrases: [],
      commonWords: [],
      favoriteEmojis: [],
      useSlang: true,
      exampleMessages: [],
    };
  }

  analyzeUserStyle(forceReanalyze = false) {
    // Delegado ao StyleAnalyzer
    // Apenas placeholder aqui
    logger.debug('📊 Análise de estilo iniciada');
  }

  getStatistics() {
    try {
      const messages = this.db.prepare(`
        SELECT COUNT(DISTINCT chat_id) as unique_chats, COUNT(*) as total
        FROM messages WHERE is_from_me = 0
      `).get();

      const style = this.getUserStyle();

      return {
        totalMessages: messages.total || 0,
        uniqueChats: messages.unique_chats || 0,
        userStyle: style
      };

    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalMessages: 0,
        uniqueChats: 0,
        userStyle: this.getDefaultStyle()
      };
    }
  }

  getOwnMessageCount() {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count FROM messages WHERE is_from_me = 1
      `).get();
      return result.count || 0;
    } catch (error) {
      return 0;
    }
  }

  getLastStyleAnalysis() {
    try {
      const result = this.db.prepare(`
        SELECT updated_at FROM user_style WHERE id = 1
      `).get();
      return result?.updated_at || 0;
    } catch (error) {
      return 0;
    }
  }

  clearOldMessages(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const stmt = this.db.prepare(`
        DELETE FROM messages WHERE timestamp < ?
      `);

      const result = stmt.run(cutoffTime);
      logger.info(`🗑️ ${result.changes} mensagens antigas removidas`);

    } catch (error) {
      logger.error('❌ Erro ao limpar mensagens:', error);
    }
  }
}
```

---

### 9️⃣ CHAT CONFIG - Gerenciamento de Autorizações

**Arquivo:** `src/database/chatConfig.js`

**Este é um dos arquivos MAIS CRÍTICOS - Controla quais chats podem ser respondidos**

```javascript
import fs from 'fs';
import logger from '../utils/logger.js';

export class ChatConfigManager {
  constructor(configPath = './config/chats.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
    logger.info(`⚙️ Configuração de chats carregada: ${configPath}`);
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        logger.warn(`⚠️ Arquivo de config não encontrado: ${this.configPath}`);
        logger.info('📝 Criando configuração padrão...');
        
        const defaultConfig = this.getDefaultConfig();
        this.saveConfig(defaultConfig);
        return defaultConfig;
      }

      const content = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      return parsed;

    } catch (error) {
      logger.error('❌ Erro ao carregar config:', error);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      enabled: true,
      authorizedChats: [], // Chats pessoais: "5511999999999@s.whatsapp.net"
      authorizedGroups: [], // Grupos: "123456789-1234567890@g.us"
      blacklist: [], // Completamente bloqueados
      settings: {
        respondToAll: false, // Se true, responde a TODOS os chats (perigo!)
        onlyMentions: false, // Responder apenas quando mencionado
        autoLearn: true, // Aprender com próprias mensagens
        responseDelay: 2000, // Delay realista em ms
        maxResponseLength: 500, // Máximo caracteres por resposta
        autoLearningInterval: 3600000, // Reanalisar a cada 1 hora
      },
      _info: {
        lastUpdated: new Date().toISOString(),
        description: "⚙️ Configure aqui quais chats e grupos o bot pode responder"
      }
    };
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
      
      this.config = config;
      logger.info('💾 Configuração salva com sucesso');

    } catch (error) {
      logger.error('❌ Erro ao salvar configuração:', error);
      throw error;
    }
  }

  isAuthorized(chatId) {
    // Verificar se está na blacklist (prioridade máxima)
    if (this.config.blacklist.includes(chatId)) {
      logger.debug(`🚫 Chat em blacklist: ${chatId}`);
      return false;
    }

    // Se respondToAll está ativado e não está em blacklist
    if (this.config.settings.respondToAll) {
      return true;
    }

    // Verificar se é grupo ou chat pessoal
    const isGroup = chatId.endsWith('@g.us');

    if (isGroup) {
      return this.config.authorizedGroups.includes(chatId);
    } else {
      return this.config.authorizedChats.includes(chatId);
    }
  }

  addAuthorizedChat(chatId, isGroup = false) {
    try {
      const list = isGroup ? 'authorizedGroups' : 'authorizedChats';

      if (!this.config[list].includes(chatId)) {
        this.config[list].push(chatId);
        this.saveConfig(this.config);
        
        logger.info(`✅ Chat autorizado: ${chatId}`);
        return true;
      }

      logger.debug(`⚠️ Chat já estava autorizado: ${chatId}`);
      return false;

    } catch (error) {
      logger.error('❌ Erro ao autorizar chat:', error);
      return false;
    }
  }

  removeAuthorizedChat(chatId) {
    try {
      const chatIndex = this.config.authorizedChats.indexOf(chatId);
      const groupIndex = this.config.authorizedGroups.indexOf(chatId);

      if (chatIndex !== -1) {
        this.config.authorizedChats.splice(chatIndex, 1);
      } else if (groupIndex !== -1) {
        this.config.authorizedGroups.splice(groupIndex, 1);
      } else {
        logger.debug(`⚠️ Chat não estava autorizado: ${chatId}`);
        return false;
      }

      this.saveConfig(this.config);
      logger.info(`🚫 Chat desautorizado: ${chatId}`);
      return true;

    } catch (error) {
      logger.error('❌ Erro ao desautorizar chat:', error);
      return false;
    }
  }

  addToBlacklist(chatId) {
    try {
      if (!this.config.blacklist.includes(chatId)) {
        this.config.blacklist.push(chatId);
        
        // Remover de listas autorizadas
        this.removeAuthorizedChat(chatId);
        
        this.saveConfig(this.config);
        logger.info(`🛑 Chat adicionado à blacklist: ${chatId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('❌ Erro ao adicionar à blacklist:', error);
      return false;
    }
  }

  removeFromBlacklist(chatId) {
    try {
      const index = this.config.blacklist.indexOf(chatId);
      if (index !== -1) {
        this.config.blacklist.splice(index, 1);
        this.saveConfig(this.config);
        logger.info(`✅ Chat removido da blacklist: ${chatId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('❌ Erro ao remover da blacklist:', error);
      return false;
    }
  }

  listAuthorizedChats() {
    return {
      authorizedChats: this.config.authorizedChats,
      authorizedGroups: this.config.authorizedGroups,
      blacklist: this.config.blacklist,
      respondToAll: this.config.settings.respondToAll,
      totalAuthorized: this.config.authorizedChats.length + this.config.authorizedGroups.length
    };
  }

  updateSettings(newSettings) {
    try {
      this.config.settings = {
        ...this.config.settings,
        ...newSettings
      };
      this.saveConfig(this.config);
      logger.info('⚙️ Configurações atualizadas');
      return true;
    } catch (error) {
      logger.error('❌ Erro ao atualizar configurações:', error);
      return false;
    }
  }
}
```

---

### 🔟 ARQUIVO CONFIG/CHATS.JSON

**Este é o arquivo que o usuário EDITA para permitir/bloquear chats**

```json
{
  "enabled": true,
  "authorizedChats": [
    "5511987654321@s.whatsapp.net",
    "5511999999999@s.whatsapp.net"
  ],
  "authorizedGroups": [
    "120363123456789-1234567890@g.us",
    "120363987654321-0987654321@g.us"
  ],
  "blacklist": [
    "55119911111111@s.whatsapp.net"
  ],
  "settings": {
    "respondToAll": false,
    "onlyMentions": false,
    "autoLearn": true,
    "responseDelay": 2000,
    "maxResponseLength": 500,
    "autoLearningInterval": 3600000
  },
  "_info": {
    "lastUpdated": "2025-10-28T15:30:00Z",
    "description": "⚙️ Configure aqui quais chats e grupos o bot pode responder",
    "_howToUse": {
      "authorizedChats": "IDs de chats pessoais (formato: '5511999999999@s.whatsapp.net')",
      "authorizedGroups": "IDs de grupos (formato: '120363...-..@g.us')",
      "blacklist": "Chats completamente bloqueados",
      "respondToAll": "Se true, responde TODOS os chats (cuidado!)",
      "responseDelay": "Delay realista entre receber e responder (2-4 segundos)"
    },
    "_examples": {
      "findChatId": "Envie !status para ver seu ID do chat",
      "findGroupId": "Envie !status em um grupo para ver o ID"
    }
  }
}
```

---

### 1️⃣1️⃣ LOGGER SYSTEM

**Arquivo:** `src/utils/logger.js`

```javascript
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: [
      {
        level: 'debug',
        target: 'pino/file',
        options: {
          destination: path.join(logsDir, 'combined.log'),
          mkdir: true,
        },
      },
      {
        level: 'error',
        target: 'pino/file',
        options: {
          destination: path.join(logsDir, 'error.log'),
          mkdir: true,
        },
      },
      {
        level: 'info',
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    ],
  },
});

export default logger;
```

---

### 1️⃣2️⃣ PACKAGE.JSON

```json
{
  "name": "whatsapp-ai-bot",
  "version": "1.0.0",
  "description": "Bot de WhatsApp com IA personalizada que aprende seu padrão de resposta",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop whatsapp-ai-bot",
    "pm2:restart": "pm2 restart whatsapp-ai-bot",
    "pm2:logs": "pm2 logs whatsapp-ai-bot",
    "pm2:monit": "pm2 monit",
    "db:backup": "node scripts/backup-db.js",
    "db:clean": "node scripts/clean-old-messages.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "whatsapp",
    "bot",
    "ia",
    "gemini",
    "baileys",
    "nodejs"
  ],
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@hapi/boom": "^10.0.1",
    "@whiskeysockets/baileys": "^6.7.0",
    "dotenv": "^16.4.5",
    "js-yaml": "^4.1.0",
    "pino": "^9.5.0",
    "pino-pretty": "^11.2.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.7",
    "pm2": "^5.4.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

### 1️⃣3️⃣ ECOSYSTEM.CONFIG.JS - PM2 Configuration

```javascript
module.exports = {
  apps: [
    {
      name: 'whatsapp-ai-bot',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
      
      // Reinicialização automática
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      
      // Limites de memória
      max_memory_restart: '500M',
      
      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Retry/restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // Graceful shutdown
      wait_ready: true,
      kill_timeout: 10000,
      
      // Merge logs
      merge_logs: true,
    },
  ],
};
```

---

### 1️⃣4️⃣ .ENV EXAMPLE

```bash
# ===== GOOGLE GEMINI API =====
GEMINI_API_KEY=seu_api_key_aqui_https://ai.google.dev

# ===== AMBIENTE =====
NODE_ENV=production
LOG_LEVEL=info

# ===== PATHS =====
DB_PATH=./data/database.sqlite
CHATS_CONFIG_PATH=./config/chats.json

# ===== WHATSAPP =====
WHATSAPP_BROWSER_NAME=WhatsApp AI Bot

# ===== IA SETTINGS =====
AI_TEMPERATURE=0.85
AI_MAX_TOKENS=500
AI_TOP_K=40
AI_TOP_P=0.95

# ===== BOT SETTINGS =====
BOT_RESPONSE_DELAY=2000
BOT_AUTO_LEARN=true
BOT_LEARNING_INTERVAL=3600000

# ===== RATE LIMITING =====
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

---

## 🎯 Guia de Implementação Passo a Passo

### **Fase 1: Setup Inicial**

```bash
# 1. Criar pasta do projeto
mkdir whatsapp-ai-bot && cd whatsapp-ai-bot

# 2. Inicializar Node.js
npm init -y

# 3. Instalar dependências
npm install \
  @whiskeysockets/baileys \
  @google/generative-ai \
  @hapi/boom \
  dotenv \
  js-yaml \
  pino \
  pino-pretty

# 4. Instalar dev dependencies
npm install --save-dev nodemon pm2

# 5. Copiar arquivo .env
cp .env.example .env
# ⭐ EDITAR .env e adicionar GEMINI_API_KEY

# 6. Criar estrutura de diretórios
mkdir -p src/{whatsapp,ai,database,memory,config,security,commands,utils}
mkdir -p config data/auth logs
```

### **Fase 2: Criar Arquivos Principais**

Copiar os códigos das seções anteriores para os respectivos arquivos:
- `src/index.js`
- `src/whatsapp/client.js`
- `src/whatsapp/messageHandler.js`
- `src/ai/gemini.js`
- `src/ai/promptBuilder.js`
- `src/ai/styleAnalyzer.js`
- `src/database/db.js`
- `src/database/chatConfig.js`
- `src/memory/conversationMemory.js`
- `src/utils/logger.js`
- `config/chats.json`
- `config/prompts.yaml`
- `.env`
- `ecosystem.config.js`
- `package.json`

### **Fase 3: Primeira Execução**

```bash
# 1. Executar bot
npm start

# 2. Ver QR Code no terminal
# Terminal exibe: "📲 Novo QR Code gerado..."

# 3. Escanear QR no WhatsApp
# WhatsApp → Dispositivos Conectados → Conectar Dispositivo

# 4. Aguardar conexão
# Terminal exibe: "✅ Conectado ao WhatsApp com sucesso!"

# 5. Enviar mensagem própria via WhatsApp
# Para começar a registrar seu padrão de escrita

# 6. Parar bot (CTRL+C)
```

### **Fase 4: Configurar Chats Autorizados**

**Opção A: Via Comando (Recomendado)**
```
1. Envie mensagem no chat/grupo que deseja autorizar
2. Digite: !authorize
3. Bot responde: "✅ Chat autorizado!"
```

**Opção B: Editar arquivo manualmente**
```json
{
  "authorizedChats": [
    "5511999999999@s.whatsapp.net"
  ],
  "authorizedGroups": [
    "123456789-1234567890@g.us"
  ]
}
```

### **Fase 5: Rodar em Background (PM2)**

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Iniciar bot com PM2
pm2 start ecosystem.config.js

# 3. Ver logs em tempo real
pm2 logs whatsapp-ai-bot

# 4. Ver status
pm2 status

# 5. Monitoramento
pm2 monit

# 6. Auto-start no boot
pm2 startup
pm2 save

# 7. Comandos úteis
pm2 stop whatsapp-ai-bot      # Parar
pm2 restart whatsapp-ai-bot   # Reiniciar
pm2 delete whatsapp-ai-bot    # Remover
```

---

## 📊 Fluxo Completo de Funcionamento

```
┌─────────────────────────────────────────────────────────────┐
│ USER ENVIA MENSAGEM PELO WHATSAPP                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │ Baileys intercepta       │
        │ a mensagem              │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────────┐
        │ MessageHandler processa       │
        │ - Extrai conteúdo             │
        │ - Valida formato              │
        └────────────┬──────────────────┘
                     │
        ┌────────────▼──────────────────┐
        │ Salva para aprendizado        │
        │ (ConversationMemory)          │
        └────────────┬──────────────────┘
                     │
          ┌──────────▼──────────┐
          │ É mensagem própria? │
          └──────────┬──────────┘
                     │
          ┌──────────┴──────────────┐
          │ SIM                 NÃO │
          │                         │
          ▼                         ▼
      ┌────────────┐         ┌─────────────────┐
      │Atualizar   │         │Verificar        │
      │perfil de   │         │autorização do   │
      │estilo      │         │chat             │
      │(análise)   │         │(chatConfig)     │
      └────────────┘         └────────┬────────┘
                                      │
                              ┌───────▼────────┐
                              │ Chat autorizado?
                              └───────┬────────┘
                                      │
                          ┌───────────┴───────────┐
                          │ NÃO                  SIM
                          │                       │
                          ▼                       ▼
                      ┌────────┐         ┌──────────────────┐
                      │Ignorar │         │Verificar se é    │
                      │        │         │comando admin     │
                      └────────┘         │(starts with !)   │
                                         └──────┬───────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    │ SIM            NÃO    │
                                    │                       │
                                    ▼                       ▼
                            ┌────────────────┐   ┌──────────────────┐
                            │Executar comando│   │Buscar histórico  │
                            │(!authorize,    │   │de conversa (10   │
                            │!status, etc)   │   │mensagens)        │
                            └────────────────┘   └────────┬─────────┘
                                                          │
                                                ┌─────────▼────────┐
                                                │Obter perfil de   │
                                                │estilo do usuário │
                                                │(getUserStyle)    │
                                                └────────┬─────────┘
                                                         │
                                                ┌────────▼─────────┐
                                                │PromptBuilder     │
                                                │monta sistema     │
                                                │instruction com:  │
                                                │ - Estilo         │
                                                │ - Contexto       │
                                                │ - Exemplos       │
                                                └────────┬─────────┘
                                                         │
                                                ┌────────▼──────────┐
                                                │ Chamar Gemini API │
                                                │ com prompt        │
                                                └────────┬──────────┘
                                                         │
                                       ┌─────────────────▼──────────────────┐
                                       │ Gemini retorna resposta             │
                                       │ (personagem no estilo do usuário)   │
                                       └─────────────────┬──────────────────┘
                                                         │
                                                ┌────────▼────────────┐
                                                │ Limpar resposta     │
                                                │ (remover markdown,  │
                                                │  truncar se > 500c) │
                                                └────────┬────────────┘
                                                         │
                                                ┌────────▼──────────┐
                                                │ Aplicar delay      │
                                                │ realista (2-4s)    │
                                                └────────┬───────────┘
                                                         │
                                                ┌────────▼───────────┐
                                                │ Enviar resposta via │
                                                │ Baileys para chat   │
                                                └────────┬────────────┘
                                                         │
                                                ┌────────▼──────────┐
                                                │ Salvar resposta no │
                                                │ histórico (para    │
                                                │ continuar learning)│
                                                └────────────────────┘
```

---

## 🔒 Segurança e Best Practices

### **Proteção de Dados Sensíveis**

| Arquivo | Contém | Ação |
|---------|--------|------|
| `.env` | API Keys | ❌ NUNCA commitar |
| `.gitignore` | Règras de exclusão | ✅ Commitar |
| `data/auth/` | Credenciais WhatsApp | ❌ NUNCA commitar |
| `data/database.sqlite` | Histórico de mensagens | ❌ NUNCA commitar |
| `logs/` | Arquivos de log | ❌ NUNCA commitar |

**`.gitignore` Recomendado:**
```
.env
.env.local
data/auth/
data/database.sqlite
data/backups/
logs/
node_modules/
*.log
.DS_Store
```

### **Rate Limiting**

```javascript
// Evitar bloquear da API do Gemini
- Máximo: 60 requisições por minuto
- Implementado em: GeminiAI.checkRateLimit()
- Delay automático entre chamadas
```

### **Autenticação WhatsApp**

```javascript
// Usar Linked Devices (seguro)
- ✅ Não requer login/senha
- ✅ Sessão salva em ./data/auth/
- ✅ Reconexão automática
- ✅ Compatível com autenticação 2FA
```

---

## 🛠️ Troubleshooting e FAQs

### **❌ "QR Code não aparecendo"**
```bash
# Solução 1: Verificar se está no terminal correto
# (alguns IDEs não exibem bem - usar terminal nativo)

# Solução 2: Limpar cache e reiniciar
rm -rf ./data/auth
npm start

# Solução 3: Verificar Node.js v18+
node --version
```

### **❌ "Erro de autenticação do Gemini"**
```bash
# Solução 1: Verificar API key
# 1. Abrir https://ai.google.dev
# 2. Criar novo projeto
# 3. Copiar API key
# 4. Adicionar em .env

# Solução 2: Verificar acesso da API
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

### **❌ "Bot não responde mensagens"**
```bash
# Verificar:
1. Chat está autorizado? (!status no chat)
2. Perfil de estilo foi criado? (envie suas mensagens)
3. Logs mostram erro? (pm2 logs whatsapp-ai-bot)
4. Gemini API funcionando? (teste manualmente)
```

### **❌ "Memória crescendo indefinidamente"**
```bash
# Adicionar rotina de limpeza:

// Em: src/index.js
setInterval(() => {
  memory.clearOldMessages(30); // Limpar > 30 dias
}, 24 * 60 * 60 * 1000); // A cada 24h

// Ou usar script manual:
npm run db:clean
```

---

## 📈 Melhorias Futuras (Roadmap)

### **Phase 2: Avançado**
- [ ] Interface web para gerenciar chats/configs
- [ ] Dashboard com estatísticas
- [ ] Suporte a respostas com mídia (imagens, áudio)
- [ ] Detecção de contexto (urgência, sentimento)
- [ ] Multi-perfil (diferentes personalidades)

### **Phase 3: IA Avançada**
- [ ] Fine-tuning com dados do usuário
- [ ] Embeddings e busca semântica (RAG)
- [ ] Análise de sentimento
- [ ] Previsão de tipo de resposta esperado

### **Phase 4: Produção Enterprise**
- [ ] Suporte a bancos de dados remotos (PostgreSQL)
- [ ] Criptografia de dados sensíveis
- [ ] Auditoria e compliance
- [ ] Deploy em cloud (AWS, GCP, Azure)

---

## 📚 Referências e Documentação

### **Bibliotecas Principais**
- 📖 [Baileys Wiki](https://baileys.wiki/docs/intro)
- 📖 [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- 📖 [Pino Logger](https://getpino.io/)
- 📖 [PM2 Docs](https://pm2.keymetrics.io/docs)

### **WhatsApp Integration**
- 📖 [WhatsApp Web Multi-Device](https://faq.whatsapp.com/568130151347498)
- 📖 [Linked Devices Feature](https://faq.whatsapp.com/1177650757621327)

### **Best Practices**
- 📖 [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- 📖 [Prompt Engineering Guide](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- 📖 [Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)

---

## 📞 Suporte e Comunidades

- **GitHub Issues**: Para bugs e features
- **Stack Overflow**: Tag `[baileys]`, `[gemini-api]`
- **Discord**: Comunidades de Node.js e bots
- **Reddit**: `/r/node`, `/r/webdev`

---

## 📄 Licença

MIT License - Use livremente em projetos pessoais e comerciais

---

## 🎓 Conclusão

Este prompt fornece uma **arquitetura completa, robusta e escalável** para um bot de WhatsApp com IA personalizada. Segue as **melhores práticas** de:

✅ Modularidade e separação de responsabilidades  
✅ Segurança (API keys, dados sensíveis)  
✅ Performance (rate limiting, cache, otimização)  
✅ Manutenibilidade (logging, documentação, estrutura clara)  
✅ Escalabilidade (suporte a múltiplos chats, bancos remotos)  

**Tempo estimado de implementação:** 4-8 horas para um desenvolvedor com experiência Node.js

**Tecnologias mais recentes (2025):**
- Gemini 2.5 Flash (IA mais rápida do mercado)
- Baileys @whiskeysockets (mantido ativamente)
- Node.js SQLite nativo (sem dependências externas)

Bom desenvolvimento! 🚀