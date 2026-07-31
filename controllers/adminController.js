const DashboardSnapshot = require('../models/DashboardSnapshot');
const SystemSetting = require('../models/SystemSetting');
const Department = require('../models/Department');
const User = require('../models/User');
const Course = require('../models/Course');
const UserService = require('../services/UserService');
const ResponseHandler = require('../utils/responseHandler');
const mongoose = require('mongoose');

exports.getDashboard = async (req, res, next) => {
  try {
    const AuditLog = require('../models/AuditLog');
    
    const [totalStudents, activeLecturers, totalDepartments, recentLogs] = await Promise.all([
      User.countDocuments({ role: 'Student', isDeleted: false }),
      User.countDocuments({ role: 'Lecturer', isDeleted: false }),
      Department.countDocuments({ isDeleted: false }),
      AuditLog.find()
        .populate('userId', 'loginIdentifier firstName lastName')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ]);

    const data = {
      totalStudents,
      activeLecturers,
      totalDepartments,
      recentLogs
    };

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, data);
    }
    res.render('admin/dashboard', data);
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findOne().populate('currentAcademicSession currentSemester activeGradeScale activeClassificationScheme').lean();
    
    const AcademicSession = require('../models/AcademicSession');
    const Semester = require('../models/Semester');
    const GradeScale = require('../models/GradeScale');
    const Classification = require('../models/Classification');

    const [academicSessions, semesters, gradeScales, classifications] = await Promise.all([
      AcademicSession.find().sort({ createdAt: -1 }).lean(),
      Semester.find().populate('sessionId').sort({ createdAt: -1 }).lean(),
      GradeScale.find().lean(),
      Classification.find().lean()
    ]);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, { settings, academicSessions, semesters, gradeScales, classifications });
    }
    res.render('admin/settings', { settings, academicSessions, semesters, gradeScales, classifications, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.putSettings = async (req, res, next) => {
  try {
    if (req.body.allowedEmailDomains) {
      req.body.allowedEmailDomains = req.body.allowedEmailDomains.split(',').map(d => d.trim()).filter(d => d);
    }
    
    const updateData = { ...req.body };
    // Handle falsy inputs (e.g. Empty dropdown selections)
    if (!updateData.currentAcademicSession) updateData.currentAcademicSession = null;
    if (!updateData.currentSemester) updateData.currentSemester = null;
    if (!updateData.activeGradeScale) updateData.activeGradeScale = null;

    if (updateData.currentSemester && updateData.currentAcademicSession) {
      const Semester = require('../models/Semester');
      const semester = await Semester.findById(updateData.currentSemester);
      if (!semester || semester.sessionId.toString() !== updateData.currentAcademicSession.toString()) {
        throw new Error('Selected Semester does not belong to the selected Academic Session.');
      }
    }

    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    await settings.save();

    const eventBus = require('../utils/eventBus');
    eventBus.emit('config.updated', { settings });

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, settings, 'Settings updated successfully');
    }
    res.redirect('/admin/settings?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/admin/settings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().lean();
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, departments);
    }
    res.render('admin/departments', { departments, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const department = new Department({ name, code });
    await department.save();
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, department, 'Department created successfully');
    }
    res.redirect('/admin/departments?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/admin/departments?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) throw new Error('Department not found');

    department.name = name;
    department.code = code;
    await department.save();

    res.redirect('/admin/departments?success=true');
  } catch (err) {
    res.redirect(`/admin/departments?error=${encodeURIComponent(err.message)}`);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new Error('User not found');
    }
    user.isDeleted = !user.isDeleted;
    await user.save();
    res.redirect('/admin/users?success=true');
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkUserAction = async (req, res, next) => {
  try {
    const { action, userIds } = req.body;
    const User = require('../models/User');
    
    const isDeleted = action === 'delete';
    
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isDeleted: isDeleted } }
    );
    
    res.redirect(`/admin/users?success=${userIds.length}+users+successfully+${action}d`);
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
};

