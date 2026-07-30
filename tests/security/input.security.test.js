/**
 * Security Tests: Input Validation
 * TC-SEC-INPUT-001 through TC-SEC-INPUT-004
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const { createTestUser, DEFAULT_PASSWORD, authenticatedAgent, createLecturerWithProfile, createTestDepartment } = require('../helpers/testHelpers');
const path = require('path');
const fs = require('fs');

describe('Security: Input Validation', () => {
  describe('XSS Protection', () => {
    test('TC-SEC-INPUT-001: XSS payload in login field → rejected or sanitized', async () => {
      const res = await supertest(app)
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ loginIdentifier: '<script>alert("xss")</script>', password: 'test', loginType: 'REG_NUMBER' });
      // Should either reject (401) or sanitize — not execute script
      expect([401, 422]).toContain(res.status);
    });
  });

  describe('NoSQL Injection', () => {
    test('TC-SEC-INPUT-002: NoSQL injection in login → rejected', async () => {
      const res = await supertest(app)
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ loginIdentifier: { $gt: '' }, password: { $gt: '' }, loginType: 'REG_NUMBER' });
      // express-validator should reject non-string values
      expect([401, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Invalid loginType', () => {
    test('TC-SEC-INPUT-003: Invalid loginType → 422', async () => {
      const res = await supertest(app)
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ loginIdentifier: 'test', password: 'test', loginType: 'INVALID_TYPE' });
      expect(res.status).toBe(422);
    });
  });

  describe('File Upload Validation', () => {
    test('TC-SEC-INPUT-004: Non-CSV file rejected on import endpoint', async () => {
      const dept = await createTestDepartment();
      const lecturer = await createLecturerWithProfile(dept._id);
      const agent = await authenticatedAgent(app, lecturer.user);

      const tmpDir = path.join(__dirname, '..', 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const fakePath = path.join(tmpDir, 'malicious.exe');
      fs.writeFileSync(fakePath, 'MZ fake binary content');

      const res = await agent.post('/import/csv/scores')
        .set('Accept', 'application/json')
        .field('assessmentId', new mongoose.Types.ObjectId().toString())
        .attach('csv', fakePath);

      // Should be rejected by multer file filter
      expect([400, 500]).toContain(res.status);

      fs.unlinkSync(fakePath);
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
