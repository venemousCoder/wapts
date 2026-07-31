const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start Server
  const PORT = env.PORT;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    
    // Start the keep-alive cron job
    const startKeepAlive = require('./utils/keepAlive');
    startKeepAlive();
  });
};

startServer();
