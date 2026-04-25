module.exports = {
  apps: [
    {
      name: 'calliteven-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      // Graceful shutdown — matches the 10s timeout in server.js
      kill_timeout: 10000,
      // Restart on crash, but stop if it crashes 10 times in 60s
      max_restarts: 10,
      min_uptime: '5s',
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
