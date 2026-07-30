/**
 * Integration Tests: Attendance
 * TC-INT-ATTEND-001 through TC-INT-ATTEND-002
 */
const mongoose = require('mongoose');
require('../setup');

const supertest = require('supertest');
const app = require('../../app');
const AttendanceRecord = require('../../models/AttendanceRecord');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, authenticatedAgent } = require('../helpers/testHelpers');

describe('Attendance Integration', () => {
  let lecturerAgent, chain, student;

  beforeEach(async () => {
    const dept = await createTestDepartment();
    const course = await createTestCourse(dept._id);
    student = await createStudentWithProfile(dept._id);
    const lecturer = await createLecturerWithProfile(dept._id);
    chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);
    lecturerAgent = await authenticatedAgent(app, lecturer.user);
  });

  test('TC-INT-ATTEND-001: POST /lecturer/attendance → records attendance', async () => {
    const res = await lecturerAgent.post('/lecturer/attendance')
      .set('Accept', 'application/json')
      .send({
        courseOfferingId: chain.offering._id.toString(),
        week: 1,
        lectureDate: new Date().toISOString(),
        topic: 'Test Lecture',
        recordsData: [{ studentId: student.profile._id.toString(), isPresent: true }]
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-INT-ATTEND-002: Attendance records persist', async () => {
    await lecturerAgent.post('/lecturer/attendance')
      .set('Accept', 'application/json')
      .send({
        courseOfferingId: chain.offering._id.toString(),
        week: 2,
        lectureDate: new Date().toISOString(),
        topic: 'Lecture 2',
        recordsData: [{ studentId: student.profile._id.toString(), isPresent: false }]
      });
    const records = await AttendanceRecord.find({});
    expect(records.length).toBe(1);
    expect(records[0].isPresent).toBe(false);
  });
});
