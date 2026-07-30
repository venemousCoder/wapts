const DashboardSnapshot = require('../models/DashboardSnapshot');
const AttendanceService = require('../services/AttendanceService');
const AssessmentService = require('../services/AssessmentService');
const ResultService = require('../services/ResultService');
const ResponseHandler = require('../utils/responseHandler');
const CourseOffering = require('../models/CourseOffering');
const LecturerProfile = require('../models/LecturerProfile');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const Enrollment = require('../models/Enrollment');

exports.getDashboard = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const assignedOfferings = await CourseOffering.find({ lecturerId: profile._id, status: { $in: ['Draft', 'Published'] }, isDeleted: false })
      .populate('courseId semesterId')
      .lean();
    
    const offeringIds = assignedOfferings.map(o => o._id);

    const enrollments = await Enrollment.find({ courseOfferingId: { $in: offeringIds }, status: 'Enrolled' }).lean();
    
    // Calculate total unique students enrolled across all their courses
    const uniqueStudents = new Set(enrollments.map(e => e.studentId.toString()));
    const totalStudents = uniqueStudents.size;

    const pendingAssessments = await Assessment.countDocuments({ courseOfferingId: { $in: offeringIds } });

    const data = {
      activeCourses: assignedOfferings.length,
      totalStudents,
      pendingAssessments,
      assignedOfferings
    };

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, data);
    }
    res.render('lecturer/dashboard', data);
  } catch (err) {
    next(err);
  }
};

exports.getCoursesView = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const assignedOfferings = await CourseOffering.find({ lecturerId: profile._id, status: { $in: ['Draft', 'Published'] }, isDeleted: false })
      .populate({ path: 'courseId', populate: { path: 'departmentId' } })
      .populate('semesterId')
      .lean();

    res.render('lecturer/courses', { assignedOfferings, profile, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};
exports.getAttendanceView = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const { courseOfferingId } = req.query;

    // Fetch assigned course offerings
    const assignedOfferings = await CourseOffering.find({ lecturerId: profile._id, status: { $in: ['Draft', 'Published'] }, isDeleted: false })
      .populate('courseId semesterId')
      .lean();

    let enrolledStudents = [];
    let selectedOffering = null;
    let attendanceSessions = [];

    if (courseOfferingId) {
      selectedOffering = assignedOfferings.find(o => o._id.toString() === courseOfferingId);
      if (selectedOffering) {
        // Fetch enrolled students
        const enrollments = await Enrollment.find({ courseOfferingId, status: 'Enrolled' })
          .populate({ path: 'studentId', populate: { path: 'userId' } })
          .lean();
        
        enrolledStudents = enrollments.map(e => e.studentId);

        // Fetch past attendance sessions for this offering
        const AttendanceSession = require('../models/AttendanceSession');
        attendanceSessions = await AttendanceSession.find({ courseOfferingId }).sort({ week: 1 }).lean();
      }
    }

    res.render('lecturer/attendance', { 
      assignedOfferings, 
      selectedOffering, 
      enrolledStudents,
      attendanceSessions,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};
exports.postAttendance = async (req, res, next) => {
  try {
    const { courseOfferingId, week, lectureDate, topic, recordsData } = req.body;
    // recordsData is array of { studentId, isPresent }
    
    // Sanitize recordsData to handle hidden input + checkbox array issue (e.g. ['false', 'true'])
    let sanitizedRecordsData = [];
    if (Array.isArray(recordsData)) {
      sanitizedRecordsData = recordsData.map(record => {
        let isPresentVal = record.isPresent;
        if (Array.isArray(isPresentVal)) {
          // If it's an array, it means the checkbox was checked, so it sent both the hidden 'false' and checkbox 'true'.
          isPresentVal = isPresentVal.includes('true') ? 'true' : 'false';
        }
        return {
          studentId: record.studentId,
          isPresent: isPresentVal === 'true' || isPresentVal === true
        };
      });
    }
    
    const lecturerProfile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!lecturerProfile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering || offering.lecturerId.toString() !== lecturerProfile._id.toString()) {
      return ResponseHandler.error(res, 'Unauthorized or offering not found', 403);
    }
    
    const session = await AttendanceService.createSession(courseOfferingId, week, lectureDate, topic);
    const records = await AttendanceService.recordAttendance(session._id, sanitizedRecordsData);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, { session, records }, 'Attendance recorded successfully');
    }
    res.redirect(`/lecturer/attendance?courseOfferingId=${courseOfferingId}&success=true`);
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    const offeringParam = req.body.courseOfferingId ? `?courseOfferingId=${req.body.courseOfferingId}&` : '?';
    res.redirect(`/lecturer/attendance${offeringParam}error=${encodeURIComponent(err.message)}`);
  }
};

