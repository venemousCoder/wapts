/**
 * Unit Tests: ClassificationService
 * TC-CLASS-001 through TC-CLASS-005
 */
const mongoose = require('mongoose');
require('../../setup');

const ClassificationService = require('../../../services/ClassificationService');
const { createTestClassifications } = require('../../helpers/testHelpers');

describe('ClassificationService', () => {
  beforeEach(async () => {
    await createTestClassifications();
  });

  describe('getActiveClassifications', () => {
    test('TC-CLASS-001: should return active classifications sorted descending', async () => {
      const cls = await ClassificationService.getActiveClassifications();
      expect(cls.length).toBe(5);
      for (let i = 0; i < cls.length - 1; i++) {
        expect(cls[i].minimumCGPA).toBeGreaterThanOrEqual(cls[i + 1].minimumCGPA);
      }
    });
  });

  describe('determineClassification', () => {
    test('TC-CLASS-002: CGPA 4.7 → First Class', async () => {
      expect(await ClassificationService.determineClassification(4.7)).toBe('First Class');
    });

    test('TC-CLASS-003: CGPA 3.8 → Second Class Upper', async () => {
      expect(await ClassificationService.determineClassification(3.8)).toBe('Second Class Upper');
    });

    test('TC-CLASS-004: CGPA 2.5 → Second Class Lower', async () => {
      expect(await ClassificationService.determineClassification(2.5)).toBe('Second Class Lower');
    });

    test('TC-CLASS-005: CGPA 0.5 → Unclassified', async () => {
      expect(await ClassificationService.determineClassification(0.5)).toBe('Unclassified');
    });
  });

  describe('getRemainingCGPAForNextClassification', () => {
    test('TC-CLASS-006: should calculate remaining CGPA for next tier', async () => {
      const remaining = await ClassificationService.getRemainingCGPAForNextClassification(3.0);
      expect(remaining).toBe(0.5); // 3.50 - 3.0
    });

    test('TC-CLASS-007: should return 0 at highest classification', async () => {
      const remaining = await ClassificationService.getRemainingCGPAForNextClassification(5.0);
      expect(remaining).toBe(0);
    });
  });
});
