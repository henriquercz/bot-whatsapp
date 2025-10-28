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
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
        stopSequences: ['Human:', 'Assistant:'],
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
      
      const formattedHistory = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: currentMessage }]
        }
      ];

      // Chamar Gemini
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

      // Processar resposta
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
