/**
 * Unit Tests: CreditService
 * TC-CREDIT-001 through TC-CREDIT-007
 */
const CreditService = require('../../../services/CreditService');

describe('CreditService', () => {
  describe('calculateCreditsEarned', () => {
    // TC-CREDIT-001: Sums credits only for passed results
    test('TC-CREDIT-001: should sum credits only for passed results', () => {
      const results = [
        { isPass: true, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 3 } } } },
        { isPass: false, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 4 } } } },
        { isPass: true, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 2 } } } }
      ];
      expect(CreditService.calculateCreditsEarned(results)).toBe(5);
    });

    // TC-CREDIT-002: Returns 0 for empty array
    test('TC-CREDIT-002: should return 0 for empty results', () => {
      expect(CreditService.calculateCreditsEarned([])).toBe(0);
    });

    // TC-CREDIT-003: Returns 0 when all results are failures
    test('TC-CREDIT-003: should return 0 when all results fail', () => {
      const results = [
        { isPass: false, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 3 } } } },
        { isPass: false, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 4 } } } }
      ];
      expect(CreditService.calculateCreditsEarned(results)).toBe(0);
    });

    // TC-CREDIT-004: Handles missing creditUnits gracefully
    test('TC-CREDIT-004: should handle missing credit units with 0 fallback', () => {
      const results = [
        { isPass: true, enrollmentId: { courseOfferingId: { courseId: {} } } },
        { isPass: true, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 3 } } } }
      ];
      expect(CreditService.calculateCreditsEarned(results)).toBe(3);
    });
  });

  describe('calculateCreditsAttempted', () => {
    // TC-CREDIT-005: Sums all credits regardless of pass/fail
    test('TC-CREDIT-005: should sum all credits regardless of pass/fail', () => {
      const results = [
        { isPass: true, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 3 } } } },
        { isPass: false, enrollmentId: { courseOfferingId: { courseId: { creditUnits: 4 } } } }
      ];
      expect(CreditService.calculateCreditsAttempted(results)).toBe(7);
    });

    // TC-CREDIT-006: Returns 0 for empty array
    test('TC-CREDIT-006: should return 0 for empty results', () => {
      expect(CreditService.calculateCreditsAttempted([])).toBe(0);
    });
  });

  describe('calculateGraduationProgress', () => {
    // TC-CREDIT-007: Correct percentage calculation
    test('TC-CREDIT-007: should calculate correct graduation progress percentage', () => {
      expect(CreditService.calculateGraduationProgress(60, 120)).toBe(50.00);
    });

    // TC-CREDIT-008: Division by zero returns 0
    test('TC-CREDIT-008: should return 0 when total required credits is 0', () => {
      expect(CreditService.calculateGraduationProgress(60, 0)).toBe(0);
    });

    // TC-CREDIT-009: 100% when all credits earned
    test('TC-CREDIT-009: should return 100 when all credits earned', () => {
      expect(CreditService.calculateGraduationProgress(120, 120)).toBe(100.00);
    });

    // TC-CREDIT-010: 0 credits earned
    test('TC-CREDIT-010: should return 0 when no credits earned', () => {
      expect(CreditService.calculateGraduationProgress(0, 120)).toBe(0);
    });
  });
});
