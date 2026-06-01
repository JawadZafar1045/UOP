module.exports = {
  apps: [
    {
      name: 'uop-backend',
      script: './backend/server.js',
      instances: 4,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'uop-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
