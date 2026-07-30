/**
 * Unit Tests: ReportService
 * TC-REPORT-001 through TC-REPORT-003
 */
const mongoose = require('mongoose');
require('../../setup');

const ReportService = require('../../../services/ReportService');
const Result = require('../../../models/Result');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain, createTestGradeScales } = require('../../helpers/testHelpers');

describe('ReportService', () => {
  describe('generateTranscriptData', () => {
    test('TC-REPORT-001: should throw for non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(ReportService.generateTranscriptData(fakeId)).rejects.toThrow('Student not found');
    });

    test('TC-REPORT-002: should return empty record for student with no results', async () => {
      const dept = await createTestDepartment();
      const student = await createStudentWithProfile(dept._id);
      const data = await ReportService.generateTranscriptData(student.user._id);
      expect(data.student).toBeDefined();
      expect(data.academicRecord.length).toBe(0);
    });

    test('TC-REPORT-003: should group results by session/semester', async () => {
      await createTestGradeScales();
      const dept = await createTestDepartment();
      const course = await createTestCourse(dept._id);
      const student = await createStudentWithProfile(dept._id);
      const lecturer = await createLecturerWithProfile(dept._id);
      const chain = await createFullEnrollmentChain(dept._id, student.profile, lecturer.profile, course);

      // Create a published result
      const result = new Result({
        enrollmentId: chain.enrollment._id,
        finalScore: 75,
        letterGrade: 'A',
        gradePoint: 5.0,
        isPass: true,
        status: 'Published'
      });
      await result.save();

      const data = await ReportService.generateTranscriptData(student.user._id);
      expect(data.academicRecord.length).toBeGreaterThanOrEqual(1);
      expect(data.academicRecord[0].results.length).toBe(1);
    });
  });
});
