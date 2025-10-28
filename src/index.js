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
    const chatConfig = new ChatConfigManager(process.env.CHATS_CONFIG_PATH || './config/chats.json');
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
    logger.info('📝 Envie suas próprias mensagens para o bot aprender seu estilo');
    logger.info('⚙️ Use !authorize em um chat para autorizar respostas automáticas');
    
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

process.on('SIGTERM', () => {
  logger.info('⏹️ Encerrando bot graciosamente...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  logger.error('❌ Erro não tratado (Promise):', error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Erro não capturado (Exception):', error);
  process.exit(1);
});

main().catch(logger.error);
