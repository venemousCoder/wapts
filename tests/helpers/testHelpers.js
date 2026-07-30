const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Department = require('../../models/Department');
const Course = require('../../models/Course');
const GradeScale = require('../../models/GradeScale');
const Classification = require('../../models/Classification');
const StudentProfile = require('../../models/StudentProfile');
const LecturerProfile = require('../../models/LecturerProfile');
const HodProfile = require('../../models/HodProfile');
const AcademicSession = require('../../models/AcademicSession');
const Semester = require('../../models/Semester');
const CourseOffering = require('../../models/CourseOffering');
const Curriculum = require('../../models/Curriculum');
const Enrollment = require('../../models/Enrollment');
const Assessment = require('../../models/Assessment');
const AssessmentType = require('../../models/AssessmentType');
const StudentAssessment = require('../../models/StudentAssessment');
const Result = require('../../models/Result');
const supertest = require('supertest');

const DEFAULT_PASSWORD = 'TestPass123!';

/**
 * Creates a test user with a hashed password
 */
async function createTestUser(role = 'Student', overrides = {}) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(overrides.password || DEFAULT_PASSWORD, salt);
  
  const defaults = {
    loginIdentifier: `test_${role.toLowerCase()}_${Date.now()}@test.edu`,
    loginType: role === 'Admin' ? 'ADMIN_USERNAME' : role === 'Student' ? 'REG_NUMBER' : 'INSTITUTIONAL_EMAIL',
    passwordHash,
    role,
    firstName: `Test${role}`,
    lastName: 'User',
    accountStatus: 'Active',
    isDeleted: false
  };

  const userData = { ...defaults, ...overrides, passwordHash };
  const user = new User(userData);
  await user.save();
  return user;
}

/**
 * Creates a test department
 */
async function createTestDepartment(overrides = {}) {
  const defaults = {
    name: `Test Department ${Date.now()}`,
    code: `TD${Date.now().toString().slice(-4)}`,
    isDeleted: false
  };
  const department = new Department({ ...defaults, ...overrides });
  await department.save();
  return department;
}

/**
 * Creates a test course
 */
async function createTestCourse(departmentId, overrides = {}) {
  const defaults = {
    code: `CSC${Date.now().toString().slice(-3)}`,
    title: `Test Course ${Date.now()}`,
    creditUnits: 3,
    programme: 'B.Sc. Computer Science',
    level: 100,
    departmentId,
    status: 'Active',
    isDeleted: false
  };
  const course = new Course({ ...defaults, ...overrides });
  await course.save();
  return course;
}

/**
 * Seeds standard Nigerian university grade scales
 */
async function createTestGradeScales() {
  const scales = [
    { letterGrade: 'A', minimumScore: 70, maximumScore: 100, gradePoint: 5.0, description: 'Excellent', isActive: true },
    { letterGrade: 'B', minimumScore: 60, maximumScore: 69, gradePoint: 4.0, description: 'Very Good', isActive: true },
    { letterGrade: 'C', minimumScore: 50, maximumScore: 59, gradePoint: 3.0, description: 'Good', isActive: true },
    { letterGrade: 'D', minimumScore: 45, maximumScore: 49, gradePoint: 2.0, description: 'Fair', isActive: true },
    { letterGrade: 'E', minimumScore: 40, maximumScore: 44, gradePoint: 1.0, description: 'Pass', isActive: true },
    { letterGrade: 'F', minimumScore: 0, maximumScore: 39, gradePoint: 0, description: 'Fail', isActive: true }
  ];
  
  const created = [];
  for (const scale of scales) {
    const gs = new GradeScale(scale);
    await gs.save();
    created.push(gs);
  }
  return created;
}

/**
 * Seeds standard classification tiers
 */
async function createTestClassifications() {
  const classifications = [
    { name: 'First Class', minimumCGPA: 4.50, maximumCGPA: 5.00, description: 'First Class Honours', isActive: true },
    { name: 'Second Class Upper', minimumCGPA: 3.50, maximumCGPA: 4.49, description: 'Second Class Upper Division', isActive: true },
    { name: 'Second Class Lower', minimumCGPA: 2.40, maximumCGPA: 3.49, description: 'Second Class Lower Division', isActive: true },
    { name: 'Third Class', minimumCGPA: 1.50, maximumCGPA: 2.39, description: 'Third Class', isActive: true },
    { name: 'Pass', minimumCGPA: 1.00, maximumCGPA: 1.49, description: 'Pass', isActive: true }
  ];

  const created = [];
  for (const cls of classifications) {
    const c = new Classification(cls);
    await c.save();
    created.push(c);
  }
  return created;
}

