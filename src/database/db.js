import Database from 'better-sqlite3';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

export function initializeDatabase(dbPath = './data/database.sqlite') {
  
  // Garantir que o diretório existe
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`📁 Diretório criado: ${dir}`);
  }

  // Conectar ao banco
  const db = new Database(dbPath);
  logger.info(`🗄️ Conectado ao banco de dados: ${dbPath}`);

  // Criar tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      is_from_me INTEGER NOT NULL,
      message_type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_is_from_me ON messages(is_from_me);

    CREATE TABLE IF NOT EXISTS user_style (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      tone TEXT DEFAULT 'casual',
      avg_length INTEGER DEFAULT 100,
      emoji_frequency REAL DEFAULT 0.5,
      formality REAL DEFAULT 0.3,
      common_phrases TEXT DEFAULT '[]',
      common_words TEXT DEFAULT '[]',
      favorite_emojis TEXT DEFAULT '[]',
      use_slang INTEGER DEFAULT 1,
      example_messages TEXT DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversation_context (
      chat_id TEXT PRIMARY KEY,
      last_context_summary TEXT,
      last_10_messages TEXT DEFAULT '[]',
      conversation_theme TEXT,
      last_updated INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS authorized_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT UNIQUE NOT NULL,
      is_group INTEGER DEFAULT 0,
      group_name TEXT,
      authorized_at INTEGER NOT NULL,
      auto_response_enabled INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_auth_chatid ON authorized_chats(chat_id);

    CREATE TABLE IF NOT EXISTS analysis_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_messages INTEGER DEFAULT 0,
      total_responses INTEGER DEFAULT 0,
      unique_chats INTEGER DEFAULT 0,
      last_analyzed INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  logger.info('✅ Tabelas do banco de dados criadas/verificadas');

  // Inserir valores padrão se não existirem
  const checkStyle = db.prepare('SELECT COUNT(*) as count FROM user_style').get();
  if (checkStyle.count === 0) {
    db.prepare(`
      INSERT INTO user_style (id, updated_at) 
      VALUES (1, ?)
    `).run(Date.now());
    logger.info('📝 Perfil padrão criado');
  }

  const checkStats = db.prepare('SELECT COUNT(*) as count FROM statistics').get();
  if (checkStats.count === 0) {
    db.prepare(`
      INSERT INTO statistics (id, created_at) 
      VALUES (1, ?)
    `).run(Date.now());
    logger.info('📊 Estatísticas padrão criadas');
  }

  return db;
}

export function backupDatabase(dbPath, backupDir = './backups') {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `database-${timestamp}.sqlite`);
    
    fs.copyFileSync(dbPath, backupPath);
    logger.info(`💾 Backup criado: ${backupPath}`);

    // Manter apenas últimos 5 backups
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('database-'))
      .sort()
      .reverse();
    
    if (files.length > 5) {
      files.slice(5).forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
      });
      logger.debug(`🗑️ Backups antigos removidos`);
    }

  } catch (error) {
    logger.error('❌ Erro ao fazer backup:', error);
  }
}
