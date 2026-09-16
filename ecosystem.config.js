module.exports = {
  apps: [
    {
      name: 'kerita-api',
      script: './server.js',
      cwd: '/home/ubuntu/kerita-backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
