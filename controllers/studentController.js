const DashboardSnapshot = require('../models/DashboardSnapshot');
const EnrollmentService = require('../services/EnrollmentService');
const ReportService = require('../services/ReportService');
const ResponseHandler = require('../utils/responseHandler');

const StudentProfile = require('../models/StudentProfile');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');

const GoalTrackingService = require('../services/GoalTrackingService');

exports.getDashboard = async (req, res, next) => {
  try {
    // Ensure progress is updated to reflect real data
    const ProgressService = require('../services/ProgressService');
    await ProgressService.updateStudentProgress(req.user._id);

    // Get the pre-calculated dashboard snapshot
    const snapshot = await DashboardSnapshot.findOne({ userId: req.user._id });
    
    // Get academic record for the chart
    const data = await ReportService.generateTranscriptData(req.user._id);

    const chartLabels = data.academicRecord.map(record => record.semesterName);
    const chartData = data.academicRecord.map(record => parseFloat(record.gpa));

    const goalData = await GoalTrackingService.updateStudentGoal(req.user._id);

    const dashboardData = {
      snapshot: snapshot ? {
        currentCGPA: snapshot.currentCGPA,
        creditsEarned: snapshot.creditsEarned,
        currentClassification: snapshot.currentClassification,
        riskLevel: snapshot.riskLevel
      } : {
        currentCGPA: 0,
        creditsEarned: 0,
        currentClassification: 'N/A',
        riskLevel: 'Low'
      },
      chartLabels: JSON.stringify(chartLabels),
      chartData: JSON.stringify(chartData),
      goalData
    };

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, dashboardData);
    }
    res.render('student/dashboard', dashboardData);
  } catch (err) {
    next(err);
  }
};

