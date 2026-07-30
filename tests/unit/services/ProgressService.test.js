/**
 * Unit Tests: ProgressService
 * TC-PROG-001 through TC-PROG-004
 */
const mongoose = require('mongoose');
require('../../setup');

const DashboardSnapshot = require('../../../models/DashboardSnapshot');
const StudentProfile = require('../../../models/StudentProfile');
const Result = require('../../../models/Result');
const Enrollment = require('../../../models/Enrollment');
const eventBus = require('../../../utils/eventBus');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, createTestGradeScales, createTestClassifications } = require('../../helpers/testHelpers');

// We need to require ProgressService AFTER setup connects to DB because it registers event listeners
let ProgressService;

describe('ProgressService', () => {
  beforeAll(() => {
    ProgressService = require('../../../services/ProgressService');
  });

  beforeEach(async () => {
    await createTestGradeScales();
    await createTestClassifications();
  });

  describe('updateStudentProgress', () => {
    test('TC-PROG-001: should return early if student not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      // Should not throw
      await expect(ProgressService.updateStudentProgress(fakeId)).resolves.not.toThrow();
    });

    test('TC-PROG-002: should create snapshot if none exists', async () => {
      const dept = await createTestDepartment();
      const student = await createStudentWithProfile(dept._id);
      await ProgressService.updateStudentProgress(student.user._id);
      const snapshot = await DashboardSnapshot.findOne({ userId: student.user._id });
      expect(snapshot).toBeDefined();
      expect(snapshot.role).toBe('Student');
    });

    test('TC-PROG-003: should calculate CGPA and credits from published results', async () => {
      const dept = await createTestDepartment();
      const course = await createTestCourse(dept._id, { creditUnits: 3 });
      const student = await createStudentWithProfile(dept._id);
      const lecturer = await createLecturerWithProfile(dept._id);
      const chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);

      // Create published result
      const result = new Result({
        enrollmentId: chain.enrollment._id,
        finalScore: 75,
        letterGrade: 'A',
        gradePoint: 5.0,
        isPass: true,
        status: 'Published'
      });
      await result.save();

      await ProgressService.updateStudentProgress(student.user._id);

      const updatedStudent = await StudentProfile.findById(student.profile._id);
      expect(updatedStudent.totalCreditsEarned).toBe(3);
      expect(updatedStudent.currentCGPA).toBe(5.0);

      const snapshot = await DashboardSnapshot.findOne({ userId: student.user._id });
      expect(snapshot.currentCGPA).toBe(5.0);
      expect(snapshot.creditsEarned).toBe(3);
    });

    test('TC-PROG-004: should flag risk for low CGPA', async () => {
      const dept = await createTestDepartment();
      const course = await createTestCourse(dept._id, { creditUnits: 3 });
      const student = await createStudentWithProfile(dept._id);
      const lecturer = await createLecturerWithProfile(dept._id);
      const chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);

      // Create published result with failing grade
      const result = new Result({
        enrollmentId: chain.enrollment._id,
        finalScore: 20,
        letterGrade: 'F',
        gradePoint: 0,
        isPass: false,
        status: 'Published'
      });
      await result.save();

      await ProgressService.updateStudentProgress(student.user._id);

      const snapshot = await DashboardSnapshot.findOne({ userId: student.user._id });
      expect(snapshot.riskLevel).toBe('High');
    });
  });

  describe('event listeners', () => {
    test('TC-PROG-005: should have registered event listeners', () => {
      const listeners = eventBus.listeners('result.published');
      expect(listeners.length).toBeGreaterThan(0);
    });
  });
});
