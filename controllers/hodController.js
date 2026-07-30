const DashboardSnapshot = require('../models/DashboardSnapshot');
const ResultService = require('../services/ResultService');
const ResponseHandler = require('../utils/responseHandler');

exports.getDashboard = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return ResponseHandler.error(res, 'HOD profile not found', 404);
      }
      return res.render('hod/dashboard', { 
        pendingApprovals: 0, 
        activeCourses: 0, 
        totalStudents: 0, 
        staffCount: 0, 
        recentSubmissions: [],
        error: 'Your HOD profile is incomplete or not assigned to a department.'
      });
    }

    const Course = require('../models/Course');
    const courses = await Course.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const courseIds = courses.map(c => c._id);

    const CourseOffering = require('../models/CourseOffering');
    const offerings = await CourseOffering.find({ courseId: { $in: courseIds } }).lean();
    const offeringIds = offerings.map(o => o._id);

    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ courseOfferingId: { $in: offeringIds } }).lean();
    const enrollmentIds = enrollments.map(e => e._id);

    const Result = require('../models/Result');
    const pendingApprovals = await Result.countDocuments({ enrollmentId: { $in: enrollmentIds }, status: 'Submitted' });

    const StudentProfile = require('../models/StudentProfile');
    const totalStudents = await StudentProfile.countDocuments({ departmentId: profile.departmentId, isDeleted: false });

    const LecturerProfile = require('../models/LecturerProfile');
    const staffCount = await LecturerProfile.countDocuments({ departmentId: profile.departmentId, isDeleted: false });

    const recentSubmissions = await Result.find({ enrollmentId: { $in: enrollmentIds }, status: 'Submitted' })
      .populate({ 
        path: 'enrollmentId', 
        populate: { 
          path: 'courseOfferingId', 
          populate: [
            { path: 'courseId' },
            { path: 'lecturerId', populate: { path: 'userId' } }
          ]
        } 
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const data = {
      pendingApprovals,
      activeCourses: courses.length,
      totalStudents,
      staffCount,
      recentSubmissions
    };

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, data);
    }
    res.render('hod/dashboard', data);
  } catch (err) {
    next(err);
  }
};

