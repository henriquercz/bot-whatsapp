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
    // Sistema de agrupamento de mensagens
    this.messageBuffers = new Map(); // Buffer de mensagens por chatId
    this.messageTimers = new Map(); // Timers de debounce por chatId
    this.MESSAGE_GROUP_DELAY = 30000; // 30 segundos
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

      // PASSO 5: Adicionar mensagem ao buffer e agendar processamento
      this.addMessageToBuffer(chatId, messageText, sender, timestamp, message);

    } catch (error) {
      logger.error('❌ Erro ao processar mensagem:', error);
    }
  }

  addMessageToBuffer(chatId, messageText, sender, timestamp, originalMessage) {
    // Inicializar buffer se não existir
    if (!this.messageBuffers.has(chatId)) {
      this.messageBuffers.set(chatId, []);
    }

    // Adicionar mensagem ao buffer
    const buffer = this.messageBuffers.get(chatId);
    buffer.push({ text: messageText, sender, timestamp, originalMessage });
    logger.info(`📦 Mensagem adicionada ao buffer. Total no buffer: ${buffer.length}`);

    // Cancelar timer anterior se existir
    if (this.messageTimers.has(chatId)) {
      clearTimeout(this.messageTimers.get(chatId));
      logger.info(`⏱️ Timer anterior cancelado para ${chatId}`);
    }

    // Verificar se é contato especial para usar delay menor
    const specialContactInfo = this.chatConfig.getSpecialContactInfo(chatId);
    const delay = specialContactInfo ? 90000 : this.MESSAGE_GROUP_DELAY; // 15s para especiais, 30s para outros

    // Criar novo timer
    const timer = setTimeout(async () => {
      logger.info(`⏰ Timer disparado! Processando ${buffer.length} mensagens agrupadas de ${chatId}`);
      await this.processGroupedMessages(chatId);
    }, delay);

    this.messageTimers.set(chatId, timer);
    logger.info(`⏱️ Novo timer de ${delay/1000}s iniciado para ${chatId}${specialContactInfo ? ' (contato especial 💝)' : ''}`);
  }

  async processGroupedMessages(chatId) {
    try {
      const buffer = this.messageBuffers.get(chatId);
      if (!buffer || buffer.length === 0) {
        logger.warn(`⚠️ Buffer vazio para ${chatId}`);
        return;
      }

      // Agrupar textos das mensagens
      const groupedText = buffer.map((msg, index) => 
        `Mensagem ${index + 1}: "${msg.text}"`
      ).join('\n\n');

      logger.info(`🔄 Processando ${buffer.length} mensagens agrupadas de ${chatId}`);
      logger.info(`📝 Texto agrupado (preview): ${groupedText.substring(0, 200)}...`);

      // Pegar a última mensagem original para fazer reply
      const lastMessage = buffer[buffer.length - 1].originalMessage;

      // Processar com Gemini
      await this.generateAndSendResponse(chatId, groupedText, buffer[0].sender, lastMessage);

      // Limpar buffer e timer
      this.messageBuffers.delete(chatId);
      this.messageTimers.delete(chatId);
      logger.info(`✅ Buffer e timer limpos para ${chatId}`);

    } catch (error) {
      logger.error(`❌ Erro ao processar mensagens agrupadas de ${chatId}:`, error);
      // Limpar mesmo em caso de erro
      this.messageBuffers.delete(chatId);
      this.messageTimers.delete(chatId);
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

  async generateAndSendResponse(chatId, incomingMessage, sender, originalMessage = null) {
    try {
      logger.info(`🤖 Gerando resposta para: ${sender}`);
      logger.info(`📝 Mensagem recebida: ${incomingMessage}`);
      if (originalMessage) {
        logger.info(`💬 Mensagem original disponível para reply`);
      }

      // Verificar se é contato especial
      const specialContactInfo = this.chatConfig.getSpecialContactInfo(chatId);
      if (specialContactInfo) {
        logger.info(`💝 Contato especial detectado: ${specialContactInfo.type} (${specialContactInfo.name})`);
      }

      // Determinar se é grupo para limite de histórico
      const isGroup = chatId.includes('@g.us');
      const historyLimit = isGroup ? 10 : 5;
      
      // Buscar histórico recente (padrão: última 1 hora)
      // Para alterar janela temporal, adicione 3º parâmetro: getRecentMessages(chatId, limit, hours)
      logger.info(`📚 Buscando histórico recente (${isGroup ? 'grupo' : 'privado'}: ${historyLimit} mensagens)...`);
      const recentMessages = this.memory.getRecentMessages(chatId, historyLimit);
      logger.info(`📚 Histórico obtido: ${recentMessages.length} mensagens`);
      
      // Obter perfil de estilo
      logger.info('🎨 Obtendo perfil de estilo...');
      const userStyle = this.memory.getUserStyle();
      logger.info(`🎨 Perfil obtido: ${JSON.stringify(userStyle)}`);
      
      // Formatar histórico para Gemini
      logger.info('📋 Formatando histórico para Gemini...');
      const conversationHistory = this.formatHistoryForGemini(recentMessages);
      logger.info(`📋 Histórico formatado: ${conversationHistory.length} entradas`);

      // Gerar resposta com Gemini
      logger.info('🤖 Chamando Gemini AI...');
      const response = await this.geminiAI.generateResponse(
        incomingMessage,
        conversationHistory,
        userStyle,
        chatId,
        specialContactInfo
      );
      logger.info(`🤖 Resposta do Gemini: ${response?.substring(0, 50)}...`);

      if (!response) {
        logger.warn('⚠️ Gemini retornou resposta vazia');
        return;
      }

      // Aplicar delay realista e variável (1-5 segundos)
      // Mensagens mais longas = delay maior (simula digitação)
      const baseDelay = 1500;
      const lengthFactor = Math.min(response.length * 20, 3000); // até 3s extra
      const randomFactor = Math.random() * 1000;
      const delay = baseDelay + lengthFactor + randomFactor;
      
      logger.info(`⏱️ Aguardando ${Math.round(delay)}ms antes de responder (simulando digitação)...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Enviar resposta (com reply se tiver mensagem original)
      logger.info('📤 Enviando resposta...');
      await sendMessage(this.sock, chatId, response, originalMessage);
      
      logger.info(`✅ Resposta enviada para ${chatId}${originalMessage ? ' com reply' : ''}`);

      // Salvar resposta gerada no histórico
      logger.info('💾 Salvando resposta no histórico...');
      this.memory.saveMessage(chatId, 'bot', response, true, Date.now());
      logger.info('✅ Resposta salva no histórico');

    } catch (error) {
      logger.error('❌ Erro ao gerar resposta:', error);
      logger.error('❌ Stack trace:', error.stack);
      logger.error('❌ Tipo de erro:', error.name);
      logger.error('❌ Mensagem do erro:', error.message);
      
      // NÃO enviar mensagem de erro para o usuário
      // Deixar silencioso para parecer mais natural
      logger.info('💭 Erro silenciado - nenhuma resposta enviada ao usuário');
    }
  }

  formatHistoryForGemini(messages) {
    // Proteção contra array inválido
    if (!messages || !Array.isArray(messages)) {
      return [];
    }
    
    // Formatar histórico com diferenciação clara de remetentes
    return messages.map(msg => {
      const isMe = msg.is_from_me === 1;
      const sender = msg.sender || 'desconhecido';
      
      // Extrair últimos 4 dígitos do número para identificação
      const phoneMatch = sender.match(/(\d+)@/);
      const lastDigits = phoneMatch ? phoneMatch[1].slice(-4) : '????';
      
      return {
        sender: isMe ? 'você' : `pessoa (${lastDigits})`,
        message: msg.message,
        timestamp: msg.timestamp
      };
    });
  }
}
