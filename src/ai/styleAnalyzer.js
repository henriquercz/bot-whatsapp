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
    const phrases = {};
    
    messages.forEach(msg => {
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
      .filter(([, count]) => count >= 3)
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
          formality = ?, common_phrases = ?, favorite_emojis = ?,
          common_words = ?, use_slang = ?, example_messages = ?,
          updated_at = ?
      WHERE id = 1
    `);

    stmt.run(
      profile.tone,
      profile.avgLength,
      profile.emojiFrequency,
      profile.formality,
      JSON.stringify(profile.commonPhrases),
      JSON.stringify(profile.favoriteEmojis),
      JSON.stringify(profile.commonWords),
      profile.useSlang ? 1 : 0,
      JSON.stringify(profile.exampleMessages),
      Date.now()
    );

    logger.debug('💾 Perfil salvo no banco de dados');
  }
}
