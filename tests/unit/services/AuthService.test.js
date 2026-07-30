/**
 * Unit Tests: AuthService
 * TC-AUTH-001 through TC-AUTH-009
 */
const mongoose = require('mongoose');
require('../../setup');

const AuthService = require('../../../services/AuthService');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');
const { createTestUser, DEFAULT_PASSWORD } = require('../../helpers/testHelpers');

describe('AuthService', () => {
  describe('authenticate', () => {
    // TC-AUTH-001: Valid credentials returns user
    test('TC-AUTH-001: should return user for valid credentials', async () => {
      const user = await createTestUser('Student', {
        loginIdentifier: 'STD001',
        loginType: 'REG_NUMBER'
      });
      const result = await AuthService.authenticate('STD001', DEFAULT_PASSWORD);
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(user._id.toString());
    });

    // TC-AUTH-002: Invalid password returns null
    test('TC-AUTH-002: should return null for invalid password', async () => {
      await createTestUser('Student', {
        loginIdentifier: 'STD002',
        loginType: 'REG_NUMBER'
      });
      const result = await AuthService.authenticate('STD002', 'wrongpassword');
      expect(result).toBeNull();
    });

    // TC-AUTH-003: Non-existent user returns null
    test('TC-AUTH-003: should return null for non-existent user', async () => {
      const result = await AuthService.authenticate('nonexistent', DEFAULT_PASSWORD);
      expect(result).toBeNull();
    });

    // TC-AUTH-004: Suspended account throws error
    test('TC-AUTH-004: should throw error for suspended account', async () => {
      await createTestUser('Student', {
        loginIdentifier: 'STD004',
        loginType: 'REG_NUMBER',
        accountStatus: 'Suspended'
      });
      await expect(
        AuthService.authenticate('STD004', DEFAULT_PASSWORD)
      ).rejects.toThrow('Account is suspended');
    });

    // TC-AUTH-005: Updates lastLogin on success
    test('TC-AUTH-005: should update lastLogin on successful authentication', async () => {
      const user = await createTestUser('Student', {
        loginIdentifier: 'STD005',
        loginType: 'REG_NUMBER'
      });
      expect(user.lastLogin).toBeUndefined();

      const result = await AuthService.authenticate('STD005', DEFAULT_PASSWORD);
      expect(result.lastLogin).toBeDefined();
      expect(result.lastLogin).toBeInstanceOf(Date);
    });

    // TC-AUTH-006: Authenticates via email
    test('TC-AUTH-006: should authenticate via email', async () => {
      await createTestUser('Student', {
        loginIdentifier: 'STD006',
        loginType: 'REG_NUMBER',
        email: 'std006@wapts.edu'
      });
      const result = await AuthService.authenticate('std006@wapts.edu', DEFAULT_PASSWORD);
      expect(result).toBeDefined();
    });

    // TC-AUTH-007: Soft-deleted user returns null
    test('TC-AUTH-007: should return null for soft-deleted user', async () => {
      await createTestUser('Student', {
        loginIdentifier: 'STD007',
        loginType: 'REG_NUMBER',
        isDeleted: true
      });
      const result = await AuthService.authenticate('STD007', DEFAULT_PASSWORD);
      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    // TC-AUTH-008: Hashes and saves new password
    test('TC-AUTH-008: should hash and save new password', async () => {
      const user = await createTestUser('Student', {
        loginIdentifier: 'STD008',
        loginType: 'REG_NUMBER'
      });
      const result = await AuthService.changePassword(user._id, DEFAULT_PASSWORD, 'NewPass456!');
      expect(result).toBe(true);

      // Verify new password works
      const updatedUser = await User.findById(user._id);
      const isMatch = await bcrypt.compare('NewPass456!', updatedUser.passwordHash);
      expect(isMatch).toBe(true);
    });

    // TC-AUTH-009: Rejects incorrect old password
    test('TC-AUTH-009: should reject incorrect old password', async () => {
      const user = await createTestUser('Student', {
        loginIdentifier: 'STD009',
        loginType: 'REG_NUMBER'
      });
      await expect(
        AuthService.changePassword(user._id, 'wrongold', 'NewPass456!')
      ).rejects.toThrow('Incorrect current password');
    });

    // TC-AUTH-010: Non-existent user throws error
    test('TC-AUTH-010: should throw error for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        AuthService.changePassword(fakeId, DEFAULT_PASSWORD, 'NewPass456!')
      ).rejects.toThrow('User not found');
    });
  });
});
