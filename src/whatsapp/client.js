import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

const AUTH_PATH = './data/auth';

export async function startWhatsAppClient() {
  
  // Garantir que o diretório de autenticação existe
  if (!fs.existsSync(AUTH_PATH)) {
    fs.mkdirSync(AUTH_PATH, { recursive: true });
    logger.info(`📁 Diretório de autenticação criado: ${AUTH_PATH}`);
  }

  // Carregar ou criar estado de autenticação
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  logger.info('🔐 Estado de autenticação carregado/criado');
  
  // Aguardar antes de conectar para evitar rate limit
  await new Promise(resolve => setTimeout(resolve, 2000));

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.macOS('Safari'),
    version: [2, 3000, 1025091846], // ← Versão específica que funciona
    defaultQueryTimeoutMs: 0, // ← Sem timeout de query
    connectionTimeoutMs: 60_000, // ← 60 segundos de timeout
    syncFullHistory: false,
    markOnlineOnConnect: false,
    getMessage: async (key) => {
      return { conversation: 'hello' };
    },
    logger: pino({ level: 'fatal' }),
  });

  // Salvar credenciais quando atualizadas
  sock.ev.on('creds.update', async () => {
    logger.info('💾 Credenciais atualizadas e salvas');
    await saveCreds();
  });

  // Gerenciar conexão
  let pairingCodeRequested = false;
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isNewLogin, qr } = update;
    
    logger.debug('Update de conexão:', JSON.stringify({ connection, hasQr: !!qr, hasError: !!lastDisconnect?.error }));

    // Usar Pairing Code APENAS quando receber um QR
    if (qr && !pairingCodeRequested && process.env.WHATSAPP_PHONE_NUMBER) {
      pairingCodeRequested = true;
      const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER.replace(/[^0-9]/g, '');
      logger.info('📱 Solicitando código de pareamento para: ' + phoneNumber);
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info('🔑 CÓDIGO DE PAREAMENTO: ' + code);
        logger.info('📲 Abra WhatsApp no celular → Dispositivos Conectados → Conectar usando número');
        logger.info(`📝 Digite o código: ${code}`);
        console.log('\n');
        console.log('═══════════════════════════════════════');
        console.log(`   CÓDIGO DE PAREAMENTO: ${code}`);
        console.log('═══════════════════════════════════════');
        console.log('\n');
      } catch (error) {
        logger.error('❌ Erro ao solicitar pairing code:', error);
        pairingCodeRequested = false;
      }
    } else if (qr && !process.env.WHATSAPP_PHONE_NUMBER) {
      // Fallback para QR Code se não tiver número
      logger.info('📲 Novo QR Code gerado. Escaneie com seu WhatsApp:');
      logger.info('   (Abra WhatsApp → Dispositivos Conectados → Conectar Dispositivo)');
      console.log('\n');
      try {
        const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
        console.log(qrString);
      } catch (error) {
        logger.error('❌ Erro ao gerar QR Code:', error);
      }
      console.log('\n');
    }

    if (connection === 'connecting') {
      logger.info('⏳ Conectando ao WhatsApp...');
    } else if (connection === 'open') {
      logger.info('✅ Conectado ao WhatsApp com sucesso!');
      pairingCodeRequested = false; // Reset para próxima reconexão
      if (isNewLogin) {
        logger.info('🆕 Nova autenticação realizada!');
      }
    } else if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      logger.warn(`⚠️ Conexão fechada. Código: ${statusCode}`);
      
      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('❌ Você foi deslogado. Deletando credenciais antigas...');
        // Limpar credenciais
        if (fs.existsSync(AUTH_PATH)) {
          fs.rmSync(AUTH_PATH, { recursive: true, force: true });
          fs.mkdirSync(AUTH_PATH, { recursive: true });
          logger.info('🗑️ Credenciais limpas. Reinicie o bot para novo pareamento.');
        }
        process.exit(0);
      }

      if (shouldReconnect) {
        logger.info('🔄 Reconectando em 5 segundos...');
        pairingCodeRequested = false; // Reset para permitir novo código
        setTimeout(() => startWhatsAppClient(), 5000);
      } else {
        logger.error('❌ Não é possível reconectar. Bot será encerrado.');
        process.exit(1);
      }
    }
  });

  // Detectar status de chat
  sock.ev.on('chat.update', (update) => {
    // Pode usar para debug ou análise
  });

  return sock;
}

export async function sendMessage(sock, chatId, text, options = {}) {
  try {
    logger.info(`📤 Enviando mensagem para ${chatId}: ${text.substring(0, 50)}...`);
    const result = await sock.sendMessage(chatId, {
      text: text,
      ...options
    });
    logger.info(`✅ Mensagem ENVIADA COM SUCESSO para ${chatId}`);
    return result;
  } catch (error) {
    logger.error(`❌ Erro ao enviar mensagem para ${chatId}:`, error);
    throw error;
  }
}

export async function getChatInfo(sock, chatId) {
  try {
    const chat = await sock.groupMetadata?.(chatId) || { id: chatId };
    return {
      id: chat.id,
      name: chat.subject || 'Chat Pessoal',
      isGroup: chat.id?.endsWith('@g.us') || false,
      participants: chat.participants?.length || 0
    };
  } catch (error) {
    logger.error(`❌ Erro ao obter info do chat ${chatId}:`, error);
    return null;
  }
}
