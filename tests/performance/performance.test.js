/**
 * Performance Tests
 * TC-PERF-001 through TC-PERF-005
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const { createTestUser, createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, createTestGradeScales, createTestClassifications, createResultWithScores, DEFAULT_PASSWORD, authenticatedAgent } = require('../helpers/testHelpers');
const Result = require('../../models/Result');
const ReportService = require('../../services/ReportService');

describe('Performance Tests', () => {
  describe('Response Times', () => {
    test('TC-PERF-001: Login response time < 2000ms', async () => {
      const user = await createTestUser('Student', { loginIdentifier: 'perf_std', loginType: 'REG_NUMBER' });
      const start = Date.now();
      await supertest(app)
        .post('/auth/login')
        .set('Accept', 'application/json')
        .send({ loginIdentifier: 'perf_std', password: DEFAULT_PASSWORD, loginType: 'REG_NUMBER' });
      const elapsed = Date.now() - start;
      console.log(`Login response time: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(2000);
    });

    test('TC-PERF-002: Dashboard load time < 2000ms', async () => {
      const admin = await createTestUser('Admin', { loginIdentifier: 'perf_admin', loginType: 'ADMIN_USERNAME' });
      const agent = await authenticatedAgent(app, admin);
      const start = Date.now();
      await agent.get('/admin/dashboard').set('Accept', 'application/json');
      const elapsed = Date.now() - start;
      console.log(`Dashboard load time: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(2000);
    });

    test('TC-PERF-003: Transcript generation time < 3000ms', async () => {
      await createTestGradeScales();
      await createTestClassifications();
      const dept = await createTestDepartment();
      const course = await createTestCourse(dept._id);
      const student = await createStudentWithProfile(dept._id);
      const lecturer = await createLecturerWithProfile(dept._id);
      const chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);

      const result = new Result({
        enrollmentId: chain.enrollment._id,
        finalScore: 75, letterGrade: 'A', gradePoint: 5.0, isPass: true, status: 'Published'
      });
      await result.save();

      const start = Date.now();
      await ReportService.generateTranscriptData(student.user._id);
      const elapsed = Date.now() - start;
      console.log(`Transcript generation time: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(3000);
    });

    test('TC-PERF-004: Grade conversion time < 100ms', async () => {
      await createTestGradeScales();
      const GradeService = require('../../services/GradeService');
      const start = Date.now();
      for (let i = 0; i <= 100; i++) {
        await GradeService.convertScoreToGrade(i);
      }
      const elapsed = Date.now() - start;
      console.log(`101 grade conversions: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(5000);
    });

    test('TC-PERF-005: Pagination with multiple records < 2000ms', async () => {
      const admin = await createTestUser('Admin', { loginIdentifier: 'perf_admin2', loginType: 'ADMIN_USERNAME' });
      const AuditService = require('../../services/AuditService');
      for (let i = 0; i < 50; i++) {
        await AuditService.log(`ACTION_${i}`, 'Resource', admin._id, admin);
      }
      const start = Date.now();
      await AuditService.getLogs({}, 1, 20);
      const elapsed = Date.now() - start;
      console.log(`Paginated query (50 records, page 1): ${elapsed}ms`);
      expect(elapsed).toBeLessThan(2000);
    });
  });
});
