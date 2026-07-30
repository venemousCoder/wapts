/**
 * Unit Tests: AssessmentService
 * TC-ASSESS-001 through TC-ASSESS-004
 */
const mongoose = require('mongoose');
require('../../setup');

const AssessmentService = require('../../../services/AssessmentService');
const Assessment = require('../../../models/Assessment');
const AssessmentType = require('../../../models/AssessmentType');
const StudentAssessment = require('../../../models/StudentAssessment');
const eventBus = require('../../../utils/eventBus');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain } = require('../../helpers/testHelpers');

describe('AssessmentService', () => {
  let dept, course, student, lecturer, chain, assType;

  beforeEach(async () => {
    dept = await createTestDepartment();
    course = await createTestCourse(dept._id);
    student = await createStudentWithProfile(dept._id);
    lecturer = await createLecturerWithProfile(dept._id);
    chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);
    assType = new AssessmentType({ name: 'Exam', description: 'Final exam', defaultWeight: 100 });
    await assType.save();
  });

  describe('defineAssessment', () => {
    test('TC-ASSESS-001: should create assessment when weight ≤ 100', async () => {
      const a = await AssessmentService.defineAssessment(chain.offering._id, assType._id, 60, 100, new Date());
      expect(a._id).toBeDefined();
      expect(a.weight).toBe(60);
    });

    test('TC-ASSESS-002: should reject when total weight exceeds 100', async () => {
      await AssessmentService.defineAssessment(chain.offering._id, assType._id, 70, 100, new Date());
      await expect(
        AssessmentService.defineAssessment(chain.offering._id, assType._id, 40, 100, new Date())
      ).rejects.toThrow('cannot exceed 100%');
    });

    test('TC-ASSESS-003: should emit assessment.created event', async () => {
      const spy = jest.fn();
      eventBus.on('assessment.created', spy);
      await AssessmentService.defineAssessment(chain.offering._id, assType._id, 50, 100, new Date());
      expect(spy).toHaveBeenCalled();
      eventBus.off('assessment.created', spy);
    });
  });

  describe('recordScores', () => {
    test('TC-ASSESS-004: should upsert student assessment records', async () => {
      const a = await AssessmentService.defineAssessment(chain.offering._id, assType._id, 100, 100, new Date());
      const records = await AssessmentService.recordScores(a._id, [{ studentId: student.profile._id, score: 85 }]);
      expect(records.length).toBe(1);
      expect(records[0].score).toBe(85);

      // Update score
      const updated = await AssessmentService.recordScores(a._id, [{ studentId: student.profile._id, score: 90 }]);
      expect(updated[0].score).toBe(90);
      // Should still be 1 record (upserted)
      const count = await StudentAssessment.countDocuments({ assessmentId: a._id });
      expect(count).toBe(1);
    });
  });
});
