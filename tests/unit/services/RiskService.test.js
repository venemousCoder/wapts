/**
 * Unit Tests: RiskService
 * TC-RISK-001 through TC-RISK-010
 */
const mongoose = require('mongoose');
require('../../setup');

const RiskService = require('../../../services/RiskService');
const Notification = require('../../../models/Notification');
const { createTestUser } = require('../../helpers/testHelpers');

describe('RiskService', () => {
  let studentUser;

  beforeEach(async () => {
    studentUser = await createTestUser('Student', { loginIdentifier: `risk_test_${Date.now()}@test.edu` });
  });

  describe('evaluateAcademicRisk', () => {
    // TC-RISK-001: CGPA < 1.5 → High risk
    test('TC-RISK-001: should return High risk for CGPA below 1.5', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 1.2, 80, 0);
      expect(risk).toBe('High');
    });

    // TC-RISK-002: CGPA 1.5-1.99 → Medium risk
    test('TC-RISK-002: should return Medium risk for CGPA between 1.5 and 1.99', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 1.8, 80, 0);
      expect(risk).toBe('Medium');
    });

    // TC-RISK-003: CGPA ≥ 2.0, good attendance, <3 failures → Low risk
    test('TC-RISK-003: should return Low risk for good academic standing', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 3.5, 90, 1);
      expect(risk).toBe('Low');
    });

    // TC-RISK-004: Attendance < 75% → Medium or High
    test('TC-RISK-004: should flag Medium risk for low attendance', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 3.0, 60, 0);
      expect(risk).toBe('Medium');
    });

    // TC-RISK-005: failedCourses ≥ 3 → High risk
    test('TC-RISK-005: should return High risk for 3 or more failed courses', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 2.5, 80, 3);
      expect(risk).toBe('High');
    });

    // TC-RISK-006: Combined factors — low CGPA + low attendance
    test('TC-RISK-006: should escalate risk with combined factors', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 1.3, 60, 4);
      expect(risk).toBe('High');
    });

    // TC-RISK-007: Null attendance should not trigger risk
    test('TC-RISK-007: should not flag risk for null attendance percentage', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 3.5, null, 0);
      expect(risk).toBe('Low');
    });

    // TC-RISK-008: Boundary — CGPA exactly 1.5 → Medium
    test('TC-RISK-008: CGPA exactly 1.5 should be Medium not High', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 1.5, 80, 0);
      expect(risk).toBe('Medium');
    });

    // TC-RISK-009: Boundary — CGPA exactly 2.0 → Low
    test('TC-RISK-009: CGPA exactly 2.0 should be Low', async () => {
      const risk = await RiskService.evaluateAcademicRisk(studentUser._id, 2.0, 80, 0);
      expect(risk).toBe('Low');
    });
  });

  describe('generateRiskWarning', () => {
    // TC-RISK-010: Creates notification when none exists
    test('TC-RISK-010: should create notification for academic risk warning', async () => {
      await RiskService.generateRiskWarning(studentUser._id, 'High', ['Critically low CGPA']);
      const notifications = await Notification.find({ recipientId: studentUser._id });
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('Academic Warning');
      expect(notifications[0].priority).toBe('Critical');
    });

    // TC-RISK-011: Skips duplicate unread warning
    test('TC-RISK-011: should skip duplicate unread warning', async () => {
      await RiskService.generateRiskWarning(studentUser._id, 'High', ['Low CGPA']);
      await RiskService.generateRiskWarning(studentUser._id, 'High', ['Low CGPA again']);
      const notifications = await Notification.find({ recipientId: studentUser._id });
      expect(notifications.length).toBe(1);
    });

    // TC-RISK-012: Medium risk has High priority
    test('TC-RISK-012: Medium risk warning should have High priority', async () => {
      await RiskService.generateRiskWarning(studentUser._id, 'Medium', ['Low attendance']);
      const notification = await Notification.findOne({ recipientId: studentUser._id });
      expect(notification.priority).toBe('High');
    });
  });
});
