const GradeService = require('./GradeService');
const CreditService = require('./CreditService');
const RiskService = require('./RiskService');
const ClassificationService = require('./ClassificationService');
const DashboardSnapshot = require('../models/DashboardSnapshot');
const StudentProfile = require('../models/StudentProfile');
const Result = require('../models/Result');
const Enrollment = require('../models/Enrollment');
const eventBus = require('../utils/eventBus');

class ProgressService {
  constructor() {
    this.registerEventListeners();
  }

  registerEventListeners() {
    // When a result is published, regenerate snapshot for the student
    eventBus.on('result.published', async (data) => {
      await this.updateStudentProgress(data.studentId);
      
      const GoalTrackingService = require('./GoalTrackingService');
      await GoalTrackingService.updateStudentGoal(data.studentId);
    });
    
    eventBus.on('attendance.recorded', async (data) => {
      const AttendanceRecord = require('../models/AttendanceRecord');
      const records = await AttendanceRecord.find({ attendanceSessionId: data.attendanceSessionId }).populate('studentId');
      const userIds = [...new Set(records.map(r => r.studentId.userId.toString()))];
      for (const uid of userIds) {
        await this.updateStudentProgress(uid);
      }
    });
    
    eventBus.on('student.enrolled', async (data) => {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findById(data.enrollmentId).populate('studentId');
      if (enrollment && enrollment.studentId) {
        await this.updateStudentProgress(enrollment.studentId.userId);
      }
    });
  }

  async updateStudentProgress(studentId) {
    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) return;

    const enrollments = await Enrollment.find({ studentId: student._id });
    const enrollmentIds = enrollments.map(e => e._id);
    
    const results = await Result.find({
      enrollmentId: { $in: enrollmentIds },
      status: 'Published'
    }).populate({
      path: 'enrollmentId',
      populate: { path: 'courseOfferingId', populate: { path: 'courseId' } }
    });

    // 1. Calculate Credits
    const earnedCredits = CreditService.calculateCreditsEarned(results);
    const attemptedCredits = CreditService.calculateCreditsAttempted(results);
    
    student.totalCreditsEarned = earnedCredits;
    student.totalCreditsAttempted = attemptedCredits;

    // 2. Calculate CGPA
    let cgpa = 0;
    if (attemptedCredits > 0) {
      let totalGradePoints = 0;
      for (const result of results) {
        const credits = result.enrollmentId.courseOfferingId.courseId.creditUnits || 0;
        totalGradePoints += (result.gradePoint * credits);
      }
      cgpa = parseFloat((totalGradePoints / attemptedCredits).toFixed(2));
    }
    student.currentCGPA = cgpa;
    await student.save();

    // 3. Risk Evaluation
    // Calculate actual attendance percentage
    const AttendanceRecord = require('../models/AttendanceRecord');
    const allRecords = await AttendanceRecord.find({ studentId: student._id });
    let attendancePercentage = 100;
    if (allRecords.length > 0) {
      const presentCount = allRecords.filter(r => r.isPresent).length;
      attendancePercentage = (presentCount / allRecords.length) * 100;
    }
    
    const failedCount = results.filter(r => !r.isPass).length;
    const riskLevel = await RiskService.evaluateAcademicRisk(student.userId, cgpa, attendancePercentage, failedCount);

    // 4. Classification
    const currentClassification = await ClassificationService.determineClassification(cgpa);
    const expectedClassification = currentClassification; // simplified for now

    // 5. Update Dashboard Snapshot
    let snapshot = await DashboardSnapshot.findOne({ userId: student.userId });
    if (!snapshot) {
      snapshot = new DashboardSnapshot({ userId: student.userId, role: 'Student' });
    }
    
    snapshot.currentCGPA = cgpa;
    snapshot.creditsEarned = earnedCredits;
    snapshot.creditsRemaining = 120 - earnedCredits; // assuming 120 total required
    snapshot.currentClassification = currentClassification;
    snapshot.expectedClassification = expectedClassification;
    snapshot.riskLevel = riskLevel;
    snapshot.lastUpdated = new Date();
    
    await snapshot.save();
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Updated Progress and Snapshot for student ${student.userId}`);
    }
  }
}

module.exports = new ProgressService();