exports.getReviewView = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return ResponseHandler.error(res, 'HOD profile not found', 404);
      }
      return res.render('hod/review', { 
        results: [],
        error: 'Your HOD profile is incomplete or not assigned to a department.'
      });
    }

    const Course = require('../models/Course');
    const courses = await Course.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const courseIds = courses.map(c => c._id);

    const CourseOffering = require('../models/CourseOffering');
    const offerings = await CourseOffering.find({ courseId: { $in: courseIds } }).lean();
    const offeringIds = offerings.map(o => o._id);

    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ courseOfferingId: { $in: offeringIds } }).lean();
    const enrollmentIds = enrollments.map(e => e._id);

    const Result = require('../models/Result');
    const results = await Result.find({ enrollmentId: { $in: enrollmentIds }, status: { $in: ['Submitted', 'Approved'] } })
      .populate({ 
        path: 'enrollmentId', 
        populate: [
          { path: 'studentId', populate: { path: 'userId' } },
          { path: 'courseOfferingId', populate: { path: 'courseId' } }
        ] 
      })
      .lean();

    res.render('hod/review', { 
      results,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

exports.approveResult = async (req, res, next) => {
  try {
    const { resultId } = req.body;
    const result = await ResultService.approveResult(resultId);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, result, 'Result approved successfully');
    }
    res.redirect('/hod/results/review?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/hod/results/review?error=${encodeURIComponent(err.message)}`);
  }
};

exports.publishResult = async (req, res, next) => {
  try {
    const { resultId } = req.body;
    const result = await ResultService.publishResult(resultId);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, result, 'Result published successfully');
    }
    res.redirect('/hod/results/review?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/hod/results/review?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkAction = async (req, res, next) => {
  try {
    const { action, resultIds } = req.body;
    let successCount = 0;
    
    for (const resultId of resultIds) {
      try {
        if (action === 'approve') {
          await ResultService.approveResult(resultId);
          successCount++;
        } else if (action === 'publish') {
          await ResultService.publishResult(resultId);
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to ${action} result ${resultId}:`, err);
        // Continue processing others
      }
    }
    
    res.redirect(`/hod/results/review?success=${successCount}+results+successfully+${action}d`);
  } catch (err) {
    res.redirect(`/hod/results/review?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postPublishAllResults = async (req, res, next) => {
  try {
    const Result = require('../models/Result');
    const Course = require('../models/Course');
    const CourseOffering = require('../models/CourseOffering');
    const Enrollment = require('../models/Enrollment');
    const HodProfile = require('../models/HodProfile');
    
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return ResponseHandler.error(res, 'HOD profile not found', 404);
    
    const courses = await Course.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const courseIds = courses.map(c => c._id);

    const offerings = await CourseOffering.find({ courseId: { $in: courseIds } }).lean();
    const offeringIds = offerings.map(o => o._id);

    const enrollments = await Enrollment.find({ courseOfferingId: { $in: offeringIds } });
    const enrollmentIds = enrollments.map(e => e._id);
    
    const results = await Result.find({ enrollmentId: { $in: enrollmentIds }, status: 'Approved' });
    let publishedCount = 0;
    
    for (const result of results) {
      await ResultService.publishResult(result._id);
      publishedCount++;
    }

    res.redirect(`/hod/results/review?success=${encodeURIComponent('Successfully published ' + publishedCount + ' approved results.')}`);
  } catch (err) {
    res.redirect(`/hod/results/review?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkLecturerRequestAction = async (req, res, next) => {
  try {
    const { action, requestIds, reason } = req.body;
    const LecturerProfile = require('../models/LecturerProfile');
    
    let successCount = 0;
    
    for (const requestId of requestIds) {
      try {
        const profile = await LecturerProfile.findById(requestId);
        if (profile && profile.status === 'Pending') {
          if (action === 'approve') {
            profile.status = 'Approved';
          } else if (action === 'reject') {
            profile.status = 'Rejected';
            profile.rejectionReason = reason || 'Bulk rejected by HOD';
          }
          await profile.save();
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to ${action} request ${requestId}:`, err);
      }
    }
    
    res.redirect(`/hod/lecturer-requests?success=${successCount}+requests+successfully+${action}d`);
  } catch (err) {
    res.redirect(`/hod/lecturer-requests?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkOfferingAction = async (req, res, next) => {
  try {
    const { action, offeringIds } = req.body;
    const CourseOffering = require('../models/CourseOffering');
    
    let successCount = 0;
    
    for (const offeringId of offeringIds) {
      try {
        const offering = await CourseOffering.findById(offeringId);
        if (offering && offering.status === 'Draft' && action === 'publish') {
          if (!offering.lecturerId) {
            throw new Error('Cannot publish offering without assigned lecturer');
          }
          offering.status = 'Published';
          await offering.save();
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to ${action} offering ${offeringId}:`, err);
      }
    }
    
    res.redirect(`/hod/offerings?success=${successCount}+offerings+successfully+${action}ed`);
  } catch (err) {
    res.redirect(`/hod/offerings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getCoordinators = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) return res.render('hod/coordinators', { error: 'HOD profile not found', lecturers: [] });

    const LecturerProfile = require('../models/LecturerProfile');
    const User = require('../models/User');

    const lecturerProfiles = await LecturerProfile.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const userIds = lecturerProfiles.map(lp => lp.userId);
    const lecturers = await User.find({ _id: { $in: userIds } }).lean();

    const fullLecturers = lecturers.map(lecturer => {
      const lp = lecturerProfiles.find(p => p.userId.toString() === lecturer._id.toString());
      return { ...lecturer, profile: lp };
    });

    res.render('hod/coordinators', {
      lecturers: fullLecturers,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    next(err);
  }
};

exports.assignCoordinator = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const LecturerProfile = require('../models/LecturerProfile');
    const lecturerProfile = await LecturerProfile.findOne({ userId: req.params.id, departmentId: profile.departmentId, isDeleted: false });
    if (!lecturerProfile) throw new Error('Lecturer not found in your department');

    const { assignedLevels } = req.body;
    if (!assignedLevels) throw new Error('Assigned levels required');

    let levels = assignedLevels.split(',').map(l => parseInt(l.trim())).filter(l => !isNaN(l));
    if (levels.length === 0) throw new Error('Invalid assigned levels');

    if (!lecturerProfile.responsibilities.includes('LEVEL_COORDINATOR')) {
      lecturerProfile.responsibilities.push('LEVEL_COORDINATOR');
    }
    lecturerProfile.assignedLevels = levels;
    await lecturerProfile.save();

    res.redirect('/hod/coordinators?success=Level%20Coordinator%20Assigned');
  } catch (err) {
    res.redirect(`/hod/coordinators?error=${encodeURIComponent(err.message)}`);
  }
};

exports.removeCoordinator = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const LecturerProfile = require('../models/LecturerProfile');
    const lecturerProfile = await LecturerProfile.findOne({ userId: req.params.id, departmentId: profile.departmentId, isDeleted: false });
    if (!lecturerProfile) throw new Error('Lecturer not found in your department');

    lecturerProfile.responsibilities = lecturerProfile.responsibilities.filter(r => r !== 'LEVEL_COORDINATOR');
    lecturerProfile.assignedLevels = [];
    await lecturerProfile.save();

    res.redirect('/hod/coordinators?success=Level%20Coordinator%20Removed');
  } catch (err) {
    res.redirect(`/hod/coordinators?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getLecturerRequests = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const LecturerRequest = require('../models/LecturerRequest');
    const requests = await LecturerRequest.find({ departmentId: profile.departmentId }).sort({ createdAt: -1 }).lean();

    res.render('hod/lecturer-requests', { requests, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.approveLecturerRequest = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const LecturerRequest = require('../models/LecturerRequest');
    const request = await LecturerRequest.findById(req.params.id);
    
    if (!request || request.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Request not found or unauthorized');
    }
    
    if (request.status !== 'Pending') {
      throw new Error('Request has already been processed');
    }

    const UserService = require('../services/UserService');
    const AuditService = require('../services/AuditService');
    
    // Deterministic temp password (lowercase last name + 123)
    const tempPassword = request.lastName.toLowerCase().replace(/[^a-z]/g, '') + '123';
    
    const user = await UserService.createUser(
      {
        loginIdentifier: request.staffNumber,
        loginType: 'INSTITUTIONAL_EMAIL',
        password: tempPassword,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phoneNumber: request.phone
      },
      {
        departmentId: request.departmentId,
        designation: request.academicRank
      },
      'Lecturer'
    );
    
    user.requiresPasswordChange = true;
    await user.save();

    request.status = 'Approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditService.log('APPROVE_LECTURER_REQUEST', 'LecturerRequest', request._id, request, null, req.user._id, req.ip, 'System');

    // Simulate email notification
    console.log(`[EMAIL SIMULATION] To: ${request.email} | Subject: WAPTS Account Approved | Body: Your account has been approved. Your username is ${request.staffNumber} or ${request.email} and your temporary password is ${tempPassword}. Please login to change it.`);

    res.redirect('/hod/lecturer-requests?success=Request%20Approved');
  } catch (err) {
    res.redirect(`/hod/lecturer-requests?error=${encodeURIComponent(err.message)}`);
  }
};

exports.rejectLecturerRequest = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const LecturerRequest = require('../models/LecturerRequest');
    const request = await LecturerRequest.findById(req.params.id);
    
    if (!request || request.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Request not found or unauthorized');
    }

    if (request.status !== 'Pending') {
      throw new Error('Request has already been processed');
    }

    request.status = 'Rejected';
    request.rejectionReason = req.body.reason || 'No reason provided';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const AuditService = require('../services/AuditService');
    await AuditService.log('REJECT_LECTURER_REQUEST', 'LecturerRequest', request._id, request, null, req.user._id, req.ip, 'System');

    console.log(`[EMAIL SIMULATION] To: ${request.email} | Subject: WAPTS Account Rejected | Body: Your account request was rejected. Reason: ${request.rejectionReason}`);

    res.redirect('/hod/lecturer-requests?success=Request%20Rejected');
  } catch (err) {
    res.redirect(`/hod/lecturer-requests?error=${encodeURIComponent(err.message)}`);
  }
};


exports.getCourses = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) {
      return res.render('hod/courses', { courses: [], error: 'Your HOD profile is incomplete or not assigned to a department.' });
    }

    const Course = require('../models/Course');
    const courses = await Course.find({ departmentId: profile.departmentId }).lean();
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, courses);
    }
    res.render('hod/courses', { courses, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const { code, title, creditUnits, description, programme, level } = req.body;
    const Course = require('../models/Course');
    const course = new Course({ 
      code, title, creditUnits, description, programme, level, 
      departmentId: profile.departmentId 
    });
    await course.save();

    const AuditService = require('../services/AuditService');
    await AuditService.log('CREATE_COURSE', 'Course', course._id, course, null, req.user._id, req.ip, 'System');

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, course, 'Course created successfully');
    }
    res.redirect('/hod/courses?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/hod/courses?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const { code, title, creditUnits, description, programme, level } = req.body;
    const Course = require('../models/Course');
    const course = await Course.findById(req.params.id);
    
    if (!course || course.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Course not found or unauthorized');
    }

    const oldData = course.toObject();
    course.code = code;
    course.title = title;
    course.creditUnits = creditUnits;
    course.description = description;
    course.programme = programme;
    course.level = level;
    await course.save();

    const AuditService = require('../services/AuditService');
    await AuditService.log('UPDATE_COURSE', 'Course', course._id, course, oldData, req.user._id, req.ip, 'System');

    res.redirect('/hod/courses?success=true');
  } catch (err) {
    res.redirect(`/hod/courses?error=${encodeURIComponent(err.message)}`);
  }
};

