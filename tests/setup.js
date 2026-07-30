const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';

try {
  const configPath = path.join(process.cwd(), 'tests', 'globalConfig.json');
  const configStr = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configStr);
  process.env.MONGO_URI = config.mongoUri;
} catch (err) {
  console.error("Failed to read globalConfig.json at " + path.join(process.cwd(), 'tests', 'globalConfig.json'));
}

beforeAll(async () => {
  // Connect to in-memory MongoDB (URI set by globalSetup)
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
