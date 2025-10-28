import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
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

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.ubuntu('WhatsApp AI Bot v1.0'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectionTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
    generateHighQualityLinkPreview: false,
    logger: {
      level: 'silent',
    },
  });

  // Salvar credenciais quando atualizadas
  sock.ev.on('creds.update', async () => {
    logger.info('💾 Credenciais atualizadas e salvas');
    await saveCreds();
  });

  // Gerenciar conexão
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isNewLogin, qr } = update;

    if (qr) {
      logger.info('📲 Novo QR Code gerado. Escaneie com seu WhatsApp:');
      logger.info('   (Abra WhatsApp → Dispositivos Conectados → Conectar Dispositivo)');
    }

    if (connection === 'connecting') {
      logger.info('⏳ Conectando ao WhatsApp...');
    } else if (connection === 'open') {
      logger.info('✅ Conectado ao WhatsApp com sucesso!');
      if (isNewLogin) {
        logger.info('🆕 Nova autenticação realizada!');
      }
    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error).output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      if (reason === DisconnectReason.loggedOut) {
        logger.warn('⚠️ Logout detectado. Credenciais invalidadas. Escaneie novo QR Code.');
      } else if (reason === DisconnectReason.connectionClosed) {
        logger.warn('⚠️ Conexão fechada. Reconectando...');
      } else if (reason === DisconnectReason.connectionLost) {
        logger.warn('⚠️ Conexão perdida. Reconectando...');
      } else if (reason === DisconnectReason.connectionReplaced) {
        logger.warn('⚠️ Conexão substituída em outro dispositivo.');
      } else if (reason === DisconnectReason.restartRequired) {
        logger.warn('⚠️ Reinício necessário. Reconectando...');
      }

      if (shouldReconnect) {
        logger.info('🔄 Reconectando em 5 segundos...');
        setTimeout(() => startWhatsAppClient(), 5000);
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
    const result = await sock.sendMessage(chatId, {
      text: text,
      ...options
    });
    logger.debug(`📤 Mensagem enviada para ${chatId}`);
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
