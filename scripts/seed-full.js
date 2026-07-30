const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

// Import all models
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const GradeScale = require('../models/GradeScale');
const Department = require('../models/Department');
const HodProfile = require('../models/HodProfile');
const LecturerProfile = require('../models/LecturerProfile');
const StudentProfile = require('../models/StudentProfile');
const AcademicSession = require('../models/AcademicSession');
const Semester = require('../models/Semester');
const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');
const AssessmentType = require('../models/AssessmentType');
const Assessment = require('../models/Assessment');
const StudentAssessment = require('../models/StudentAssessment');
const Result = require('../models/Result');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/wapts_dev');
    console.log('Connected.');

    console.log('Clearing existing data...');
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
    console.log('Database cleared.');

    // 1. Settings & Grade Scales
    const adminHash = await bcrypt.hash('password123', 10);
    const admin = await User.create({
      loginIdentifier: 'admin',
      loginType: 'ADMIN_USERNAME',
      passwordHash: adminHash,
      role: 'Admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@wapts.edu'
    });

    const setting = await SystemSetting.create({
      institutionName: 'WAPTS University',
      academicYear: '2025/2026',
      activeSemester: 'First',
      maxCreditUnitsPerSemester: 24,
      minimumPassGrade: 40
    });

    await GradeScale.create([
      { minimumScore: 70, maximumScore: 100, letterGrade: 'A', gradePoint: 5 },
      { minimumScore: 60, maximumScore: 69.99, letterGrade: 'B', gradePoint: 4 },
      { minimumScore: 50, maximumScore: 59.99, letterGrade: 'C', gradePoint: 3 },
      { minimumScore: 45, maximumScore: 49.99, letterGrade: 'D', gradePoint: 2 },
      { minimumScore: 40, maximumScore: 44.99, letterGrade: 'E', gradePoint: 1 },
      { minimumScore: 0,  maximumScore: 39.99, letterGrade: 'F', gradePoint: 0 }
    ]);
    console.log('Admin, Settings & Grade Scales created.');

    // 2. Departments & HODs
    const deptCS = await Department.create({ name: 'Computer Science', code: 'CSC', faculty: 'Science' });
    const deptSE = await Department.create({ name: 'Software Engineering', code: 'SEN', faculty: 'Engineering' });

    const hodCsUser = await User.create({
      loginIdentifier: 'hod.csc@wapts.edu', loginType: 'INSTITUTIONAL_EMAIL', passwordHash: adminHash,
      role: 'HOD', firstName: 'Alan', lastName: 'Turing', email: 'hod.csc@wapts.edu'
    });
    const hodCs = await HodProfile.create({ userId: hodCsUser._id, departmentId: deptCS._id, appointmentDate: new Date() });
    
    const hodSeUser = await User.create({
      loginIdentifier: 'hod.sen@wapts.edu', loginType: 'INSTITUTIONAL_EMAIL', passwordHash: adminHash,
      role: 'HOD', firstName: 'Ada', lastName: 'Lovelace', email: 'hod.sen@wapts.edu'
    });
    const hodSe = await HodProfile.create({ userId: hodSeUser._id, departmentId: deptSE._id, appointmentDate: new Date() });

    // Update Departments with HODs
    deptCS.currentHodId = hodCsUser._id;
    await deptCS.save();
    deptSE.currentHodId = hodSeUser._id;
    await deptSE.save();
    console.log('Departments & HODs created.');

    // 3. Lecturers
    const lect1User = await User.create({
      loginIdentifier: 'ST-1001', loginType: 'INSTITUTIONAL_EMAIL', passwordHash: adminHash,
      role: 'Lecturer', firstName: 'John', lastName: 'Von Neumann', email: 'john@wapts.edu'
    });
    const lect1 = await LecturerProfile.create({ userId: lect1User._id, departmentId: deptCS._id, designation: 'Professor', approvalStatus: 'Active' });

    const lect2User = await User.create({
      loginIdentifier: 'ST-1002', loginType: 'INSTITUTIONAL_EMAIL', passwordHash: adminHash,
      role: 'Lecturer', firstName: 'Grace', lastName: 'Hopper', email: 'grace@wapts.edu'
    });
    // Grace Hopper is a Level Coordinator for 100L SEN
    const lect2 = await LecturerProfile.create({ userId: lect2User._id, departmentId: deptSE._id, designation: 'Senior Lecturer', approvalStatus: 'Active', responsibilities: ['LEVEL_COORDINATOR'], assignedLevels: [100] });

    const lect3User = await User.create({
      loginIdentifier: 'ST-1003', loginType: 'INSTITUTIONAL_EMAIL', passwordHash: adminHash,
      role: 'Lecturer', firstName: 'Linus', lastName: 'Torvalds', email: 'linus@wapts.edu'
    });
    const lect3 = await LecturerProfile.create({ userId: lect3User._id, departmentId: deptSE._id, designation: 'Lecturer I', approvalStatus: 'Active' });

    console.log('Lecturers created.');

    // 4. Academic Session & Semester
    const acadSession = await AcademicSession.create({ name: '2025/2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-06-30'), isCurrent: true });
    const semester = await Semester.create({ name: 'First Semester', sessionId: acadSession._id, startDate: new Date('2025-09-01'), endDate: new Date('2026-01-31'), isCurrent: true });

    // 5. Courses & Course Offerings
    const course1 = await Course.create({ code: 'CSC101', title: 'Introduction to Computer Science', creditUnits: 3, level: 100, departmentId: deptCS._id, programme: 'BSc Computer Science' });
    const course2 = await Course.create({ code: 'SEN101', title: 'Introduction to Software Engineering', creditUnits: 3, level: 100, departmentId: deptSE._id, programme: 'BSc Software Engineering' });
    const course3 = await Course.create({ code: 'CSC201', title: 'Data Structures', creditUnits: 4, level: 200, departmentId: deptCS._id, programme: 'BSc Computer Science' });

    const offering1 = await CourseOffering.create({ courseId: course1._id, sessionId: acadSession._id, semesterId: semester._id, lecturerId: lect1._id, status: 'Published' });
    const offering2 = await CourseOffering.create({ courseId: course2._id, sessionId: acadSession._id, semesterId: semester._id, lecturerId: lect2._id, status: 'Published' });
    // Cross-department teaching: Linus (SEN) teaching CSC201 in CSC
    const offering3 = await CourseOffering.create({ courseId: course3._id, sessionId: acadSession._id, semesterId: semester._id, lecturerId: lect3._id, status: 'Published' });

    console.log('Courses and Offerings created.');

    // 6. Students & Enrollments
    const student1User = await User.create({
      loginIdentifier: 'U25CSC001', loginType: 'REG_NUMBER', passwordHash: adminHash,
      role: 'Student', firstName: 'Alice', lastName: 'Smith', email: 'alice@wapts.edu'
    });
    const stud1 = await StudentProfile.create({ userId: student1User._id, departmentId: deptCS._id, level: 100, admissionYear: '2025' });

    const student2User = await User.create({
      loginIdentifier: 'U25SEN001', loginType: 'REG_NUMBER', passwordHash: adminHash,
      role: 'Student', firstName: 'Bob', lastName: 'Johnson', email: 'bob@wapts.edu'
    });
    const stud2 = await StudentProfile.create({ userId: student2User._id, departmentId: deptSE._id, level: 100, admissionYear: '2025' });

    const student3User = await User.create({
      loginIdentifier: 'U24CSC001', loginType: 'REG_NUMBER', passwordHash: adminHash,
      role: 'Student', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@wapts.edu'
    });
    const stud3 = await StudentProfile.create({ userId: student3User._id, departmentId: deptCS._id, level: 200, admissionYear: '2024' });

    const enr1 = await Enrollment.create({ studentId: stud1._id, courseOfferingId: offering1._id, status: 'Enrolled' });
    const enr2 = await Enrollment.create({ studentId: stud2._id, courseOfferingId: offering2._id, status: 'Enrolled' });
    const enr3 = await Enrollment.create({ studentId: stud3._id, courseOfferingId: offering3._id, status: 'Enrolled' });

    console.log('Students and Enrollments created.');

    // 7. Assessments & Types
    const typeExam = await AssessmentType.create({ name: 'Exam', defaultWeight: 70, description: 'Final Examination' });
    const typeCA = await AssessmentType.create({ name: 'Continuous Assessment', defaultWeight: 30, description: 'Tests and Assignments' });

    // Assessments for offering1 (CSC101)
    const ass1Ca = await Assessment.create({ title: 'Midterm Test', assessmentTypeId: typeCA._id, courseOfferingId: offering1._id, weight: 30, maximumMarks: 100, status: 'Published', createdBy: lect1User._id });
    const ass1Exam = await Assessment.create({ title: 'Final Exam', assessmentTypeId: typeExam._id, courseOfferingId: offering1._id, weight: 70, maximumMarks: 100, status: 'Published', createdBy: lect1User._id });

    // Assessments for offering2 (SEN101)
    const ass2Ca = await Assessment.create({ title: 'Assignment 1', assessmentTypeId: typeCA._id, courseOfferingId: offering2._id, weight: 30, maximumMarks: 100, status: 'Published', createdBy: lect2User._id });
    
    // Assessment for offering3 (CSC201)
    const ass3Exam = await Assessment.create({ title: 'Final Exam', assessmentTypeId: typeExam._id, courseOfferingId: offering3._id, weight: 100, maximumMarks: 100, status: 'Published', createdBy: lect3User._id });

    // Scores
    await StudentAssessment.create([
      { assessmentId: ass1Ca._id, studentId: stud1._id, score: 85 },
      { assessmentId: ass1Exam._id, studentId: stud1._id, score: 70 },
      { assessmentId: ass2Ca._id, studentId: stud2._id, score: 90 }, // Only CA graded so far
      { assessmentId: ass3Exam._id, studentId: stud3._id, score: 100 } // Perfect score
    ]);

    // Compute Results
    const ResultService = require('../services/ResultService');
    await ResultService.saveDraft(enr1._id, stud1._id, offering1._id);
    await ResultService.saveDraft(enr2._id, stud2._id, offering2._id);
    await ResultService.saveDraft(enr3._id, stud3._id, offering3._id);

    console.log('Assessments and Results seeded.');

    // 8. Attendance
    const attSession1 = await AttendanceSession.create({ courseOfferingId: offering1._id, week: 1, lectureDate: new Date('2025-09-05'), topic: 'Introduction' });
    const attSession2 = await AttendanceSession.create({ courseOfferingId: offering2._id, week: 1, lectureDate: new Date('2025-09-06'), topic: 'Software Lifecycle' });

    await AttendanceRecord.create([
      { attendanceSessionId: attSession1._id, studentId: stud1._id, isPresent: true },
      { attendanceSessionId: attSession2._id, studentId: stud2._id, isPresent: false }
    ]);

    console.log('Attendance seeded.');

    console.log('Done! System is fully alive.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
}

seedDatabase();
