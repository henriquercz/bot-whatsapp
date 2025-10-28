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
      authorizedChats: [],
      authorizedGroups: [],
      blacklist: [],
      settings: {
        respondToAll: false,
        onlyMentions: false,
        autoLearn: true,
        responseDelay: 2000,
        maxResponseLength: 500,
        autoLearningInterval: 3600000,
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
    logger.info(`🔍 Verificando autorização para: ${chatId}`);
    logger.info(`📋 Chats autorizados: ${JSON.stringify(this.config.authorizedChats)}`);
    logger.info(`📋 Grupos autorizados: ${JSON.stringify(this.config.authorizedGroups)}`);
    
    // Verificar se está na blacklist (prioridade máxima)
    if (this.config.blacklist.includes(chatId)) {
      logger.info(`🚫 Chat em blacklist: ${chatId}`);
      return false;
    }

    // Se respondToAll está ativado e não está em blacklist
    if (this.config.settings.respondToAll) {
      logger.info(`✅ respondToAll ativado`);
      return true;
    }

    // Verificar se é grupo ou chat pessoal
    const isGroup = chatId.endsWith('@g.us');
    logger.info(`🔎 É grupo? ${isGroup}`);

    if (isGroup) {
      const authorized = this.config.authorizedGroups.includes(chatId);
      logger.info(`${authorized ? '✅' : '❌'} Grupo ${authorized ? 'AUTORIZADO' : 'NÃO autorizado'}`);
      return authorized;
    } else {
      const authorized = this.config.authorizedChats.includes(chatId);
      logger.info(`${authorized ? '✅' : '❌'} Chat ${authorized ? 'AUTORIZADO' : 'NÃO autorizado'}`);
      return authorized;
    }
  }

  addAuthorizedChat(chatId, isGroup = false) {
    try {
      logger.info(`🔧 Tentando autorizar chat: ${chatId}, isGroup: ${isGroup}`);
      const list = isGroup ? 'authorizedGroups' : 'authorizedChats';
      logger.info(`📝 Adicionando em: ${list}`);

      if (!this.config[list].includes(chatId)) {
        this.config[list].push(chatId);
        this.saveConfig(this.config);
        
        logger.info(`✅ Chat AUTORIZADO COM SUCESSO: ${chatId}`);
        logger.info(`📋 Lista atualizada (${list}): ${JSON.stringify(this.config[list])}`);
        return true;
      }

      logger.info(`⚠️ Chat já estava autorizado: ${chatId}`);
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
