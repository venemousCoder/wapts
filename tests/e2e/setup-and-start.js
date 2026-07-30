const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const env = require('../../config/env');

async function setupAndStart() {
  console.log('Starting MongoMemoryReplSet for E2E tests...');
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [
      {
        launchTimeout: 60000 // 60 seconds to start
      }
    ]
  });
  
  const uri = replSet.getUri();
  console.log(`In-memory database started at: ${uri}`);
  
  // Set environment variables for the server and seeder
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3005';
  process.env.SESSION_SECRET = 'e2e-session-secret';
  
  env.PORT = '3005';
  env.MONGO_URI = uri;
  env.NODE_ENV = 'test';

  // Seed the database
  console.log('Seeding the test database...');
  // Import the seed logic from scripts/seed.js but we don't want it to process.exit()
  // So we require the components directly and run them
  await mongoose.connect(uri);
  
  const UserService = require('../../services/UserService');
  const Department = require('../../models/Department');
  const SystemSetting = require('../../models/SystemSetting');
  
  try {
    let cscDept = new Department({ name: 'Computer Science', code: 'CSC' });
    await cscDept.save();

    await UserService.createUser({
      loginIdentifier: 'admin',
      loginType: 'ADMIN_USERNAME',
      firstName: 'System',
      lastName: 'Admin',
      password: 'admin'
    }, null, 'Admin');

    await UserService.createUser({
      loginIdentifier: 'hod@wapts.edu',
      loginType: 'INSTITUTIONAL_EMAIL',
      firstName: 'Head',
      lastName: 'Department',
      password: 'password123'
    }, { departmentId: cscDept._id, appointmentDate: new Date() }, 'HOD');

    await UserService.createUser({
      loginIdentifier: 'lecturer@wapts.edu',
      loginType: 'INSTITUTIONAL_EMAIL',
      firstName: 'John',
      lastName: 'Smith',
      password: 'password123'
    }, { departmentId: cscDept._id, employeeId: 'EMP001' }, 'Lecturer');

    await UserService.createUser({
      loginIdentifier: 'REG2026001',
      loginType: 'REG_NUMBER',
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'password123'
    }, { departmentId: cscDept._id, level: 100, admissionYear: 2026 }, 'Student');

    const settings = new SystemSetting({});
    await settings.save();
    
    console.log('E2E Seeding complete. Disconnecting seeder connection...');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during E2E seeding:', err);
    process.exit(1);
  }

  // Start the server
  console.log('Starting the application server...');
  require('../../server');
}

setupAndStart().catch(err => {
  console.error('Failed to start setup:', err);
  process.exit(1);
});
