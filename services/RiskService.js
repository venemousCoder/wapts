const Notification = require('../models/Notification');
const eventBus = require('../utils/eventBus');

class RiskService {
  async evaluateAcademicRisk(studentId, cgpa, attendancePercentage, failedCoursesCount) {
    let riskLevel = 'Low';
    let riskReasons = [];

    // These thresholds could be fetched from SystemSettings in a real implementation
    if (cgpa < 1.5) {
      riskLevel = 'High';
      riskReasons.push('Critically low CGPA');
    } else if (cgpa < 2.0) {
      if (riskLevel !== 'High') riskLevel = 'Medium';
      riskReasons.push('Low CGPA');
    }

    if (attendancePercentage !== null && attendancePercentage < 75) {
      riskLevel = riskLevel === 'High' ? 'High' : 'Medium';
      riskReasons.push('Low overall attendance');
    }

    if (failedCoursesCount >= 3) {
      riskLevel = 'High';
      riskReasons.push('Multiple failed courses');
    }

    if (riskLevel === 'High' || riskLevel === 'Medium') {
      await this.generateRiskWarning(studentId, riskLevel, riskReasons);
    }

    return riskLevel;
  }

  async generateRiskWarning(studentId, riskLevel, reasons) {
    const message = `You have been flagged for ${riskLevel} academic risk due to: ${reasons.join(', ')}. Please contact your academic advisor.`;
    
    // Check if a similar recent unread warning exists to prevent spam
    const existing = await Notification.findOne({
      recipientId: studentId,
      type: 'Academic Warning',
      isRead: false
    });

    if (!existing) {
      const notification = new Notification({
        recipientId: studentId,
        title: 'Academic Risk Warning',
        message,
        type: 'Academic Warning',
        priority: riskLevel === 'High' ? 'Critical' : 'High'
      });
      await notification.save();
      // Optionally emit event for realtime socket.io updates later
      eventBus.emit('notification.created', notification);
    }
  }
}

module.exports = new RiskService();
