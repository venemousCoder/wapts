const { MongoMemoryReplSet } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [
      {
        launchTimeout: 60000 // 60 seconds to start
      }
    ]
  });
  const uri = replSet.getUri();
  
  // Store the URI and instance globally so teardown can access them
  globalThis.__MONGOD__ = replSet;
  process.env.MONGO_URI = uri;
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.NODE_ENV = 'test';
  
  const configPath = path.join(process.cwd(), 'tests', 'globalConfig.json');
  fs.writeFileSync(configPath, JSON.stringify({ mongoUri: uri }));
};
