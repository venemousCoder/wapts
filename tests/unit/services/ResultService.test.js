/**
 * Unit Tests: ResultService
 * TC-RESULT-001 through TC-RESULT-009
 */
const mongoose = require('mongoose');
require('../../setup');

const ResultService = require('../../../services/ResultService');
const Result = require('../../../models/Result');
const eventBus = require('../../../utils/eventBus');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, createTestGradeScales, createResultWithScores } = require('../../helpers/testHelpers');

describe('ResultService', () => {
  let dept, course, student, lecturer, chain;

  beforeEach(async () => {
    await createTestGradeScales();
    dept = await createTestDepartment();
    course = await createTestCourse(dept._id);
    student = await createStudentWithProfile(dept._id);
    lecturer = await createLecturerWithProfile(dept._id);
    chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);
  });

  describe('calculateFinalScore', () => {
    test('TC-RESULT-001: should calculate weighted final score', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 80);
      const score = await ResultService.calculateFinalScore(chain.enrollment._id, student.profile._id, chain.offering._id);
      expect(score).toBe(80);
    });

    test('TC-RESULT-002: should return 0 with no assessments', async () => {
      const score = await ResultService.calculateFinalScore(chain.enrollment._id, student.profile._id, chain.offering._id);
      expect(score).toBe(0);
    });
  });

  describe('saveDraft', () => {
    test('TC-RESULT-003: should create draft result with grade', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const result = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      expect(result.status).toBe('Draft');
      expect(result.letterGrade).toBe('A');
      expect(result.gradePoint).toBe(5.0);
      expect(result.isPass).toBe(true);
    });

    test('TC-RESULT-004: should reject modifying published result', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const result = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      result.status = 'Published';
      await result.save();
      await expect(ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id)).rejects.toThrow('Cannot modify');
    });
  });

  describe('submitResult', () => {
    test('TC-RESULT-005: should transition Draft → Submitted', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      const submitted = await ResultService.submitResult(draft._id);
      expect(submitted.status).toBe('Submitted');
    });

    test('TC-RESULT-006: should reject non-Draft results', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      draft.status = 'Submitted';
      await draft.save();
      await expect(ResultService.submitResult(draft._id)).rejects.toThrow('Only draft');
    });
  });

  describe('approveResult', () => {
    test('TC-RESULT-007: should transition Submitted → Approved', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      const submitted = await ResultService.submitResult(draft._id);
      const approved = await ResultService.approveResult(submitted._id);
      expect(approved.status).toBe('Approved');
    });
  });

  describe('publishResult', () => {
    test('TC-RESULT-008: should transition Approved → Published', async () => {
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      const submitted = await ResultService.submitResult(draft._id);
      const approved = await ResultService.approveResult(submitted._id);
      const published = await ResultService.publishResult(approved._id);
      expect(published.status).toBe('Published');
    });

    test('TC-RESULT-009: should emit result.published event', async () => {
      const spy = jest.fn();
      eventBus.on('result.published', spy);
      await createResultWithScores(chain.enrollment, chain.offering, student.profile, 75);
      const draft = await ResultService.saveDraft(chain.enrollment._id, student.profile._id, chain.offering._id);
      const submitted = await ResultService.submitResult(draft._id);
      const approved = await ResultService.approveResult(submitted._id);
      await ResultService.publishResult(approved._id);
      expect(spy).toHaveBeenCalled();
      eventBus.off('result.published', spy);
    });
  });
});