exports.getAssessmentsView = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const { courseOfferingId } = req.query;

    const assignedOfferings = await CourseOffering.find({ lecturerId: profile._id, status: { $in: ['Draft', 'Published'] }, isDeleted: false })
      .populate('courseId semesterId').lean();

    const AssessmentType = require('../models/AssessmentType');
    const assessmentTypes = await AssessmentType.find({ isActive: true }).lean();

    let selectedOffering = null;
    let enrolledStudents = [];
    let assessments = [];
    let studentAssessments = [];

    if (courseOfferingId) {
      selectedOffering = assignedOfferings.find(o => o._id.toString() === courseOfferingId);
      if (selectedOffering) {
        const enrollments = await Enrollment.find({ courseOfferingId, status: 'Enrolled' })
          .populate({ path: 'studentId', populate: { path: 'userId' } }).lean();
        enrolledStudents = enrollments.map(e => e.studentId);

        assessments = await Assessment.find({ courseOfferingId }).populate('assessmentTypeId').lean();
        const assessmentIds = assessments.map(a => a._id);
        
        const StudentAssessment = require('../models/StudentAssessment');
        studentAssessments = await StudentAssessment.find({ assessmentId: { $in: assessmentIds } }).lean();
      }
    }

    res.render('lecturer/assessments', {
      assignedOfferings,
      selectedOffering,
      assessmentTypes,
      enrolledStudents,
      assessments,
      studentAssessments,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

exports.createAssessment = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const { courseOfferingId, title, assessmentTypeId, weight, maximumMarks, description, status, dueDate } = req.body;
    
    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering || offering.lecturerId.toString() !== profile._id.toString()) {
      return res.redirect(`/lecturer/assessments?error=Unauthorized`);
    }

    const trimmedTitle = title.trim();

    // Validate Maximum Marks
    if (maximumMarks <= 0) {
      throw new Error('Maximum Marks must be greater than zero.');
    }

    // Validate Title Uniqueness
    const existingSameTitle = await Assessment.findOne({ 
      courseOfferingId, 
      title: { $regex: new RegExp(`^${trimmedTitle}$`, 'i') } 
    });
    if (existingSameTitle) {
      throw new Error('An assessment with this title already exists for this course.');
    }

    // Validate Due Date
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (parsedDate < new Date().setHours(0,0,0,0)) {
        throw new Error('Due date cannot be in the past.');
      }
    }

    // Validate Weight
    const existingAssessments = await Assessment.find({ courseOfferingId });
    const currentTotalWeight = existingAssessments.reduce((sum, a) => sum + a.weight, 0);
    const numWeight = parseFloat(weight);
    if (currentTotalWeight + numWeight > 100) {
      throw new Error('Assessment weight exceeds the remaining allowable weight.');
    }

    const assessmentStatus = status === 'Published' ? 'Published' : 'Draft';

    const assessment = new Assessment({
      courseOfferingId,
      title: trimmedTitle,
      assessmentTypeId,
      weight: numWeight,
      maximumMarks,
      description,
      status: assessmentStatus,
      dueDate,
      createdBy: req.user._id
    });
    await assessment.save();

    const msg = assessmentStatus === 'Published' ? 'Assessment published successfully.' : 'Assessment saved as Draft.';
    res.redirect(`/lecturer/assessments?courseOfferingId=${courseOfferingId}&success=${encodeURIComponent(msg)}`);
  } catch (err) {
    const offeringParam = req.body.courseOfferingId ? `?courseOfferingId=${req.body.courseOfferingId}&` : '?';
    res.redirect(`/lecturer/assessments${offeringParam}error=${encodeURIComponent(err.message)}`);
  }
};

