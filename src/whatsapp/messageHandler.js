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
    this.responseQueue = new Map();
  }

  async handleIncomingMessage(message) {
    try {
      logger.info('🔔 handleIncomingMessage chamado');
      
      // Validação básica
      if (!message.message) {
        logger.info('⚠️ Mensagem sem conteúdo, ignorando');
        return;
      }
      if (message.key.fromMe === undefined) {
        logger.info('⚠️ Mensagem sem key.fromMe, ignorando');
        return;
      }

      const chatId = message.key.remoteJid;
      const messageId = message.key.id;
      const isFromMe = message.key.fromMe;
      
      logger.info(`📍 ChatID: ${chatId}, MessageID: ${messageId}, FromMe: ${isFromMe}`);
      
      // Evitar processar mesma mensagem duas vezes
      if (this.responseQueue.has(messageId)) return;
      this.responseQueue.set(messageId, true);
      setTimeout(() => this.responseQueue.delete(messageId), 10000);

      // Extrair texto da mensagem
      const messageText = this.extractMessageText(message);
      if (!messageText) {
        logger.info('⚠️ Não foi possível extrair texto da mensagem, ignorando');
        return;
      }

      const sender = message.key.participant || chatId;
      const timestamp = message.messageTimestamp * 1000;

      logger.info(`📨 Mensagem recebida de [${chatId}]: ${messageText.substring(0, 50)}...`);

      // PASSO 1: Verificar Comandos PRIMEIRO (antes de tudo!)
      if (messageText.startsWith('!')) {
        logger.info(`⚙️ Comando detectado: ${messageText}`);
        await this.handleCommand(messageText, chatId, sender);
        return;
      }

      // PASSO 2: Salvar para Aprendizado
      this.memory.saveMessage(chatId, sender, messageText, isFromMe, timestamp);

      // PASSO 3: Se é mensagem própria
      if (isFromMe) {
        logger.info('📝 Mensagem própria salva para aprendizado');
        
        // Atualizar perfil de estilo periodicamente
        const lastAnalysis = this.memory.getLastStyleAnalysis();
        const timeSinceAnalysis = Date.now() - lastAnalysis;
        
        // Analisar a cada 50 mensagens ou 6 horas
        const messagesCount = this.memory.getOwnMessageCount();
        if (timeSinceAnalysis > 6 * 60 * 60 * 1000 || messagesCount % 50 === 0) {
          logger.info('📊 Atualizando perfil de estilo...');
          await this.memory.analyzeUserStyle();
        }
        
        return;
      }

      // PASSO 4: Verificar Autorização (para mensagens normais)
      if (!this.chatConfig.isAuthorized(chatId)) {
        logger.info(`🚫 Chat não autorizado: ${chatId}. Use !authorize para autorizar.`);
        return;
      }

      logger.info(`✅ Chat autorizado: ${chatId}`);

      // PASSO 5: Gerar e Enviar Resposta
      await this.generateAndSendResponse(chatId, messageText, sender);

    } catch (error) {
      logger.error('❌ Erro ao processar mensagem:', error);
    }
  }

  extractMessageText(message) {
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
      logger.info(`🎮 Executando comando: ${text}`);
      const command = this.commandParser.parse(text);
      logger.info(`📋 Comando parseado: ${JSON.stringify(command)}`);
      
      switch (command.type) {
        case 'authorize':
          const isGroup = chatId.endsWith('@g.us');
          logger.info(`🔧 Comando authorize - chatId: ${chatId}, isGroup: ${isGroup}`);
          await this.chatConfig.addAuthorizedChat(command.chatId || chatId, isGroup);
          await sendMessage(this.sock, chatId, 
            `✅ Chat autorizado! Agora vou responder mensagens aqui.\n\nID do chat: ${chatId}`);
          logger.info(`✅ Autorização concluída para: ${command.chatId || chatId}`);
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
- Modelo: Gemini 2.0 Flash
- Status: 🟢 Pronto

🔋 Perfil:
- Tom de escrita: ${stats.userStyle.tone}
- Freq. de emojis: ${stats.userStyle.emojiFrequency}
`.trim());
          break;
          
        case 'relearn':
          await sendMessage(this.sock, chatId, '📊 Reaprendendo seu estilo...');
          await this.memory.analyzeUserStyle(true);
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
    try {
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

      // Salvar resposta gerada no histórico
      this.memory.saveMessage(chatId, 'bot', response, true, Date.now());

    } catch (error) {
      logger.error('❌ Erro ao gerar resposta:', error);
      
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
