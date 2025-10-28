import logger from '../utils/logger.js';

export class CommandParser {
  constructor() {
    this.commands = ['authorize', 'deauthorize', 'status', 'relearn', 'help'];
  }

  parse(text) {
    try {
      // Remover o ! do início
      const cleanText = text.trim().substring(1);
      
      // Separar comando e argumentos
      const parts = cleanText.split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (!this.commands.includes(command)) {
        return {
          type: 'unknown',
          command: command,
          args: args
        };
      }

      return {
        type: command,
        command: command,
        args: args,
        chatId: args[0] || null
      };

    } catch (error) {
      logger.error('❌ Erro ao parsear comando:', error);
      return {
        type: 'error',
        command: null,
        args: []
      };
    }
  }
}
