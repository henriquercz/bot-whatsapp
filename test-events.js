import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';

console.log('\n==============================================');
console.log('🧪 TESTE DE EVENTOS - BAILEYS 7.0');
console.log('==============================================\n');

const { state, saveCreds } = await useMultiFileAuthState('./data/auth');

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  // CONFIGURAÇÕES PARA CLOUD/VM
  shouldSyncHistoryMessage: () => false,
  syncFullHistory: false,
  defaultQueryTimeoutMs: undefined,
  getMessage: async (key) => {
    return { conversation: '' };
  },
  logger: pino({ level: 'silent' })
});

// Interceptar TODOS os eventos
const originalOn = sock.ev.on.bind(sock.ev);
const eventCounts = {};

sock.ev.on = function(event, handler) {
  console.log(`✅ Evento registrado: ${event}`);
  
  return originalOn(event, function(...args) {
    eventCounts[event] = (eventCounts[event] || 0) + 1;
    console.log(`\n🔔 EVENTO DISPARADO: ${event} (contagem: ${eventCounts[event]})`);
    console.log(`   Dados:`, JSON.stringify(args, null, 2).substring(0, 200));
    
    return handler(...args);
  });
};

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', (update) => {
  console.log('\n📡 CONNECTION UPDATE:', update);
  
  if (update.connection === 'open') {
    console.log('\n✅✅✅ CONECTADO! ✅✅✅');
    console.log('Agora envie uma mensagem de QUALQUER pessoa!');
    console.log('Vamos ver quais eventos são disparados...\n');
  }
});

sock.ev.on('messages.upsert', async ({ type, messages }) => {
  console.log('\n📬📬📬 MESSAGES.UPSERT RECEBIDO! 📬📬📬');
  console.log(`Type: ${type}`);
  console.log(`Messages count: ${messages.length}`);
  console.log(`Messages:`, JSON.stringify(messages, null, 2));
});

sock.ev.on('messages.update', (update) => {
  console.log('\n📝 MESSAGES.UPDATE:', update);
});

sock.ev.on('chats.upsert', (chats) => {
  console.log('\n💬 CHATS.UPSERT:', chats.length, 'chats');
});

sock.ev.on('chats.update', (chats) => {
  console.log('\n💬 CHATS.UPDATE:', chats.length, 'chats');
});

console.log('\n🚀 Listeners registrados. Aguardando conexão...\n');

// Mostrar resumo a cada 30 segundos
setInterval(() => {
  console.log('\n📊 RESUMO DE EVENTOS ATÉ AGORA:');
  console.log(eventCounts);
}, 30000);
