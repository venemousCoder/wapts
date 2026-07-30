/**
 * Integration Tests: Import
 * TC-INT-IMPORT-001 through TC-INT-IMPORT-002
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const Assessment = require('../../models/Assessment');
const AssessmentType = require('../../models/AssessmentType');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, authenticatedAgent } = require('../helpers/testHelpers');

describe('Import Integration', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('TC-INT-IMPORT-001: POST /import/csv/scores with valid CSV → imports', async () => {
    const dept = await createTestDepartment();
    const course = await createTestCourse(dept._id);
    const student = await createStudentWithProfile(dept._id, {
      user: { loginIdentifier: 'CSVSTU001', loginType: 'REG_NUMBER' }
    });
    const lecturer = await createLecturerWithProfile(dept._id);
    const chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);

    const assType = new AssessmentType({ name: 'Test', defaultWeight: 100 });
    await assType.save();
    const assessment = new Assessment({ courseOfferingId: chain.offering._id, assessmentTypeId: assType._id, weight: 100, maximumScore: 100, dueDate: new Date() });
    await assessment.save();

    const csvPath = path.join(tmpDir, 'import_test.csv');
    fs.writeFileSync(csvPath, `registrationNumber,score\nCSVSTU001,92\n`);

    const lecAgent = await authenticatedAgent(app, lecturer.user);
    const res = await lecAgent.post('/import/csv/scores')
      .set('Accept', 'application/json')
      .field('assessmentId', assessment._id.toString())
      .attach('csv', csvPath);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-INT-IMPORT-002: POST /import/csv/scores without file → 400', async () => {
    const dept = await createTestDepartment();
    const lecturer = await createLecturerWithProfile(dept._id);
    const agent = await authenticatedAgent(app, lecturer.user);
    const res = await agent.post('/import/csv/scores')
      .set('Accept', 'application/json')
      .send({ assessmentId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(400);
  });
});