/**
 * Creates a student user with associated profile
 */
async function createStudentWithProfile(departmentId, overrides = {}) {
  const user = await createTestUser('Student', overrides.user || {});
  const profileDefaults = {
    userId: user._id,
    departmentId,
    level: 100,
    admissionYear: new Date().getFullYear(),
    registrationNumber: user.loginIdentifier,
    totalCreditsEarned: 0,
    totalCreditsAttempted: 0,
    currentCGPA: 0,
    isDeleted: false
  };
  const profile = new StudentProfile({ ...profileDefaults, ...overrides.profile });
  await profile.save();
  return { user, profile };
}

/**
 * Creates a lecturer user with associated profile
 */
async function createLecturerWithProfile(departmentId, overrides = {}) {
  const user = await createTestUser('Lecturer', overrides.user || {});
  const profileDefaults = {
    userId: user._id,
    departmentId,
    isDeleted: false
  };
  const profile = new LecturerProfile({ ...profileDefaults, ...overrides.profile });
  await profile.save();
  return { user, profile };
}

/**
 * Creates a HOD user with associated profile
 */
async function createHodWithProfile(departmentId, overrides = {}) {
  const user = await createTestUser('HOD', overrides.user || {});
  const profileDefaults = {
    userId: user._id,
    departmentId,
    appointmentDate: new Date(),
    isDeleted: false
  };
  const profile = new HodProfile({ ...profileDefaults, ...overrides.profile });
  await profile.save();
  return { user, profile };
}

/**
 * Creates a full enrollment chain: session → semester → offering → enrollment
 */
async function createFullEnrollmentChain(departmentId, studentProfile, lecturerProfile, course, overrides = {}) {
  const session = new AcademicSession({
    name: overrides.sessionName || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    status: 'Active',
    ...overrides.session
  });
  await session.save();

  const semester = new Semester({
    name: overrides.semesterName || 'First Semester',
    sessionId: session._id,
    isActive: true,
    ...overrides.semester
  });
  await semester.save();

  const offering = new CourseOffering({
    courseId: course._id,
    sessionId: session._id,
    semesterId: semester._id,
    lecturerId: lecturerProfile._id,
    status: 'Published',
    ...overrides.offering
  });
  await offering.save();

  // Create curriculum entry so enrollment validation passes
  const curriculum = new Curriculum({
    departmentId,
    level: studentProfile.level || 100,
    semesterId: semester._id,
    requiredCourses: [course._id],
    electiveCourses: [],
    totalCredits: course.creditUnits || 3,
    isDeleted: false,
    ...overrides.curriculum
  });
  await curriculum.save();

  const enrollment = new Enrollment({
    studentId: studentProfile._id,
    courseOfferingId: offering._id,
    status: 'Enrolled',
    ...overrides.enrollment
  });
  await enrollment.save();

  return { session, semester, offering, curriculum, enrollment };
}

/**
 * Creates an authenticated supertest agent
 */
async function authenticatedAgent(app, user, password = DEFAULT_PASSWORD) {
  const agent = supertest.agent(app);
  await agent
    .post('/auth/login')
    .send({
      loginIdentifier: user.loginIdentifier,
      password,
      loginType: user.loginType
    });
  return agent;
}

/**
 * Creates a result with assessment scores for a complete result chain
 */
async function createResultWithScores(enrollment, offering, studentProfile, score = 75) {
  const assessmentType = new AssessmentType({
    name: 'Final Exam',
    description: 'End of semester examination',
    defaultWeight: 100
  });
  await assessmentType.save();

  const assessment = new Assessment({
    courseOfferingId: offering._id,
    assessmentTypeId: assessmentType._id,
    weight: 100,
    maximumScore: 100,
    dueDate: new Date()
  });
  await assessment.save();

  const studentAssessment = new StudentAssessment({
    assessmentId: assessment._id,
    studentId: studentProfile._id,
    score
  });
  await studentAssessment.save();

  return { assessmentType, assessment, studentAssessment };
}

module.exports = {
  DEFAULT_PASSWORD,
  createTestUser,
  createTestDepartment,
  createTestCourse,
  createTestGradeScales,
  createTestClassifications,
  createStudentWithProfile,
  createLecturerWithProfile,
  createHodWithProfile,
  createFullEnrollmentChain,
  authenticatedAgent,
  createResultWithScores
};
