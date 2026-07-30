const Enrollment = require('../models/Enrollment');
const Curriculum = require('../models/Curriculum');
const StudentProfile = require('../models/StudentProfile');
const CourseOffering = require('../models/CourseOffering');
const mongoose = require('mongoose');

class EnrollmentService {
  async enrollStudent(studentUserId, courseOfferingId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const student = await StudentProfile.findOne({ userId: studentUserId, isDeleted: false }).session(session);
      if (!student) throw new Error('Student not found');

      const offering = await CourseOffering.findById(courseOfferingId).session(session);
      if (!offering) throw new Error('Course offering not found');

      // Validate against curriculum
      const curriculum = await Curriculum.findOne({
        departmentId: student.departmentId,
        level: student.level,
        semesterId: offering.semesterId,
        isDeleted: false
      }).session(session);

      if (!curriculum) {
        throw new Error('No curriculum found for this student level and semester');
      }

      const isValidCourse = curriculum.requiredCourses.includes(offering.courseId) || 
                            curriculum.electiveCourses.includes(offering.courseId);

      if (!isValidCourse) {
        throw new Error('Course offering is not part of the student curriculum');
      }

      const enrollment = new Enrollment({
        studentId: student._id,
        courseOfferingId: offering._id,
        status: 'Enrolled'
      });

      await enrollment.save({ session });
      
      await session.commitTransaction();
      session.endSession();
      
      const eventBus = require('../utils/eventBus');
      eventBus.emit('student.enrolled', { enrollmentId: enrollment._id });
      
      return enrollment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async dropEnrollment(enrollmentId) {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    
    enrollment.status = 'Dropped';
    await enrollment.save();
    
    const eventBus = require('../utils/eventBus');
    eventBus.emit('student.withdrawn', { enrollmentId: enrollment._id });
    
    return enrollment;
  }
}

module.exports = new EnrollmentService();
