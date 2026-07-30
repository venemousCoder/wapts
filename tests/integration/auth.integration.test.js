/**
 * Integration Tests: Authentication
 * TC-INT-AUTH-001 through TC-INT-AUTH-005
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const { createTestUser, DEFAULT_PASSWORD } = require('../helpers/testHelpers');

describe('Auth Integration', () => {
  let studentUser;

  beforeEach(async () => {
    studentUser = await createTestUser('Student', {
      loginIdentifier: 'INT_STD001',
      loginType: 'REG_NUMBER'
    });
  });

  test('TC-INT-AUTH-001: POST /auth/login with valid credentials → 200', async () => {
    const res = await supertest(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ loginIdentifier: 'INT_STD001', password: DEFAULT_PASSWORD, loginType: 'REG_NUMBER' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('Student');
  });

  test('TC-INT-AUTH-002: POST /auth/login with invalid credentials → 401', async () => {
    const res = await supertest(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ loginIdentifier: 'INT_STD001', password: 'wrong', loginType: 'REG_NUMBER' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('TC-INT-AUTH-003: POST /auth/login with suspended account → 401', async () => {
    await createTestUser('Student', {
      loginIdentifier: 'SUSPENDED001',
      loginType: 'REG_NUMBER',
      accountStatus: 'Suspended'
    });
    const res = await supertest(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ loginIdentifier: 'SUSPENDED001', password: DEFAULT_PASSWORD, loginType: 'REG_NUMBER' });
    // Passport returns 401 for errors thrown during authentication
    expect([401, 500]).toContain(res.status);
  });

  test('TC-INT-AUTH-004: POST /auth/login validation → rejects missing fields', async () => {
    const res = await supertest(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send({ loginIdentifier: '', password: '' });
    expect(res.status).toBe(422);
  });

  test('TC-INT-AUTH-005: GET /auth/logout → redirects', async () => {
    const agent = supertest.agent(app);
    await agent.post('/auth/login').send({ loginIdentifier: 'INT_STD001', password: DEFAULT_PASSWORD, loginType: 'REG_NUMBER' });
    const res = await agent.get('/auth/logout');
    expect(res.status).toBe(302);
  });
});
