module.exports = {
  apps: [
    {
      name: 'agri-school-backend',
      script: 'server.js',
      cwd: '/var/www/agri-school/UOP/backend',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        PORT: 5020,
        NODE_ENV: 'production'
      },
      max_memory_restart: '1G',
      kill_timeout: 5000,
      listen_timeout: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'agri-school-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/agri-school/UOP/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 3020,
        NODE_ENV: 'production'
      },
      max_memory_restart: '1G'
    }
  ]
};
