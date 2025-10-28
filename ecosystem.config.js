module.exports = {
  apps: [
    {
      name: 'whatsapp-ai-bot',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
      
      // Reinicialização automática
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      
      // Limites de memória
      max_memory_restart: '500M',
      
      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Retry/restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // Graceful shutdown
      wait_ready: true,
      
      // Merge logs
      merge_logs: true,
    },
  ],
};
