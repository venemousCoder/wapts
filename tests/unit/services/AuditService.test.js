/**
 * Unit Tests: AuditService
 * TC-AUDIT-001 through TC-AUDIT-004
 */
const mongoose = require('mongoose');
require('../../setup');

const AuditService = require('../../../services/AuditService');
const AuditLog = require('../../../models/AuditLog');
const { createTestUser } = require('../../helpers/testHelpers');

describe('AuditService', () => {
  describe('log', () => {
    test('TC-AUDIT-001: should create audit log entry', async () => {
      const user = await createTestUser('Admin');
      await AuditService.log('LOGIN', 'User', user._id, user, null, null, '127.0.0.1', 'TestAgent');
      const logs = await AuditLog.find({});
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('LOGIN');
      expect(logs[0].resource).toBe('User');
    });

    test('TC-AUDIT-002: should not throw on logging failure', async () => {
      // Pass invalid data that might cause issues but shouldn't throw
      await expect(AuditService.log('TEST', 'Resource', null, null)).resolves.not.toThrow();
    });

    test('TC-AUDIT-003: should log with null user', async () => {
      await AuditService.log('SYSTEM_EVENT', 'Config', null, null);
      const logs = await AuditLog.find({});
      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBeNull();
    });
  });

  describe('getLogs', () => {
    test('TC-AUDIT-004: should return paginated results', async () => {
      const user = await createTestUser('Admin');
      for (let i = 0; i < 5; i++) {
        await AuditService.log(`ACTION_${i}`, 'Resource', user._id, user);
      }
      const result = await AuditService.getLogs({}, 1, 3);
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(1);
    });

    test('TC-AUDIT-005: should filter by action', async () => {
      const user = await createTestUser('Admin');
      await AuditService.log('LOGIN', 'User', user._id, user);
      await AuditService.log('LOGOUT', 'User', user._id, user);
      const result = await AuditService.getLogs({ action: 'LOGIN' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].action).toBe('LOGIN');
    });
  });
});
