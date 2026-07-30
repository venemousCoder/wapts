/**
 * Unit Tests: AttendanceService
 * TC-ATTEND-001 through TC-ATTEND-004
 */
const mongoose = require('mongoose');
require('../../setup');

const AttendanceService = require('../../../services/AttendanceService');
const AttendanceSession = require('../../../models/AttendanceSession');
const AttendanceRecord = require('../../../models/AttendanceRecord');
const eventBus = require('../../../utils/eventBus');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain } = require('../../helpers/testHelpers');

describe('AttendanceService', () => {
  let dept, course, student, lecturer, chain;

  beforeEach(async () => {
    dept = await createTestDepartment();
    course = await createTestCourse(dept._id);
    student = await createStudentWithProfile(dept._id);
    lecturer = await createLecturerWithProfile(dept._id);
    chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);
  });

  describe('createSession', () => {
    test('TC-ATTEND-001: should create attendance session', async () => {
      const s = await AttendanceService.createSession(chain.offering._id, 1, new Date(), 'Intro');
      expect(s._id).toBeDefined();
      expect(s.week).toBe(1);
      const found = await AttendanceSession.findById(s._id);
      expect(found).toBeDefined();
    });
  });

  describe('recordAttendance', () => {
    test('TC-ATTEND-003: should create records', async () => {
      const s = await AttendanceService.createSession(chain.offering._id, 1, new Date(), 'T');
      const records = await AttendanceService.recordAttendance(s._id, [{ studentId: student.profile._id, isPresent: true }]);
      expect(records.length).toBe(1);
      expect(records[0].isPresent).toBe(true);
    });

    test('TC-ATTEND-004: should emit event', async () => {
      const s = await AttendanceService.createSession(chain.offering._id, 1, new Date(), 'T');
      const spy = jest.fn();
      eventBus.on('attendance.recorded', spy);
      await AttendanceService.recordAttendance(s._id, [{ studentId: student.profile._id, isPresent: true }]);
      expect(spy).toHaveBeenCalled();
      eventBus.off('attendance.recorded', spy);
    });
  });
});