exports.postBulkCourseAction = async (req, res, next) => {
  try {
    const { action, courseIds } = req.body;
    const Course = require('../models/Course');
    
    const isDeleted = action === 'delete';
    
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $set: { isDeleted: isDeleted } }
    );
    
    res.redirect(`/admin/settings?success=${courseIds.length}+courses+successfully+${action}d`);
  } catch (err) {
    res.redirect(`/admin/settings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.toggleDepartmentStatus = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) throw new Error('Department not found');

    department.isDeleted = !department.isDeleted;
    if (department.isDeleted) {
      department.deletedAt = new Date();
    } else {
      department.deletedAt = null;
    }
    await department.save();

    res.redirect('/admin/departments?success=true');
  } catch (err) {
    res.redirect(`/admin/departments?error=${encodeURIComponent(err.message)}`);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().lean();
    const departments = await Department.find({ isDeleted: false }).lean();
    
    const StudentProfile = require('../models/StudentProfile');
    const LecturerProfile = require('../models/LecturerProfile');
    const HodProfile = require('../models/HodProfile');

    const [students, lecturers, hods] = await Promise.all([
      StudentProfile.find().lean(),
      LecturerProfile.find().lean(),
      HodProfile.find().lean()
    ]);

    users.forEach(user => {
      if (user.role === 'Student') user.profile = students.find(s => s.userId.toString() === user._id.toString());
      if (user.role === 'Lecturer') user.profile = lecturers.find(s => s.userId.toString() === user._id.toString());
      if (user.role === 'HOD') user.profile = hods.find(s => s.userId.toString() === user._id.toString());
    });

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, users);
    }
    res.render('admin/users', { users, departments, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { loginIdentifier, loginType, password, role, firstName, lastName, ...profileData } = req.body;
    
    if (role === 'Student') {
      throw new Error('Students can only be registered by a Head of Department.');
    }
    if (role === 'Lecturer') {
      throw new Error('Lecturers must initiate their own onboarding via the self-service portal.');
    }
    
    const user = await UserService.createUser(
      { loginIdentifier, loginType, password, firstName, lastName },
      profileData || {},
      role
    );
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, user, 'User created successfully');
    }
    res.redirect('/admin/users?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, loginIdentifier, profile_departmentId, profile_level, profile_admissionYear, profile_appointmentDate } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new Error('User not found');
    
    user.firstName = firstName;
    user.lastName = lastName;
    user.loginIdentifier = loginIdentifier;
    await user.save();

    const StudentProfile = require('../models/StudentProfile');
    const LecturerProfile = require('../models/LecturerProfile');
    const HodProfile = require('../models/HodProfile');

    let profileUpdate = {};
    if (profile_departmentId) profileUpdate.departmentId = profile_departmentId;

    if (user.role === 'Student') {
      if (profile_level) profileUpdate.level = profile_level;
      if (profile_admissionYear) profileUpdate.admissionYear = profile_admissionYear;
      if (Object.keys(profileUpdate).length > 0) {
        await StudentProfile.findOneAndUpdate({ userId: user._id }, { $set: profileUpdate }, { upsert: true, new: true, runValidators: true });
      }
    } else if (user.role === 'Lecturer') {
      if (Object.keys(profileUpdate).length > 0) {
        await LecturerProfile.findOneAndUpdate({ userId: user._id }, { $set: profileUpdate }, { upsert: true, new: true, runValidators: true });
      }
    } else if (user.role === 'HOD') {
      if (profile_appointmentDate) profileUpdate.appointmentDate = profile_appointmentDate;
      if (Object.keys(profileUpdate).length > 0) {
        await HodProfile.findOneAndUpdate({ userId: user._id }, { $set: profileUpdate }, { upsert: true, new: true, runValidators: true });
      }
    }

    res.redirect('/admin/users?success=true');
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error('User not found');
    user.isDeleted = !user.isDeleted;
    await user.save();
    
    const update = { isDeleted: user.isDeleted };
    const StudentProfile = require('../models/StudentProfile');
    const LecturerProfile = require('../models/LecturerProfile');
    const HodProfile = require('../models/HodProfile');
    
    if (user.role === 'Student') await StudentProfile.updateOne({ userId: user._id }, update);
    else if (user.role === 'Lecturer') await LecturerProfile.updateOne({ userId: user._id }, update);
    else if (user.role === 'HOD') await HodProfile.updateOne({ userId: user._id }, update);
    
    res.redirect('/admin/users?success=true');
  } catch(err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
};

// Course methods removed. Now handled by HOD.

exports.getCalendar = async (req, res, next) => {
  try {
    const AcademicSession = require('../models/AcademicSession');
    const Semester = require('../models/Semester');
    
    const sessions = await AcademicSession.find().sort({ createdAt: -1 }).lean();
    const semesters = await Semester.find().populate('sessionId').sort({ createdAt: -1 }).lean();
    
    res.render('admin/calendar', { sessions, semesters, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.getGrades = async (req, res, next) => {
  try {
    const GradeScale = require('../models/GradeScale');
    const Classification = require('../models/Classification');
    
    const gradeScales = await GradeScale.find().lean();
    const classifications = await Classification.find().lean();
    
    res.render('admin/grades', { gradeScales, classifications, success: req.query.success, error: req.query.error });
  } catch (err) {
    next(err);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const AcademicSession = require('../models/AcademicSession');
    const { name, status } = req.body;
    const session = new AcademicSession({ name, status });
    await session.save();
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, session, 'Session created successfully');
    }
    res.redirect('/admin/calendar?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/admin/calendar?error=${encodeURIComponent(err.message)}`);
  }
};

exports.createSemester = async (req, res, next) => {
  try {
    const Semester = require('../models/Semester');
    const { sessionId, name, isActive } = req.body;
    const semester = new Semester({ 
      sessionId, 
      name, 
      isActive: isActive === 'true' || isActive === 'on' 
    });
    await semester.save();
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return ResponseHandler.success(res, semester, 'Semester created successfully');
    }
    res.redirect('/admin/calendar?success=true');
  } catch (err) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return next(err);
    }
    res.redirect(`/admin/calendar?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const AcademicSession = require('../models/AcademicSession');
    const { name, status } = req.body;
    const session = await AcademicSession.findById(req.params.id);
    if (!session) throw new Error('Session not found');
    
    session.name = name;
    session.status = status;
    await session.save();
    
    res.redirect('/admin/calendar?success=true');
  } catch (err) {
    res.redirect(`/admin/calendar?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateSemester = async (req, res, next) => {
  try {
    const Semester = require('../models/Semester');
    const { sessionId, name, isActive } = req.body;
    const semester = await Semester.findById(req.params.id);
    if (!semester) throw new Error('Semester not found');
    
    semester.sessionId = sessionId;
    semester.name = name;
    semester.isActive = isActive === 'true' || isActive === 'on';
    
    await semester.save();
    
    res.redirect('/admin/calendar?success=true');
  } catch (err) {
    res.redirect(`/admin/calendar?error=${encodeURIComponent(err.message)}`);
  }
};
