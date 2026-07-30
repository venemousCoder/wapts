const StudentProfile = require('../models/StudentProfile');
const Result = require('../models/Result');
const Enrollment = require('../models/Enrollment');
const CourseOffering = require('../models/CourseOffering');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const AcademicSession = require('../models/AcademicSession');

class ReportService {
  async generateTranscriptData(studentId) {
    const student = await StudentProfile.findOne({ userId: studentId, isDeleted: false }).populate('departmentId');
    if (!student) throw new Error('Student not found');

    const enrollments = await Enrollment.find({ studentId: student._id });
    const enrollmentIds = enrollments.map(e => e._id);

    const results = await Result.find({ 
      enrollmentId: { $in: enrollmentIds },
      status: 'Published'
    }).populate({
      path: 'enrollmentId',
      populate: {
        path: 'courseOfferingId',
        populate: [
          { path: 'courseId', select: 'code title creditUnits' },
          { path: 'semesterId', select: 'name' },
          { path: 'sessionId', select: 'name' }
        ]
      }
    });

    // Group results by session and semester
    const groupedResults = {};
    
    results.forEach(result => {
      const offering = result.enrollmentId.courseOfferingId;
      const sessionName = offering.sessionId.name;
      const semesterName = offering.semesterId.name;
      const key = `${sessionName} - ${semesterName}`;
      
      if (!groupedResults[key]) {
        groupedResults[key] = {
          sessionName,
          semesterName,
          results: [],
          totalCredits: 0,
          totalGradePoints: 0
        };
      }
      
      groupedResults[key].results.push(result);
      const credits = offering.courseId.creditUnits || 0;
      groupedResults[key].totalCredits += credits;
      groupedResults[key].totalGradePoints += (result.gradePoint * credits);
    });

    // Calculate Semester GPAs
    Object.keys(groupedResults).forEach(key => {
      const group = groupedResults[key];
      group.gpa = group.totalCredits > 0 ? (group.totalGradePoints / group.totalCredits).toFixed(2) : 0;
    });

    return {
      student,
      academicRecord: Object.values(groupedResults),
      cgpa: student.currentCGPA,
      creditsEarned: student.totalCreditsEarned,
      classification: student.graduationStatus // Depending on how we store classification
    };
  }
}

module.exports = new ReportService();
