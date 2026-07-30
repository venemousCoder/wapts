require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wapts?retryWrites=false',
  SESSION_SECRET: process.env.SESSION_SECRET || 'wapts_super_secret_session',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
