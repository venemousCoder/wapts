/**
 * Integration Tests: Result Lifecycle
 * TC-INT-RESULT-001 through TC-INT-RESULT-003
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const Result = require('../../models/Result');
const ResultService = require('../../services/ResultService');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, createTestGradeScales, createResultWithScores, authenticatedAgent } = require('../helpers/testHelpers');

describe('Result Integration', () => {
  let lecturerAgent, hodAgent, chain, student;

  beforeEach(async () => {
    await createTestGradeScales();
    const dept = await createTestDepartment();
    const course = await createTestCourse(dept._id);
    student = await createStudentWithProfile(dept._id);
    const lecturer = await createLecturerWithProfile(dept._id);
    const hod = await (require('../helpers/testHelpers')).createHodWithProfile(dept._id);
    chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);
    lecturerAgent = await authenticatedAgent(app, lecturer.user);
    hodAgent = await authenticatedAgent(app, hod.user);
  });

  test('TC-INT-RESULT-001: Full result lifecycle via services', async () => {
    await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);

    const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
    expect(draft.status).toBe('Draft');

    const submitted = await ResultService.submitResult(draft._id);
    expect(submitted.status).toBe('Submitted');

    const approved = await ResultService.approveResult(submitted._id);
    expect(approved.status).toBe('Approved');

    const published = await ResultService.publishResult(approved._id);
    expect(published.status).toBe('Published');
  });

  test('TC-INT-RESULT-002: POST /lecturer/results/submit → submits result', async () => {
    await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
    const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);

    const res = await lecturerAgent.post('/lecturer/results/submit')
      .set('Accept', 'application/json')
      .send({ resultId: draft._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Submitted');
  });

  test('TC-INT-RESULT-003: POST /hod/results/approve → approves result', async () => {
    await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
    const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
    await ResultService.submitResult(draft._id);

    const res = await hodAgent.post('/hod/results/approve')
      .set('Accept', 'application/json')
      .send({ resultId: draft._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Approved');
  });
});
