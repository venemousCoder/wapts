/**
 * Unit Tests: EnrollmentService
 * TC-ENROLL-001 through TC-ENROLL-006
 */
const mongoose = require('mongoose');
require('../../setup');

const EnrollmentService = require('../../../services/EnrollmentService');
const Enrollment = require('../../../models/Enrollment');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain } = require('../../helpers/testHelpers');
const AcademicSession = require('../../../models/AcademicSession');
const Semester = require('../../../models/Semester');
const CourseOffering = require('../../../models/CourseOffering');
const Curriculum = require('../../../models/Curriculum');

describe('EnrollmentService', () => {
  let dept, course, student, lecturer;

  beforeEach(async () => {
    dept = await createTestDepartment();
    course = await createTestCourse(dept._id);
    student = await createStudentWithProfile(dept._id);
    lecturer = await createLecturerWithProfile(dept._id);
  });

  async function setupOfferingWithCurriculum() {
    const session = new AcademicSession({ name: '2025/2026', status: 'Active' });
    await session.save();
    const semester = new Semester({ name: 'First Semester', sessionId: session._id, isActive: true });
    await semester.save();
    const offering = new CourseOffering({ courseId: course._id, sessionId: session._id, semesterId: semester._id, lecturerId: lecturer.profile._id, status: 'Published' });
    await offering.save();
    const curriculum = new Curriculum({ departmentId: dept._id, level: 100, semesterId: semester._id, requiredCourses: [course._id], electiveCourses: [], totalCredits: 3, isDeleted: false });
    await curriculum.save();
    return { session, semester, offering, curriculum };
  }

  describe('enrollStudent', () => {
    test('TC-ENROLL-001: should create enrollment successfully', async () => {
      const { offering } = await setupOfferingWithCurriculum();
      const enrollment = await EnrollmentService.enrollStudent(student.user._id, offering._id);
      expect(enrollment).toBeDefined();
      expect(enrollment.status).toBe('Enrolled');
    });

    test('TC-ENROLL-002: should throw for non-existent student', async () => {
      const { offering } = await setupOfferingWithCurriculum();
      const fakeId = new mongoose.Types.ObjectId();
      await expect(EnrollmentService.enrollStudent(fakeId, offering._id)).rejects.toThrow('Student not found');
    });

    test('TC-ENROLL-003: should throw for non-existent offering', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(EnrollmentService.enrollStudent(student.user._id, fakeId)).rejects.toThrow();
    });

    test('TC-ENROLL-004: should reject course outside curriculum', async () => {
      const otherCourse = await createTestCourse(dept._id, { code: 'MTH101', title: 'Other' });
      const { semester, session } = await setupOfferingWithCurriculum();
      const otherOffering = new CourseOffering({ courseId: otherCourse._id, sessionId: session._id, semesterId: semester._id, lecturerId: lecturer.profile._id, departmentId: dept._id, status: 'Published' });
      await otherOffering.save();
      await expect(EnrollmentService.enrollStudent(student.user._id, otherOffering._id)).rejects.toThrow('not part of the student curriculum');
    });
  });

  describe('dropEnrollment', () => {
    test('TC-ENROLL-005: should set status to Dropped', async () => {
      const { offering } = await setupOfferingWithCurriculum();
      const enrollment = await EnrollmentService.enrollStudent(student.user._id, offering._id);
      const dropped = await EnrollmentService.dropEnrollment(enrollment._id);
      expect(dropped.status).toBe('Dropped');
    });

    test('TC-ENROLL-006: should throw for non-existent enrollment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(EnrollmentService.dropEnrollment(fakeId)).rejects.toThrow('Enrollment not found');
    });
  });
});
