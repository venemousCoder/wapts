/**
 * Unit Tests: UserService
 * TC-USER-001 through TC-USER-007
 */
const mongoose = require('mongoose');
require('../../setup');

const UserService = require('../../../services/UserService');
const User = require('../../../models/User');
const StudentProfile = require('../../../models/StudentProfile');
const LecturerProfile = require('../../../models/LecturerProfile');
const HodProfile = require('../../../models/HodProfile');
const bcrypt = require('bcryptjs');
const { createTestDepartment } = require('../../helpers/testHelpers');

describe('UserService', () => {
  let dept;
  beforeEach(async () => {
    dept = await createTestDepartment();
  });

  describe('createUser', () => {
    test('TC-USER-001: should create student user with hashed password and profile', async () => {
      const user = await UserService.createUser(
        { loginIdentifier: 'STU100', loginType: 'REG_NUMBER', password: 'pass123', firstName: 'John', lastName: 'Doe' },
        { departmentId: dept._id, level: 100, admissionYear: 2025, registrationNumber: 'STU100' },
        'Student'
      );
      expect(user.role).toBe('Student');
      const isHashed = await bcrypt.compare('pass123', user.passwordHash);
      expect(isHashed).toBe(true);
      const profile = await StudentProfile.findOne({ userId: user._id });
      expect(profile).toBeDefined();
    });

    test('TC-USER-002: should create lecturer with profile', async () => {
      const user = await UserService.createUser(
        { loginIdentifier: 'lec@test.edu', loginType: 'INSTITUTIONAL_EMAIL', password: 'pass', firstName: 'Jane', lastName: 'Doe' },
        { departmentId: dept._id, staffId: 'STAFF001' },
        'Lecturer'
      );
      const profile = await LecturerProfile.findOne({ userId: user._id });
      expect(profile).toBeDefined();
    });

    test('TC-USER-003: should create HOD with profile', async () => {
      const user = await UserService.createUser(
        { loginIdentifier: 'hod@test.edu', loginType: 'INSTITUTIONAL_EMAIL', password: 'pass', firstName: 'Dr', lastName: 'Smith' },
        { departmentId: dept._id, appointmentDate: new Date() },
        'HOD'
      );
      const profile = await HodProfile.findOne({ userId: user._id });
      expect(profile).toBeDefined();
    });

    test('TC-USER-004: should use default password if none provided', async () => {
      const user = await UserService.createUser(
        { loginIdentifier: 'def@test.edu', loginType: 'INSTITUTIONAL_EMAIL', firstName: 'Def', lastName: 'User' },
        { departmentId: dept._id, appointmentDate: new Date() },
        'HOD'
      );
      const isDefault = await bcrypt.compare('password123', user.passwordHash);
      expect(isDefault).toBe(true);
    });
  });

  describe('softDeleteUser', () => {
    test('TC-USER-005: should soft delete user and student profile', async () => {
      const user = await UserService.createUser(
        { loginIdentifier: 'del@test.edu', loginType: 'REG_NUMBER', password: 'p', firstName: 'Del', lastName: 'User' },
        { departmentId: dept._id, level: 100, admissionYear: 2025, registrationNumber: 'del@test.edu' },
        'Student'
      );
      const deleted = await UserService.softDeleteUser(user._id);
      expect(deleted.isDeleted).toBe(true);
      const profile = await StudentProfile.findOne({ userId: user._id });
      expect(profile.isDeleted).toBe(true);
    });

    test('TC-USER-006: should throw for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(UserService.softDeleteUser(fakeId)).rejects.toThrow('User not found');
    });
  });

  describe('getUserProfile', () => {
    test('TC-USER-007: should return correct profile by role', async () => {
      const user = await UserService.createUser(
        { loginIdentifier: 'prof@test.edu', loginType: 'REG_NUMBER', password: 'p', firstName: 'P', lastName: 'U' },
        { departmentId: dept._id, level: 100, admissionYear: 2025, registrationNumber: 'prof@test.edu' },
        'Student'
      );
      const profile = await UserService.getUserProfile(user._id, 'Student');
      expect(profile).toBeDefined();
      expect(profile.userId.toString()).toBe(user._id.toString());
    });
  });
});
