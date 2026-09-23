module.exports = {
  apps: [
    {
      name: 'itsupporter-backend',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: '../logs/pm2.out.log',
      error_file: '../logs/pm2.error.log',
      merge_logs: true,
      time: true,
    },
  ],
}