import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import { PromptBuilder } from './promptBuilder.js';

export class GeminiAI {
  constructor(apiKey) {
    logger.info(`🔑 Verificando API Key do Gemini...`);
    logger.info(`🔑 API Key presente: ${apiKey ? 'SIM' : 'NÃO'}`);
    logger.info(`🔑 API Key length: ${apiKey?.length || 0}`);
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não definida em .env');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 500,
      },
    });
    logger.info(`🔑 Gemini 2.0 Flash Experimental inicializado`);
    
    this.promptBuilder = new PromptBuilder();
    this.callCount = 0;
    this.lastCallTime = 0;
    this.requestsPerMinute = 60;
  }

  async generateResponse(
    currentMessage,
    conversationHistory,
    userStyle,
    chatId
  ) {
    try {
      // Rate limiting
      await this.checkRateLimit();
      
      this.callCount++;
      logger.debug(`📤 Chamada Gemini #${this.callCount}`);

      // Construir prompt personalizado
      const systemPrompt = this.promptBuilder.buildSystemPrompt(userStyle, chatId);
      
      // Chamar Gemini
      logger.info('📞 Chamando Gemini 2.0 Flash Experimental...');
      logger.info(`📝 Current message: ${currentMessage}`);
      
      // Montar o prompt completo simples
      const fullPrompt = `${systemPrompt}\n\nUsuário disse: "${currentMessage}"\n\nSua resposta natural:`;
      
      logger.info('✅ Enviando para Gemini...');
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      logger.info('📨 Resposta recebida!');
      
      const responseText = response.text();
      
      if (!responseText) {
        logger.warn('⚠️ Resposta vazia do Gemini');
        return null;
      }

      logger.info('✅ Texto extraído com sucesso');
      
      if (!responseText) {
        logger.warn('⚠️ Texto de resposta vazio');
        return null;
      }

      // Processar resposta
      const cleanedResponse = this.cleanResponse(responseText);
      
      logger.debug(`✅ Resposta gerada: ${cleanedResponse.substring(0, 80)}...`);

      return cleanedResponse;

    } catch (error) {
      logger.error('═══════════ ERRO CAPTURADO ═══════════');
      logger.error('❌ Tipo do erro:', typeof error);
      logger.error('❌ Error object:', JSON.stringify(error, null, 2));
      logger.error('❌ Error.name:', error?.name);
      logger.error('❌ Error.message:', error?.message);
      logger.error('❌ Error.stack:', error?.stack);
      logger.error('❌ Error.toString():', error?.toString());
      logger.error('════════════════════════════════════════');
      
      // Tratar erros específicos da API
      if (error?.message?.includes('RATE_LIMIT')) {
        logger.warn('⚠️ Rate limit atingido. Aguardando...');
        await this.delay(5000);
        return this.generateResponse(currentMessage, conversationHistory, userStyle, chatId);
      } else if (error?.message?.includes('SAFETY')) {
        logger.warn('⚠️ Resposta bloqueada por filtros de segurança');
        return 'Desculpa, não consigo responder isso. 😅';
      } else if (error?.message?.includes('INVALID_ARGUMENT')) {
        logger.error('❌ Argumento inválido enviado ao Gemini');
        return null;
      } else if (error?.message?.includes('UNAUTHENTICATED') || error?.message?.includes('API_KEY')) {
        logger.error('❌ Erro de autenticação com Gemini. Verifique GEMINI_API_KEY');
        return null;
      } else {
        logger.error('❌ Erro desconhecido ao chamar Gemini');
        throw error;
      }
    }
  }

  cleanResponse(text) {
    // Remover asteriscos de markdown
    let cleaned = text.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');
    
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
    const timeSinceLastCall = (now - this.lastCallTime) / 1000;
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

  getCallStats() {
    return {
      totalCalls: this.callCount,
      lastCallTime: new Date(this.lastCallTime).toISOString(),
    };
  }
}