exports.publishAssessment = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const assessment = await Assessment.findById(req.params.id).populate('courseOfferingId');
    if (!assessment || assessment.courseOfferingId.lecturerId.toString() !== profile._id.toString()) {
      return res.redirect(`/lecturer/assessments?error=Unauthorized`);
    }

    if (assessment.status === 'Published') {
      throw new Error('Assessment is already published.');
    }

    assessment.status = 'Published';
    await assessment.save();

    res.redirect(`/lecturer/assessments?courseOfferingId=${assessment.courseOfferingId._id}&success=${encodeURIComponent('Assessment published successfully.')}`);
  } catch (err) {
    res.redirect(`/lecturer/assessments?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkAssessmentAction = async (req, res, next) => {
  try {
    const { action, assessmentIds } = req.body;
    
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Lecturer profile not found');

    let successCount = 0;
    let courseOfferingId = null;

    for (const assessmentId of assessmentIds) {
      try {
        const assessment = await Assessment.findById(assessmentId).populate('courseOfferingId');
        if (assessment && assessment.courseOfferingId.lecturerId.toString() === profile._id.toString()) {
          courseOfferingId = assessment.courseOfferingId._id;
          if (assessment.status === 'Draft' && action === 'publish') {
            assessment.status = 'Published';
            await assessment.save();
            successCount++;
          }
        }
      } catch (err) {
        console.error(`Failed to ${action} assessment ${assessmentId}:`, err);
      }
    }

    const redirectUrl = courseOfferingId ? `/lecturer/assessments?courseOfferingId=${courseOfferingId}&success=${successCount}+assessments+successfully+${action}ed` : `/lecturer/assessments?success=${successCount}+assessments+successfully+${action}ed`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.redirect(`/lecturer/assessments?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postAssessmentScores = async (req, res, next) => {
  try {
    const { assessmentId, scoresData } = req.body;
    // scoresData is array of { studentId, score }
    
    const lecturerProfile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!lecturerProfile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return ResponseHandler.error(res, 'Assessment not found', 404);

    const offering = await CourseOffering.findById(assessment.courseOfferingId);
    if (!offering || offering.lecturerId.toString() !== lecturerProfile._id.toString()) {
      return ResponseHandler.error(res, 'Unauthorized or offering not found', 403);
    }
    
    const records = await AssessmentService.recordScores(assessmentId, scoresData);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, records, 'Scores recorded successfully');
    }
    res.redirect(`/lecturer/assessments?courseOfferingId=${assessment.courseOfferingId}&success=true`);
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    const offeringParam = req.body.courseOfferingId ? `?courseOfferingId=${req.body.courseOfferingId}&` : '?';
    res.redirect(`/lecturer/assessments${offeringParam}error=${encodeURIComponent(err.message)}`);
  }
};

exports.getResultsView = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const { courseOfferingId } = req.query;

    const assignedOfferings = await CourseOffering.find({ lecturerId: profile._id, status: { $in: ['Draft', 'Published'] }, isDeleted: false })
      .populate('courseId semesterId').lean();

    let selectedOffering = null;
    let enrolledStudents = [];
    let results = [];

    if (courseOfferingId) {
      selectedOffering = assignedOfferings.find(o => o._id.toString() === courseOfferingId);
      if (selectedOffering) {
        const enrollments = await Enrollment.find({ courseOfferingId, status: 'Enrolled' })
          .populate({ path: 'studentId', populate: { path: 'userId' } }).lean();
        
        enrolledStudents = enrollments.map(e => e.studentId);
        const enrollmentIds = enrollments.map(e => e._id);
        
        results = await Result.find({ enrollmentId: { $in: enrollmentIds } })
          .populate({ path: 'enrollmentId', populate: { path: 'studentId', populate: { path: 'userId' } } })
          .lean();
      }
    }

    res.render('lecturer/results', {
      assignedOfferings,
      selectedOffering,
      enrolledStudents,
      results,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

exports.postCompileResults = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const { courseOfferingId } = req.body;
    
    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering || offering.lecturerId.toString() !== profile._id.toString()) {
      throw new Error('Unauthorized to compile results for this course');
    }

    const enrollments = await Enrollment.find({ courseOfferingId, status: 'Enrolled' });
    let compiledCount = 0;
    
    for (const enrollment of enrollments) {
      try {
        await ResultService.saveDraft(enrollment._id, enrollment.studentId, courseOfferingId);
        compiledCount++;
      } catch (err) {
        // Skip if already approved or published
        if (err.message !== 'Cannot modify an approved or published result') {
          console.error(`Error compiling result for enrollment ${enrollment._id}:`, err);
        }
      }
    }

    res.redirect(`/lecturer/results?courseOfferingId=${courseOfferingId}&success=${encodeURIComponent('Successfully compiled ' + compiledCount + ' results.')}`);
  } catch (err) {
    res.redirect(`/lecturer/results?courseOfferingId=${req.body.courseOfferingId}&error=${encodeURIComponent(err.message)}`);
  }
};

