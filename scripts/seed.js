const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const UserService = require('../services/UserService');
const Department = require('../models/Department');
const SystemSetting = require('../models/SystemSetting');

const seedDB = async () => {
  await connectDB();
  console.log('Seeding Database...');

  try {
    // Create a default department
    let cscDept = await Department.findOne({ code: 'CSC' });
    if (!cscDept) {
      console.log('Creating Default Department...');
      cscDept = new Department({ name: 'Computer Science', code: 'CSC' });
      await cscDept.save();
    }

    // Check if admin exists to avoid duplication
    const adminExists = await mongoose.connection.db.collection('users').findOne({ loginType: 'ADMIN_USERNAME' });
    if (!adminExists) {
      console.log('Creating Admin User...');
      await UserService.createUser({
        loginIdentifier: 'admin',
        loginType: 'ADMIN_USERNAME',
        firstName: 'System',
        lastName: 'Admin',
        password: 'admin' // In a real app, use a strong password
      }, null, 'Admin');
    }

    // Create HOD
    const hodExists = await mongoose.connection.db.collection('users').findOne({ loginIdentifier: 'hod@wapts.edu' });
    if (!hodExists) {
      console.log('Creating HOD User...');
      await UserService.createUser({
        loginIdentifier: 'hod@wapts.edu',
        loginType: 'INSTITUTIONAL_EMAIL',
        firstName: 'Head',
        lastName: 'Department',
        password: 'password123'
      }, { departmentId: cscDept._id, appointmentDate: new Date() }, 'HOD');
    }

    // Create Lecturer
    const lecturerExists = await mongoose.connection.db.collection('users').findOne({ loginIdentifier: 'lecturer@wapts.edu' });
    if (!lecturerExists) {
      console.log('Creating Lecturer User...');
      await UserService.createUser({
        loginIdentifier: 'lecturer@wapts.edu',
        loginType: 'INSTITUTIONAL_EMAIL',
        firstName: 'John',
        lastName: 'Smith',
        password: 'password123'
      }, { departmentId: cscDept._id, employeeId: 'EMP001' }, 'Lecturer');
    }

    // Create Student
    const studentExists = await mongoose.connection.db.collection('users').findOne({ loginIdentifier: 'REG2026001' });
    if (!studentExists) {
      console.log('Creating Student User...');
      await UserService.createUser({
        loginIdentifier: 'REG2026001',
        loginType: 'REG_NUMBER',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'password123'
      }, { departmentId: cscDept._id, level: 100, admissionYear: 2026 }, 'Student');
    }

    // Create default settings
    const settingsExist = await SystemSetting.findOne();
    if (!settingsExist) {
      console.log('Creating Default Settings...');
      const settings = new SystemSetting({});
      await settings.save();
    }

    // Create Assessment Types
    const AssessmentType = require('../models/AssessmentType');
    const typesCount = await AssessmentType.countDocuments();
    if (typesCount === 0) {
      console.log('Creating Default Assessment Types...');
      const types = [
        { name: 'Quiz', defaultWeight: 10 },
        { name: 'Assignment', defaultWeight: 10 },
        { name: 'Continuous Assessment', defaultWeight: 20 },
        { name: 'Midterm', defaultWeight: 20 },
        { name: 'Practical', defaultWeight: 15 },
        { name: 'Laboratory', defaultWeight: 15 },
        { name: 'Presentation', defaultWeight: 10 },
        { name: 'Project', defaultWeight: 30 },
        { name: 'Exam', defaultWeight: 60 }
      ];
      await AssessmentType.insertMany(types);
    }

    console.log('Seeding Complete!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    process.exit(0);
  }
};

seedDB();
