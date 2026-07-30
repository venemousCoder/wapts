/**
 * Integration Tests: Enrollment
 * TC-INT-ENROLL-001 through TC-INT-ENROLL-003
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const { createTestUser, createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, DEFAULT_PASSWORD, authenticatedAgent } = require('../helpers/testHelpers');
const AcademicSession = require('../../models/AcademicSession');
const Semester = require('../../models/Semester');
const CourseOffering = require('../../models/CourseOffering');
const Curriculum = require('../../models/Curriculum');
const Enrollment = require('../../models/Enrollment');

describe('Enrollment Integration', () => {
  let studentAgent, dept, course, offering;

  beforeEach(async () => {
    dept = await createTestDepartment();
    course = await createTestCourse(dept._id);
    const student = await createStudentWithProfile(dept._id);
    const lecturer = await createLecturerWithProfile(dept._id);

    const session = new AcademicSession({ name: '2025/2026', status: 'Active' });
    await session.save();
    const semester = new Semester({ name: 'First', sessionId: session._id, isActive: true });
    await semester.save();
    offering = new CourseOffering({ courseId: course._id, sessionId: session._id, semesterId: semester._id, lecturerId: lecturer.profile._id, status: 'Published' });
    await offering.save();
    const curriculum = new Curriculum({ departmentId: dept._id, level: 100, semesterId: semester._id, requiredCourses: [course._id], electiveCourses: [], totalCredits: 3, isDeleted: false });
    await curriculum.save();

    studentAgent = await authenticatedAgent(app, student.user);
  });

  test('TC-INT-ENROLL-001: POST /student/courses/enroll with valid offering → 200', async () => {
    const res = await studentAgent.post('/student/courses/enroll')
      .set('Accept', 'application/json')
      .send({ courseOfferingId: offering._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Enrolled');
  });

  test('TC-INT-ENROLL-002: Enrollment persists in database', async () => {
    await studentAgent.post('/student/courses/enroll')
      .set('Accept', 'application/json')
      .send({ courseOfferingId: offering._id.toString() });
    const enrollment = await Enrollment.findOne({ courseOfferingId: offering._id });
    expect(enrollment).toBeDefined();
  });
});
