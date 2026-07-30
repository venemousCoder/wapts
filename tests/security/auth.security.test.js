/**
 * Security Tests: Authentication & Authorization
 * TC-SEC-AUTH-001 through TC-SEC-AUTH-006
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { createTestUser, DEFAULT_PASSWORD, authenticatedAgent } = require('../helpers/testHelpers');

describe('Security: Authentication & Authorization', () => {
  describe('Unauthenticated Access', () => {
    test('TC-SEC-AUTH-001: Unauthenticated access to /student/dashboard → redirect', async () => {
      const res = await supertest(app).get('/student/dashboard');
      expect(res.status).toBe(302);
    });

    test('TC-SEC-AUTH-002: Unauthenticated access to /admin/dashboard → redirect', async () => {
      const res = await supertest(app).get('/admin/dashboard');
      expect(res.status).toBe(302);
    });

    test('TC-SEC-AUTH-003: Unauthenticated access to /lecturer/dashboard → redirect', async () => {
      const res = await supertest(app).get('/lecturer/dashboard');
      expect(res.status).toBe(302);
    });
  });

  describe('Role-based Access Control', () => {
    test('TC-SEC-AUTH-004: Student cannot access admin routes → 403', async () => {
      const student = await createTestUser('Student', { loginIdentifier: 'sec_std', loginType: 'REG_NUMBER' });
      const agent = await authenticatedAgent(app, student);
      const res = await agent.get('/admin/departments').set('Accept', 'application/json');
      expect(res.status).toBe(403);
    });

    test('TC-SEC-AUTH-005: Lecturer cannot access HOD approve → 403', async () => {
      const lecturer = await createTestUser('Lecturer', { loginIdentifier: 'sec_lec@t.edu', loginType: 'INSTITUTIONAL_EMAIL' });
      const agent = await authenticatedAgent(app, lecturer);
      const res = await agent.post('/hod/results/approve')
        .set('Accept', 'application/json')
        .send({ resultId: new mongoose.Types.ObjectId().toString() });
      expect(res.status).toBe(403);
    });
  });

  describe('Password Storage', () => {
    test('TC-SEC-AUTH-006: Passwords are bcrypt hashed, not stored plain', async () => {
      const user = await createTestUser('Student', { loginIdentifier: 'sec_hash', loginType: 'REG_NUMBER' });
      const dbUser = await User.findById(user._id);
      expect(dbUser.passwordHash).not.toBe(DEFAULT_PASSWORD);
      expect(dbUser.passwordHash.startsWith('$2')).toBe(true); // bcrypt prefix
    });
  });
});