exports.toggleCourseStatus = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const Course = require('../models/Course');
    const course = await Course.findById(req.params.id);
    
    if (!course || course.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Course not found or unauthorized');
    }

    course.status = course.status === 'Active' ? 'Archived' : 'Active';
    // also set isDeleted for backward compatibility if needed, or simply rely on status
    course.isDeleted = (course.status === 'Archived');
    if (course.isDeleted) {
      course.deletedAt = new Date();
    } else {
      course.deletedAt = null;
    }
    await course.save();

    const AuditService = require('../services/AuditService');
    await AuditService.log('ARCHIVE_COURSE', 'Course', course._id, course, null, req.user._id, req.ip, 'System');

    res.redirect('/hod/courses?success=true');
  } catch (err) {
    res.redirect(`/hod/courses?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getOfferings = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) {
      return res.render('hod/course-offerings', { offerings: [], courses: [], sessions: [], semesters: [], lecturers: [], error: 'Your HOD profile is incomplete or not assigned to a department.' });
    }

    const Course = require('../models/Course');
    const courses = await Course.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const courseIds = courses.map(c => c._id);

    const CourseOffering = require('../models/CourseOffering');
    const offerings = await CourseOffering.find({ courseId: { $in: courseIds } })
      .populate('courseId')
      .populate('sessionId')
      .populate('semesterId')
      .populate({ path: 'lecturerId', populate: { path: 'userId' } })
      .lean();

    const AcademicSession = require('../models/AcademicSession');
    const Semester = require('../models/Semester');
    const LecturerProfile = require('../models/LecturerProfile');
    const User = require('../models/User');

    const sessions = await AcademicSession.find().lean();
    const semesters = await Semester.find().lean();
    
    // Find lecturers in this department
    const lecturerProfiles = await LecturerProfile.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const lecturerUserIds = lecturerProfiles.map(l => l.userId);
    const lecturerUsers = await User.find({ _id: { $in: lecturerUserIds }, isDeleted: false }).lean();
    
    const lecturers = lecturerProfiles.map(lp => {
      const u = lecturerUsers.find(u => u._id.toString() === lp.userId.toString());
      return { ...lp, user: u };
    });

    res.render('hod/course-offerings', { 
      offerings, courses, sessions, semesters, lecturers, 
      success: req.query.success, error: req.query.error 
    });
  } catch (err) {
    next(err);
  }
};

exports.createOffering = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const { courseId, sessionId, semesterId, capacity } = req.body;
    
    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    if (!course || course.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Course not found or unauthorized');
    }

    const CourseOffering = require('../models/CourseOffering');
    
    // Check for duplicates unless allowed
    const existing = await CourseOffering.findOne({ courseId, sessionId, semesterId, isDeleted: false });
    if (existing) {
      throw new Error('A course offering for this course, session, and semester already exists.');
    }

    const offering = new CourseOffering({ 
      courseId, sessionId, semesterId, capacity: parseInt(capacity), status: 'Draft' 
    });
    await offering.save();

    const AuditService = require('../services/AuditService');
    await AuditService.log('CREATE_COURSE_OFFERING', 'CourseOffering', offering._id, offering, null, req.user._id, req.ip, 'System');

    res.redirect('/hod/offerings?success=true');
  } catch (err) {
    res.redirect(`/hod/offerings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.publishOffering = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const CourseOffering = require('../models/CourseOffering');
    const Course = require('../models/Course');
    
    const offering = await CourseOffering.findById(req.params.id).populate('courseId');
    if (!offering || offering.courseId.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Course offering not found or unauthorized');
    }

    if (!offering.lecturerId) {
      throw new Error('Cannot publish offering without an assigned lecturer.');
    }

    offering.status = 'Published';
    await offering.save();

    const AuditService = require('../services/AuditService');
    await AuditService.log('PUBLISH_COURSE_OFFERING', 'CourseOffering', offering._id, offering, null, req.user._id, req.ip, 'System');

    res.redirect('/hod/offerings?success=true');
  } catch (err) {
    res.redirect(`/hod/offerings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.closeOffering = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const CourseOffering = require('../models/CourseOffering');
    const offering = await CourseOffering.findById(req.params.id).populate('courseId');
    
    if (!offering || offering.courseId.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Course offering not found or unauthorized');
    }

    offering.status = 'Closed';
    await offering.save();

    res.redirect('/hod/offerings?success=true');
  } catch (err) {
    res.redirect(`/hod/offerings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.lookupLecturer = async (req, res, next) => {
  try {
    const { staffNumber } = req.query;
    if (!staffNumber) {
      return res.status(400).json({ success: false, message: 'Staff number is required' });
    }

    const LecturerAssignmentService = require('../services/LecturerAssignmentService');
    const lecturer = await LecturerAssignmentService.lookupLecturerByStaffNumber(staffNumber);

    if (!lecturer) {
      return res.status(404).json({ success: false, message: 'No lecturer found with that staff number.' });
    }

    res.json({ success: true, lecturer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignLecturer = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    if (!profile) throw new Error('HOD profile not found');

    const { lecturerId, overrideWorkload } = req.body;
    const forceOverride = overrideWorkload === 'on' || overrideWorkload === 'true';

    const CourseOffering = require('../models/CourseOffering');
    const offering = await CourseOffering.findById(req.params.id).populate('courseId');
    
    // Validate HOD owns the offering
    if (!offering || offering.courseId.departmentId.toString() !== profile.departmentId.toString()) {
      throw new Error('Course offering not found or unauthorized');
    }

    const LecturerAssignmentService = require('../services/LecturerAssignmentService');
    
    // Call the service (it throws errors if validation fails)
    await LecturerAssignmentService.assignLecturer(offering._id, lecturerId, req.user._id, forceOverride);

    res.redirect('/hod/offerings?success=Lecturer+assigned+successfully');
  } catch (err) {
    if (err.message.includes('WORKLOAD_WARNING')) {
      res.redirect(`/hod/offerings?error=${encodeURIComponent(err.message)}&workloadWarning=true&offeringId=${req.params.id}&lecturerId=${req.body.lecturerId}`);
    } else {
      res.redirect(`/hod/offerings?error=${encodeURIComponent(err.message)}`);
    }
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const HodProfile = require('../models/HodProfile');
    const profile = await HodProfile.findOne({ userId: req.user._id, isDeleted: false });
    
    if (!profile) {
      return res.render('hod/analytics', { error: 'Your HOD profile is incomplete.' });
    }

    const Course = require('../models/Course');
    const courses = await Course.find({ departmentId: profile.departmentId, isDeleted: false }).lean();
    const courseIds = courses.map(c => c._id);
    
    const CourseOffering = require('../models/CourseOffering');
    const offerings = await CourseOffering.find({ courseId: { $in: courseIds } }).populate('courseId').lean();
    const offeringIds = offerings.map(o => o._id);

    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ courseOfferingId: { $in: offeringIds } }).lean();
    
    const Result = require('../models/Result');
    const enrollmentIds = enrollments.map(e => e._id);
    const results = await Result.find({ enrollmentId: { $in: enrollmentIds } }).lean();

    // Overall pass rate
    const gradedResults = results.filter(r => r.status !== 'Draft');
    const passedResults = gradedResults.filter(r => r.isPass);
    const passRate = gradedResults.length ? Math.round((passedResults.length / gradedResults.length) * 100) : 0;

    // Active Courses
    const activeCourses = courses.filter(c => c.status === 'Active').length;

    // Top performing course
    let offeringStats = {};
    offerings.forEach(o => {
      offeringStats[o._id] = { course: o.courseId, total: 0, passed: 0 };
    });
    
    gradedResults.forEach(r => {
      const enr = enrollments.find(e => e._id.toString() === r.enrollmentId.toString());
      if (enr && offeringStats[enr.courseOfferingId]) {
        offeringStats[enr.courseOfferingId].total++;
        if (r.isPass) offeringStats[enr.courseOfferingId].passed++;
      }
    });

    let topCourse = { code: 'N/A', rate: 0, title: 'No data' };
    let alerts = [];

    Object.values(offeringStats).forEach(stat => {
      if (stat.total > 0) {
        const rate = Math.round((stat.passed / stat.total) * 100);
        if (rate > topCourse.rate) {
          topCourse = { code: stat.course.code, rate, title: stat.course.title };
        }
        if (rate < 50) {
          alerts.push({
            title: `${stat.course.code} Results`,
            severity: 'text-danger',
            message: `${100 - rate}% of students failed this course. Review assessment methods.`
          });
        }
      }
    });

    const closedOfferings = offerings.filter(o => o.status === 'Closed');
    closedOfferings.forEach(o => {
      const offeringResults = gradedResults.filter(r => {
        const enr = enrollments.find(e => e._id.toString() === r.enrollmentId.toString());
        return enr && enr.courseOfferingId.toString() === o._id.toString();
      });
      if (offeringResults.length === 0) {
        alerts.push({
          title: `Missing Grades - ${o.courseId.code}`,
          severity: 'text-warning',
          message: `Grades have not been submitted yet. Deadline approaches.`
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        title: `All Good`,
        severity: 'text-success',
        message: `No immediate actions required.`
      });
    }

    res.render('hod/analytics', {
      passRate,
      activeCourses,
      topCourse,
      alerts
    });
  } catch (err) {
    next(err);
  }
};