exports.submitResults = async (req, res, next) => {
  try {
    const { resultId } = req.body;
    
    const lecturerProfile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!lecturerProfile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const resultToSubmit = await Result.findById(resultId).populate('enrollmentId');
    if (!resultToSubmit) return ResponseHandler.error(res, 'Result not found', 404);

    const offering = await CourseOffering.findById(resultToSubmit.enrollmentId.courseOfferingId);
    if (!offering || offering.lecturerId.toString() !== lecturerProfile._id.toString()) {
      return ResponseHandler.error(res, 'Unauthorized or offering not found', 403);
    }
    
    const result = await ResultService.submitResult(resultId);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, result, 'Result submitted successfully');
    }
    res.redirect(`/lecturer/results?courseOfferingId=${offering._id}&success=true`);
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    // We don't have courseOfferingId easily available if it failed early, just redirect to /results
    res.redirect(`/lecturer/results?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postSubmitAllResults = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const { courseOfferingId } = req.body;
    
    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering || offering.lecturerId.toString() !== profile._id.toString()) {
      throw new Error('Unauthorized to submit results for this course');
    }

    const enrollments = await Enrollment.find({ courseOfferingId, status: 'Enrolled' });
    const enrollmentIds = enrollments.map(e => e._id);
    
    const results = await Result.find({ enrollmentId: { $in: enrollmentIds }, status: 'Draft' });
    let submittedCount = 0;
    
    for (const result of results) {
      await ResultService.submitResult(result._id);
      submittedCount++;
    }

    res.redirect(`/lecturer/results?courseOfferingId=${courseOfferingId}&success=${encodeURIComponent('Successfully submitted ' + submittedCount + ' results to the HOD.')}`);
  } catch (err) {
    res.redirect(`/lecturer/results?courseOfferingId=${req.body.courseOfferingId}&error=${encodeURIComponent(err.message)}`);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const LecturerProfile = require('../models/LecturerProfile');
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) {
      return res.render('lecturer/students', { error: 'Your Lecturer profile is incomplete or not assigned to a department.', students: [] });
    }

    const StudentProfile = require('../models/StudentProfile');
    const User = require('../models/User');
    
    const studentProfiles = await StudentProfile.find({ departmentId: profile.departmentId, level: { $in: profile.assignedLevels || [] } }).lean();
    const userIds = studentProfiles.map(sp => sp.userId);
    
    const students = await User.find({ _id: { $in: userIds } }).lean();
    
    const fullStudents = students.map(student => {
      const sp = studentProfiles.find(p => p.userId.toString() === student._id.toString());
      return { ...student, profile: sp };
    });

    res.render('lecturer/students', { 
      students: fullStudents, 
      assignedLevels: profile.assignedLevels || [],
      success: req.query.success, 
      error: req.query.error,
      tempPassword: req.session.tempPassword || null,
      importSummary: req.session.importSummary || null
    });
    req.session.tempPassword = null;
    req.session.importSummary = null;
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const LecturerProfile = require('../models/LecturerProfile');
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) {
      throw new Error('Lecturer profile not found or department not assigned');
    }

    const { loginIdentifier, email, firstName, lastName, phoneNumber, gender, dateOfBirth, level, admissionYear, programme } = req.body;
    
    if (!profile.assignedLevels || !profile.assignedLevels.includes(parseInt(level))) {
      throw new Error('Unauthorized: You can only onboard students for your assigned levels (' + profile.assignedLevels.join(', ') + ')');
    }

    const UserService = require('../services/UserService');
    const tempPassword = lastName.toLowerCase().replace(/[^a-z]/g, '') + '123';

    const user = await UserService.createUser(
      { loginIdentifier, email, loginType: 'REG_NUMBER', password: tempPassword, firstName, lastName, phoneNumber, gender, dateOfBirth },
      { departmentId: profile.departmentId, level: parseInt(level), admissionYear, programme },
      'Student'
    );
    
    user.requiresPasswordChange = true;
    await user.save();

    req.session.tempPassword = `Student created. Temporary password for ${loginIdentifier} is: ${tempPassword}`;
    res.redirect('/lecturer/students?success=true');
  } catch (err) {
    res.redirect(`/lecturer/students?error=${encodeURIComponent(err.message)}`);
  }
};

exports.importStudents = async (req, res, next) => {
  try {
    const LecturerProfile = require('../models/LecturerProfile');
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) {
      throw new Error('Lecturer profile not found or department not assigned');
    }

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const StudentImportService = require('../services/StudentImportService');
    const summary = await StudentImportService.importFromCSV(req.file.path, profile.departmentId, req.user._id, profile.assignedLevels);

    req.session.importSummary = summary;
    res.redirect('/lecturer/students?success=Import%20Completed');
  } catch (err) {
    res.redirect(`/lecturer/students?error=${encodeURIComponent(err.message)}`);
  }
};

exports.toggleStudentStatus = async (req, res, next) => {
  try {
    const LecturerProfile = require('../models/LecturerProfile');
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) throw new Error('Lecturer profile not found');

    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    user.isDeleted = !user.isDeleted;
    await user.save();

    res.redirect('/lecturer/students?success=true');
  } catch (err) {
    res.redirect(`/lecturer/students?error=${encodeURIComponent(err.message)}`);
  }
};

exports.editStudentRegNumber = async (req, res, next) => {
  try {
    const LecturerProfile = require('../models/LecturerProfile');
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) throw new Error('Lecturer profile not found');

    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    const { newRegNumber } = req.body;
    if (!newRegNumber || !newRegNumber.trim()) {
      throw new Error('Registration number cannot be empty');
    }

    const User = require('../models/User');
    
    // Check if new reg number already exists
    const existingUser = await User.findOne({ loginIdentifier: newRegNumber.trim() });
    if (existingUser && existingUser._id.toString() !== req.params.id) {
      throw new Error(`Registration number ${newRegNumber} is already in use.`);
    }

    const user = await User.findById(req.params.id);
    user.loginIdentifier = newRegNumber.trim();
    await user.save();

    res.redirect('/lecturer/students?success=Registration+number+updated');
  } catch (err) {
    res.redirect(`/lecturer/students?error=${encodeURIComponent(err.message)}`);
  }
};

const RegistrationService = require('../services/RegistrationService');
const SystemSetting = require('../models/SystemSetting');
const Course = require('../models/Course');

exports.getRegistrationView = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Lecturer profile not found', 404);

    const User = require('../models/User');
    const studentUser = await User.findById(req.params.id);
    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    const settings = await SystemSetting.findOne();
    if (!settings) throw new Error('System settings not configured');

    const currentEnrollments = await Enrollment.find({
      studentId: studentProfile._id,
      status: 'Enrolled'
    }).populate({
      path: 'courseOfferingId',
      populate: { path: 'courseId' }
    });

    let currentCredits = 0;
    const enrolledOfferingIds = currentEnrollments.map(e => e.courseOfferingId._id.toString());
    const enrolledCourses = [];

    for (const enr of currentEnrollments) {
      if (enr.courseOfferingId.sessionId.toString() === settings.currentAcademicSession.toString() &&
          enr.courseOfferingId.semesterId.toString() === settings.currentSemester.toString()) {
        currentCredits += enr.courseOfferingId.courseId.creditUnits;
        enrolledCourses.push(enr);
      }
    }

    const allOfferings = await CourseOffering.find({
      sessionId: settings.currentAcademicSession,
      semesterId: settings.currentSemester,
      status: 'Published'
    }).populate('courseId').lean();

    const availableOfferings = allOfferings.filter(o => 
      o.courseId.departmentId.toString() === profile.departmentId.toString() &&
      !enrolledOfferingIds.includes(o._id.toString())
    );

    const recommendedOfferings = availableOfferings.filter(o => o.courseId.level === studentProfile.level);
    const otherOfferings = availableOfferings.filter(o => o.courseId.level !== studentProfile.level);

    res.render('lecturer/registration', {
      studentUser,
      studentProfile,
      currentCredits,
      maxCreditLoad: settings.maxCreditLoad,
      enrolledCourses,
      recommendedOfferings,
      otherOfferings,
      error: req.query.error,
      success: req.query.success
    });
  } catch (err) {
    res.redirect(`/lecturer/students?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postCohortRegistration = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Lecturer profile not found');

    const { level } = req.body;
    if (!profile.assignedLevels.includes(parseInt(level))) {
      throw new Error('Unauthorized level');
    }

    const settings = await SystemSetting.findOne();
    if (!settings) throw new Error('System settings not configured');

    const result = await RegistrationService.applyCohortRegistration(
      level,
      profile.departmentId,
      settings.currentAcademicSession,
      settings.currentSemester,
      req.user._id
    );

    res.redirect(`/lecturer/students?success=${encodeURIComponent(`Cohort Registration complete. Successfully processed ${result.successCount}/${result.studentsProcessed} students.`)}`);
  } catch (err) {
    res.redirect(`/lecturer/students?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postRecommendedRegistration = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Lecturer profile not found');

    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    const settings = await SystemSetting.findOne();
    const result = await RegistrationService.applyRecommendedRegistration(
      studentProfile._id,
      studentProfile.level,
      profile.departmentId,
      settings.currentAcademicSession,
      settings.currentSemester,
      req.user._id
    );

    if (result.errors.length > 0) {
      res.redirect(`/lecturer/students/${req.params.id}/registration?error=${encodeURIComponent('Some courses could not be added: ' + result.errors.join(', '))}`);
    } else {
      res.redirect(`/lecturer/students/${req.params.id}/registration?success=Recommended%20courses%20added`);
    }
  } catch (err) {
    res.redirect(`/lecturer/students/${req.params.id}/registration?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postAddCourse = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Lecturer profile not found');

    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    await RegistrationService.registerStudent(studentProfile._id, req.body.courseOfferingId, req.user._id);

    res.redirect(`/lecturer/students/${req.params.id}/registration?success=Course%20added`);
  } catch (err) {
    res.redirect(`/lecturer/students/${req.params.id}/registration?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postRemoveCourse = async (req, res, next) => {
  try {
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Lecturer profile not found');

    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    await RegistrationService.removeRegistration(studentProfile._id, req.body.courseOfferingId, req.user._id);

    res.redirect(`/lecturer/students/${req.params.id}/registration?success=Course%20removed`);
  } catch (err) {
    res.redirect(`/lecturer/students/${req.params.id}/registration?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkRegistrationAction = async (req, res, next) => {
  try {
    const { action, courseOfferingIds } = req.body;
    
    const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Lecturer profile not found');

    const StudentProfile = require('../models/StudentProfile');
    const studentProfile = await StudentProfile.findOne({ userId: req.params.id });

    if (!studentProfile || studentProfile.departmentId.toString() !== profile.departmentId.toString() || !profile.assignedLevels.includes(studentProfile.level)) {
      throw new Error('Unauthorized to manage this student');
    }

    let successCount = 0;
    
    for (const offeringId of courseOfferingIds) {
      try {
        if (action === 'register') {
          await RegistrationService.registerStudent(studentProfile._id, offeringId, req.user._id);
        } else if (action === 'drop') {
          await RegistrationService.removeRegistration(studentProfile._id, offeringId, req.user._id);
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to ${action} offering ${offeringId} for student ${studentProfile._id}:`, err);
      }
    }

    res.redirect(`/lecturer/students/${req.params.id}/registration?success=${successCount}+courses+successfully+${action}ed`);
  } catch (err) {
    res.redirect(`/lecturer/students/${req.params.id}/registration?error=${encodeURIComponent(err.message)}`);
  }
};
