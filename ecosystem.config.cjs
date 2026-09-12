module.exports = {
  apps: [
    {
      name: "rakhsh-app",
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/rakhsh_db",
        SESSION_SECRET: "your_very_secure_session_secret_change_me",
        JWT_SECRET: "your_very_secure_jwt_secret_change_me",
        ADMIN_PASSWORD: "admin123",
        SMS_API_TOKEN: "your_sms_token_here",
        TELEGRAM_BOT_TOKEN: "your_telegram_bot_token_here"
      }
    }
  ]
};
