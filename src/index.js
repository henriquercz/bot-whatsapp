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

// Configurar encoding UTF-8 para Windows
if (process.platform === 'win32') {
  try {
    // Tentar configurar o console do Windows para UTF-8
    if (process.stdout && process.stdout.setEncoding) {
      process.stdout.setEncoding('utf8');
    }
    if (process.stderr && process.stderr.setEncoding) {
      process.stderr.setEncoding('utf8');
    }
  } catch (e) {
    // Ignorar erros de configuração de encoding
  }
}

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
    
    console.log('\n\n🚀🚀🚀 REGISTRANDO LISTENER DE MENSAGENS 🚀🚀🚀\n\n');
    
    // Listener de mensagens (BAILEYS 7.0 formato correto)
    sock.ev.on('messages.upsert', async ({ type, messages }) => {
      console.log('\n\n📬📬📬 MENSAGEM RECEBIDA (messages.upsert)! 📬📬📬\n\n');
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info(`📬 EVENTO messages.upsert RECEBIDO!`);
      logger.info(`📊 Total de mensagens: ${messages.length}`);
      logger.info(`📋 Tipo do evento: ${type}`);
      logger.info('═══════════════════════════════════════════════════════════');
      
      // Baileys 7.0: processar apenas mensagens "notify" (novas)
      if (type === 'notify') {
        for (const msg of messages) {
          logger.info('┌─────────────────────────────────────────────────────────');
          logger.info('│ 📤 PROCESSANDO MENSAGEM NOVA...');
          logger.info(`│ 💬 Key: ${JSON.stringify(msg.key)}`);
          logger.info(`│ 📝 Message: ${JSON.stringify(msg.message)}`);
          logger.info('└─────────────────────────────────────────────────────────');
          
          try {
            await messageHandler.handleIncomingMessage(msg);
          } catch (error) {
            logger.error('❌ ERRO ao processar mensagem:', error);
          }
        }
      } else {
        logger.info(`⏩ Ignorando mensagens antigas (type: ${type})`);
      }
    });
    
    console.log('\n\n✅✅✅ LISTENER REGISTRADO COM SUCESSO ✅✅✅\n\n');
    console.log('🔍 Aguardando eventos... Envie uma mensagem para teste!\n');
    logger.info('🤖 Bot pronto para receber mensagens!');
    logger.info('📝 Envie uma mensagem para qualquer chat para testar');
    logger.info('⚙️ Use !authorize em um chat para autorizar respostas automáticas');
    
  } catch (error) {
    logger.error('❌ Erro fatal ao iniciar bot:', error);
    console.error('Stack trace completo:', error);
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
