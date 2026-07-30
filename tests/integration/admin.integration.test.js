/**
 * Integration Tests: Admin
 * TC-INT-ADMIN-001 through TC-INT-ADMIN-004
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const Department = require('../../models/Department');
const User = require('../../models/User');
const { createTestUser, DEFAULT_PASSWORD, authenticatedAgent } = require('../helpers/testHelpers');

describe('Admin Integration', () => {
  let adminUser, agent;

  beforeEach(async () => {
    adminUser = await createTestUser('Admin', {
      loginIdentifier: 'admin_int',
      loginType: 'ADMIN_USERNAME'
    });
    agent = await authenticatedAgent(app, adminUser);
  });

  test('TC-INT-ADMIN-001: GET /admin/departments → returns departments', async () => {
    const res = await agent.get('/admin/departments').set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-INT-ADMIN-002: POST /admin/departments → creates department', async () => {
    const res = await agent.post('/admin/departments')
      .set('Accept', 'application/json')
      .send({ name: 'Computer Science', code: 'CSC' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Computer Science');

    const dept = await Department.findOne({ code: 'CSC' });
    expect(dept).toBeDefined();
  });

  test('TC-INT-ADMIN-003: GET /admin/users → returns users', async () => {
    const res = await agent.get('/admin/users').set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('TC-INT-ADMIN-004: Unauthenticated access → redirect', async () => {
    const res = await supertest(app).get('/admin/dashboard');
    expect(res.status).toBe(302);
  });
});
