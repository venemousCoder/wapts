const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start Server
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
