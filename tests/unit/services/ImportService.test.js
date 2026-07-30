/**
 * Unit Tests: ImportService
 * TC-IMPORT-001 through TC-IMPORT-005
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('../../setup');

const ImportService = require('../../../services/ImportService');
const StudentAssessment = require('../../../models/StudentAssessment');
const Assessment = require('../../../models/Assessment');
const AssessmentType = require('../../../models/AssessmentType');
const { createTestDepartment, createTestCourse, createStudentWithProfile, createLecturerWithProfile, createFullEnrollmentChain } = require('../../helpers/testHelpers');

describe('ImportService', () => {
  const tmpDir = path.join(__dirname, '..', '..', 'tmp');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('parseCSV', () => {
    test('TC-IMPORT-001: should parse valid CSV data', async () => {
      const csvPath = path.join(tmpDir, 'test_scores.csv');
      fs.writeFileSync(csvPath, 'registrationNumber,score\nSTU001,85\nSTU002,72\n');
      const data = await ImportService.parseCSV(csvPath);
      expect(data.length).toBe(2);
      expect(data[0].registrationNumber).toBe('STU001');
      expect(data[0].score).toBe('85');
    });

    test('TC-IMPORT-002: should handle empty CSV', async () => {
      const csvPath = path.join(tmpDir, 'empty.csv');
      fs.writeFileSync(csvPath, 'registrationNumber,score\n');
      const data = await ImportService.parseCSV(csvPath);
      expect(data.length).toBe(0);
    });
  });

  describe('validateAssessmentScores', () => {
    test('TC-IMPORT-003: should identify invalid rows', async () => {
      const csvData = [
        { registrationNumber: '', score: '85' },
        { registrationNumber: 'NONEXIST', score: '70' },
        { registrationNumber: 'STU003', score: 'abc' }
      ];
      const fakeAssId = new mongoose.Types.ObjectId();
      const { errors, validData } = await ImportService.validateAssessmentScores(csvData, fakeAssId);
      expect(errors.length).toBeGreaterThan(0);
      expect(validData.length).toBe(0);
    });

    test('TC-IMPORT-004: should validate correctly with existing students', async () => {
      const dept = await createTestDepartment();
      const student = await createStudentWithProfile(dept._id, {
        user: { loginIdentifier: 'REGVAL001', loginType: 'REG_NUMBER' }
      });
      const csvData = [{ registrationNumber: 'REGVAL001', score: '90' }];
      const fakeAssId = new mongoose.Types.ObjectId();
      const { errors, validData } = await ImportService.validateAssessmentScores(csvData, fakeAssId);
      expect(validData.length).toBe(1);
      expect(validData[0].score).toBe(90);
    });
  });

  describe('importAssessmentScores', () => {
    test('TC-IMPORT-005: should upsert scores within transaction', async () => {
      const dept = await createTestDepartment();
      const student = await createStudentWithProfile(dept._id);
      const assType = new AssessmentType({ name: 'Quiz', defaultWeight: 20 });
      await assType.save();
      const assessment = new Assessment({ courseOfferingId: new mongoose.Types.ObjectId(), assessmentTypeId: assType._id, weight: 20, maximumScore: 100, dueDate: new Date() });
      await assessment.save();

      const validData = [{ studentId: student.profile._id, score: 88, regNum: 'R1' }];
      const result = await ImportService.importAssessmentScores(validData, assessment._id);
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);

      const sa = await StudentAssessment.findOne({ assessmentId: assessment._id, studentId: student.profile._id });
      expect(sa.score).toBe(88);
    });
  });
});
