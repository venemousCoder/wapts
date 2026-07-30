/**
 * Security Tests: Access Control
 * TC-SEC-ACCESS-001 through TC-SEC-ACCESS-004
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const { createTestUser, DEFAULT_PASSWORD, authenticatedAgent, createTestDepartment, createStudentWithProfile } = require('../helpers/testHelpers');

describe('Security: Access Control', () => {
  describe('Direct URL Access', () => {
    test('TC-SEC-ACCESS-001: Direct URL to /student/dashboard without session → redirect', async () => {
      const res = await supertest(app).get('/student/dashboard');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/auth/login');
    });

    test('TC-SEC-ACCESS-002: Direct URL to /hod/dashboard without session → redirect', async () => {
      const res = await supertest(app).get('/hod/dashboard');
      expect(res.status).toBe(302);
    });
  });

  describe('Vertical Privilege Escalation', () => {
    test('TC-SEC-ACCESS-003: Student cannot submit results (lecturer action)', async () => {
      const student = await createTestUser('Student', { loginIdentifier: 'esc_std', loginType: 'REG_NUMBER' });
      const agent = await authenticatedAgent(app, student);
      const res = await agent.post('/lecturer/results/submit')
        .set('Accept', 'application/json')
        .send({ resultId: new mongoose.Types.ObjectId().toString() });
      expect(res.status).toBe(403);
    });

    test('TC-SEC-ACCESS-004: Student cannot approve results (HOD action)', async () => {
      const student = await createTestUser('Student', { loginIdentifier: 'esc_std2', loginType: 'REG_NUMBER' });
      const agent = await authenticatedAgent(app, student);
      const res = await agent.post('/hod/results/approve')
        .set('Accept', 'application/json')
        .send({ resultId: new mongoose.Types.ObjectId().toString() });
      expect(res.status).toBe(403);
    });
  });
});
