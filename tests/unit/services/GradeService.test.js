/**
 * Unit Tests: GradeService
 * TC-GRADE-001 through TC-GRADE-010
 */
const mongoose = require('mongoose');
require('../../setup');

const GradeScale = require('../../../models/GradeScale');
const SystemSetting = require('../../../models/SystemSetting');
const GradeService = require('../../../services/GradeService');
const { createTestGradeScales } = require('../../helpers/testHelpers');

describe('GradeService', () => {
  beforeEach(async () => {
    await createTestGradeScales();
  });

  describe('getActiveGradeScales', () => {
    // TC-GRADE-001: Returns active grade scales sorted by minimumScore descending
    test('TC-GRADE-001: should return active grade scales sorted by minimumScore descending', async () => {
      const scales = await GradeService.getActiveGradeScales();
      expect(scales).toBeDefined();
      expect(scales.length).toBe(6);
      // Should be sorted descending by minimumScore
      for (let i = 0; i < scales.length - 1; i++) {
        expect(scales[i].minimumScore).toBeGreaterThanOrEqual(scales[i + 1].minimumScore);
      }
    });

    // TC-GRADE-002: Does not return inactive grade scales
    test('TC-GRADE-002: should not return inactive grade scales', async () => {
      await GradeScale.updateOne({ letterGrade: 'E' }, { isActive: false });
      const scales = await GradeService.getActiveGradeScales();
      expect(scales.length).toBe(5);
      expect(scales.find(s => s.letterGrade === 'E')).toBeUndefined();
    });
  });

  describe('convertScoreToGrade', () => {
    // TC-GRADE-003: Score of 75 → Grade A
    test('TC-GRADE-003: should return grade A for score 75', async () => {
      const result = await GradeService.convertScoreToGrade(75);
      expect(result.letterGrade).toBe('A');
      expect(result.gradePoint).toBe(5.0);
      expect(result.isPass).toBe(true);
    });

    // TC-GRADE-004: Score of 65 → Grade B
    test('TC-GRADE-004: should return grade B for score 65', async () => {
      const result = await GradeService.convertScoreToGrade(65);
      expect(result.letterGrade).toBe('B');
      expect(result.gradePoint).toBe(4.0);
      expect(result.isPass).toBe(true);
    });

    // TC-GRADE-005: Score of 55 → Grade C
    test('TC-GRADE-005: should return grade C for score 55', async () => {
      const result = await GradeService.convertScoreToGrade(55);
      expect(result.letterGrade).toBe('C');
      expect(result.gradePoint).toBe(3.0);
      expect(result.isPass).toBe(true);
    });

    // TC-GRADE-006: Score of 47 → Grade D
    test('TC-GRADE-006: should return grade D for score 47', async () => {
      const result = await GradeService.convertScoreToGrade(47);
      expect(result.letterGrade).toBe('D');
      expect(result.gradePoint).toBe(2.0);
      expect(result.isPass).toBe(true);
    });

    // TC-GRADE-007: Score of 42 → Grade E
    test('TC-GRADE-007: should return grade E for score 42', async () => {
      const result = await GradeService.convertScoreToGrade(42);
      expect(result.letterGrade).toBe('E');
      expect(result.gradePoint).toBe(1.0);
      expect(result.isPass).toBe(true);
    });

    // TC-GRADE-008: Score of 30 → Grade F
    test('TC-GRADE-008: should return grade F for score 30', async () => {
      const result = await GradeService.convertScoreToGrade(30);
      expect(result.letterGrade).toBe('F');
      expect(result.gradePoint).toBe(0);
      expect(result.isPass).toBe(false);
    });

    // TC-GRADE-009: Boundary — score exactly 70 → Grade A
    test('TC-GRADE-009: boundary score 70 should return grade A', async () => {
      const result = await GradeService.convertScoreToGrade(70);
      expect(result.letterGrade).toBe('A');
      expect(result.gradePoint).toBe(5.0);
    });

    // TC-GRADE-010: Boundary — score exactly 69 → Grade B
    test('TC-GRADE-010: boundary score 69 should return grade B', async () => {
      const result = await GradeService.convertScoreToGrade(69);
      expect(result.letterGrade).toBe('B');
      expect(result.gradePoint).toBe(4.0);
    });

    // TC-GRADE-011: Score of 100 → Grade A
    test('TC-GRADE-011: score 100 should return grade A', async () => {
      const result = await GradeService.convertScoreToGrade(100);
      expect(result.letterGrade).toBe('A');
      expect(result.gradePoint).toBe(5.0);
    });

    // TC-GRADE-012: Score of 0 → Grade F
    test('TC-GRADE-012: score 0 should return grade F', async () => {
      const result = await GradeService.convertScoreToGrade(0);
      expect(result.letterGrade).toBe('F');
      expect(result.gradePoint).toBe(0);
      expect(result.isPass).toBe(false);
    });
  });

  describe('calculateSemesterGPA', () => {
    // TC-GRADE-013: Correct weighted GPA calculation
    test('TC-GRADE-013: should calculate weighted GPA correctly', async () => {
      const results = [
        { gradePoint: 5.0, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 3 } } } },
        { gradePoint: 4.0, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 3 } } } },
        { gradePoint: 3.0, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 2 } } } }
      ];
      // (5*3 + 4*3 + 3*2) / (3+3+2) = (15+12+6)/8 = 33/8 = 4.13
      const gpa = await GradeService.calculateSemesterGPA(results);
      expect(gpa).toBe(4.13);
    });

    // TC-GRADE-014: Empty results returns 0
    test('TC-GRADE-014: should return 0 for empty results array', async () => {
      const gpa = await GradeService.calculateSemesterGPA([]);
      expect(gpa).toBe(0);
    });

    // TC-GRADE-015: Handles missing credit units
    test('TC-GRADE-015: should handle results with missing credit units gracefully', async () => {
      const results = [
        { gradePoint: 5.0, enrollmentId: { courseOfferingId: { courseId: {} } } },
        { gradePoint: 4.0, enrollmentId: null }
      ];
      const gpa = await GradeService.calculateSemesterGPA(results);
      expect(gpa).toBe(0);
    });
  });
});
