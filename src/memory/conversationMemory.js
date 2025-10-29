import logger from '../utils/logger.js';
import { StyleAnalyzer } from '../ai/styleAnalyzer.js';

export class ConversationMemory {
  constructor(db) {
    this.db = db;
    this.conversationCache = new Map();
    this.MAX_CACHE_SIZE = 100;
    this.styleAnalyzer = new StyleAnalyzer(db);
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

  getRecentMessages(chatId, limit = 10, maxAgeHours = 1) {
    try {
      // Filtrar mensagens das últimas X horas (padrão: 1h)
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      const stmt = this.db.prepare(`
        SELECT * FROM messages 
        WHERE chat_id = ? 
        AND timestamp > ?
        ORDER BY timestamp DESC 
        LIMIT ?
      `);

      const messages = stmt.all(chatId, cutoffTime, limit);
      const reversed = messages.reverse();
      
      logger.info(`📚 Histórico: ${reversed.length}/${limit} mensagens (última ${maxAgeHours}h)`);
      
      return reversed;

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

  async analyzeUserStyle(forceReanalyze = false) {
    try {
      logger.info('📊 Iniciando análise de estilo do usuário...');
      const analysis = await this.styleAnalyzer.analyzeUserStyle(forceReanalyze);
      
      if (analysis) {
        logger.info('✅ Análise de estilo concluída');
      }
      
      return analysis;
    } catch (error) {
      logger.error('❌ Erro ao analisar estilo:', error);
      return null;
    }
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
