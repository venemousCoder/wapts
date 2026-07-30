const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const Result = require('../models/Result');
const SystemSetting = require('../models/SystemSetting');
const AuditLog = require('../models/AuditLog');
const StudentProfile = require('../models/StudentProfile');

class RegistrationService {
  /**
   * Log an action to the AuditLog
   */
  static async logAction(userId, action, resource, resourceId, previousState, newState) {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      previousState,
      newState
    });
  }

  /**
   * Register a student for a single course offering
   */
  static async registerStudent(studentId, courseOfferingId, coordinatorId) {
    const student = await StudentProfile.findById(studentId);
    if (!student) throw new Error('Student not found');

    const offering = await CourseOffering.findById(courseOfferingId).populate('courseId');
    if (!offering) throw new Error('Course offering not found');

    // Rule 1: Must belong to student's department
    if (offering.courseId.departmentId.toString() !== student.departmentId.toString()) {
      throw new Error('Course does not belong to the student\'s department');
    }

    // Rule 2: Offering must be published
    if (offering.status !== 'Published') {
      throw new Error('Course offering is not published');
    }

    // Rule 3: Must be active session/semester
    const settings = await SystemSetting.findOne();
    if (!settings) throw new Error('System settings not configured');
    
    if (offering.sessionId.toString() !== settings.currentAcademicSession.toString() || 
        offering.semesterId.toString() !== settings.currentSemester.toString()) {
      throw new Error('Course offering does not belong to the current active session and semester');
    }

    // Rule 4: Duplicate registration prevention
    const existingEnrollment = await Enrollment.findOne({ studentId, courseOfferingId });
    if (existingEnrollment) {
      throw new Error('Student is already registered for this course offering');
    }

    // Rule 5: Credit limit validation
    const currentEnrollments = await Enrollment.find({
      studentId,
      status: 'Enrolled'
    }).populate({
      path: 'courseOfferingId',
      populate: { path: 'courseId' }
    });

    let currentCredits = 0;
    for (const enr of currentEnrollments) {
      if (enr.courseOfferingId.sessionId.toString() === settings.currentAcademicSession.toString() &&
          enr.courseOfferingId.semesterId.toString() === settings.currentSemester.toString()) {
        currentCredits += enr.courseOfferingId.courseId.creditUnits;
      }
    }

    if (currentCredits + offering.courseId.creditUnits > settings.maxCreditLoad) {
      throw new Error(`Registration rejected. Maximum credit load of ${settings.maxCreditLoad} exceeded.`);
    }

    // Rule 6: Previously passed course check
    // We check all previous enrollments for this specific Course ID
    const pastEnrollments = await Enrollment.find({ studentId }).populate('courseOfferingId');
    for (const enr of pastEnrollments) {
      if (enr.courseOfferingId.courseId.toString() === offering.courseId._id.toString()) {
        const result = await Result.findOne({ enrollmentId: enr._id, isPass: true });
        if (result) {
          throw new Error('Student has already passed this course');
        }
      }
    }

    // Execute registration
    const enrollment = new Enrollment({
      studentId,
      courseOfferingId,
      status: 'Enrolled'
    });
    
    await enrollment.save();
    
    // Update enrollment count on offering
    await CourseOffering.findByIdAndUpdate(courseOfferingId, { $inc: { enrollmentCount: 1 } });

    await this.logAction(coordinatorId, 'REGISTER_COURSE', 'Enrollment', enrollment._id, null, { courseOfferingId });

    return enrollment;
  }

  /**
   * Remove a registered course
   */
  static async removeRegistration(studentId, courseOfferingId, coordinatorId) {
    const enrollment = await Enrollment.findOne({ studentId, courseOfferingId, status: 'Enrolled' });
    if (!enrollment) throw new Error('Active registration not found');

    await Enrollment.findByIdAndDelete(enrollment._id);

    // Update enrollment count
    await CourseOffering.findByIdAndUpdate(courseOfferingId, { $inc: { enrollmentCount: -1 } });

    await this.logAction(coordinatorId, 'REMOVE_COURSE', 'Enrollment', enrollment._id, { courseOfferingId }, null);
  }

  /**
   * Apply recommended registration to a single student
   */
  static async applyRecommendedRegistration(studentId, level, departmentId, sessionId, semesterId, coordinatorId) {
    const recommendedOfferings = await CourseOffering.find({
      sessionId,
      semesterId,
      status: 'Published'
    }).populate('courseId');

    const validOfferings = recommendedOfferings.filter(off => 
      off.courseId.level === parseInt(level) && 
      off.courseId.departmentId.toString() === departmentId.toString()
    );

    const successfulRegistrations = [];
    const errors = [];

    for (const offering of validOfferings) {
      try {
        await this.registerStudent(studentId, offering._id, coordinatorId);
        successfulRegistrations.push(offering.courseId.code);
      } catch (err) {
        errors.push(`${offering.courseId.code}: ${err.message}`);
      }
    }

    return { successfulRegistrations, errors };
  }

  /**
   * Apply recommended registration to an entire cohort
   */
  static async applyCohortRegistration(level, departmentId, sessionId, semesterId, coordinatorId) {
    const students = await StudentProfile.find({
      level: parseInt(level),
      departmentId,
      isDeleted: false
    });

    let successCount = 0;
    const errors = [];

    for (const student of students) {
      try {
        const res = await this.applyRecommendedRegistration(student._id, level, departmentId, sessionId, semesterId, coordinatorId);
        if (res.successfulRegistrations.length > 0) {
          successCount++;
        }
      } catch (err) {
        errors.push(`Student ${student.loginIdentifier}: ${err.message}`);
      }
    }

    return { studentsProcessed: students.length, successCount, errors };
  }
}

module.exports = RegistrationService;