exports.getGoalTracker = async (req, res, next) => {
  try {
    const goalData = await GoalTrackingService.updateStudentGoal(req.user._id);
    const profile = await StudentProfile.findOne({ userId: req.user._id }).populate('departmentId');
    
    // Create a dummy goalData object with defaults if they don't have a goal yet
    const data = goalData || {
      goal: null,
      feasibility: { status: 'N/A', requiredGPA: 0, projectedCGPA: profile?.currentCGPA || 0 },
      insights: 'Set an academic goal to track your progress and receive projections.',
      currentClassification: 'N/A',
      projectedClassification: 'N/A'
    };

    res.render('student/goal-tracker', { 
      data, 
      profile,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

exports.postSaveGoal = async (req, res, next) => {
  try {
    const { targetCGPA, expectedGraduationSession } = req.body;
    const AcademicGoal = require('../models/AcademicGoal');
    
    const target = parseFloat(targetCGPA);
    if (isNaN(target) || target < 0 || target > 5) {
      throw new Error('Invalid Target CGPA. Must be between 0 and 5.');
    }

    const student = await StudentProfile.findOne({ userId: req.user._id });
    if (!student) throw new Error('Student profile not found');

    let goal = await AcademicGoal.findOne({ studentId: student._id });
    if (!goal) {
      goal = new AcademicGoal({ studentId: student._id });
    }

    goal.targetCGPA = target;
    goal.expectedGraduationSession = expectedGraduationSession || '';
    
    // We don't recalculate CGPA here, just save the target. 
    // updateStudentGoal will do the rest automatically.
    await goal.save();
    await GoalTrackingService.updateStudentGoal(req.user._id);

    res.redirect('/student/goal-tracker?success=Goal+saved+successfully');
  } catch (err) {
    res.redirect(`/student/goal-tracker?error=${encodeURIComponent(err.message)}`);
  }
};


exports.getCourses = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Student profile not found', 404);

    const enrollments = await Enrollment.find({ studentId: profile._id, status: 'Enrolled' })
      .populate({ path: 'courseOfferingId', populate: { path: 'courseId lecturerId' } })
      .lean();
    
    const enrolledOfferingIds = enrollments.map(e => e.courseOfferingId?._id).filter(id => id);
    const availableOfferings = await CourseOffering.find({
      _id: { $nin: enrolledOfferingIds },
      status: 'Active',
      isDeleted: false
    }).populate('courseId lecturerId').lean();

    res.render('student/courses', { 
      enrollments, 
      availableOfferings,
      success: req.query.success,
      error: req.query.error 
    });
  } catch (err) {
    next(err);
  }
};

exports.enrollCourse = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Student profile not found', 404);

    const { courseOfferingId } = req.body;
    const enrollment = await EnrollmentService.enrollStudent(profile._id, courseOfferingId);
    
    // Check if it's an AJAX request (e.g. from fetch)
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, enrollment, 'Enrolled successfully');
    }
    // Redirect with success flash if using standard form submit (we will use flash middleware or redirect back)
    // Wait, the project doesn't have connect-flash, so we will use a success query param or AJAX
    res.redirect('/student/courses?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/student/courses?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkEnrollAction = async (req, res, next) => {
  try {
    const { action, courseOfferingIds } = req.body;
    
    const profile = await StudentProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('Student profile not found');

    const RegistrationService = require('../services/RegistrationService');
    let successCount = 0;
    
    for (const offeringId of courseOfferingIds) {
      try {
        if (action === 'enroll') {
          await RegistrationService.registerStudent(profile._id, offeringId, req.user._id);
        } else if (action === 'drop') {
          await RegistrationService.removeRegistration(profile._id, offeringId, req.user._id);
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to ${action} offering ${offeringId} for student ${profile._id}:`, err);
      }
    }

    res.redirect(`/student/courses?success=${successCount}+courses+successfully+${action}ed`);
  } catch (err) {
    res.redirect(`/student/courses?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Student profile not found', 404);

    const AttendanceRecord = require('../models/AttendanceRecord');
    const records = await AttendanceRecord.find({ studentId: profile._id })
      .populate({
        path: 'attendanceSessionId',
        populate: {
          path: 'courseOfferingId',
          populate: { path: 'courseId' }
        }
      })
      .lean();

    // Group records by course
    const attendanceByCourse = {};
    records.forEach(record => {
      const session = record.attendanceSessionId;
      if (!session || !session.courseOfferingId) return;
      
      const course = session.courseOfferingId.courseId;
      const courseCode = course.code;
      
      if (!attendanceByCourse[courseCode]) {
        attendanceByCourse[courseCode] = {
          course,
          totalSessions: 0,
          presentCount: 0,
          sessions: []
        };
      }
      
      attendanceByCourse[courseCode].totalSessions++;
      if (record.isPresent) attendanceByCourse[courseCode].presentCount++;
      attendanceByCourse[courseCode].sessions.push({
        week: session.week,
        date: session.lectureDate,
        topic: session.topic,
        isPresent: record.isPresent
      });
    });

    res.render('student/attendance', { attendanceByCourse });
  } catch (err) {
    next(err);
  }
};

exports.getResults = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'Student profile not found', 404);

    const { semesterId } = req.query;

    const Result = require('../models/Result');
    const Enrollment = require('../models/Enrollment');
    const Semester = require('../models/Semester');

    // Fetch all semesters for dropdown
    const semesters = await Semester.find().populate('sessionId').sort({ createdAt: -1 }).lean();

    // Fetch enrollments to get results
    const enrollments = await Enrollment.find({ studentId: profile._id })
      .populate({
        path: 'courseOfferingId',
        populate: [
          { path: 'courseId' },
          { path: 'semesterId', populate: { path: 'sessionId' } }
        ]
      })
      .lean();

    const enrollmentIds = enrollments.map(e => e._id);
    let resultsQuery = { enrollmentId: { $in: enrollmentIds }, status: 'Published' };

    const results = await Result.find(resultsQuery).lean();

    // Group results by semester
    let resultsBySemester = {};
    
    results.forEach(result => {
      const enrollment = enrollments.find(e => e._id.toString() === result.enrollmentId.toString());
      if (!enrollment || !enrollment.courseOfferingId || !enrollment.courseOfferingId.semesterId) return;

      const sem = enrollment.courseOfferingId.semesterId;
      const semKey = sem._id.toString();

      if (semesterId && semesterId !== semKey) return; // filter if selected

      if (!resultsBySemester[semKey]) {
        resultsBySemester[semKey] = {
          semester: sem,
          results: [],
          totalCredits: 0,
          earnedPoints: 0
        };
      }
      
      const course = enrollment.courseOfferingId.courseId;
      resultsBySemester[semKey].results.push({
        course,
        finalScore: result.finalScore,
        letterGrade: result.letterGrade,
        gradePoint: result.gradePoint,
        isPass: result.isPass
      });

      if (result.gradePoint !== undefined && course.creditUnits) {
        resultsBySemester[semKey].totalCredits += course.creditUnits;
        resultsBySemester[semKey].earnedPoints += (result.gradePoint * course.creditUnits);
      }
    });

    res.render('student/results', { 
      profile, 
      semesters, 
      selectedSemesterId: semesterId, 
      resultsBySemester 
    });
  } catch (err) {
    next(err);
  }
};

exports.getTranscript = async (req, res, next) => {
  try {
    const data = await ReportService.generateTranscriptData(req.user._id);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, data);
    }
    res.render('student/transcript', { data });
  } catch (err) {
    next(err);
  }
};
