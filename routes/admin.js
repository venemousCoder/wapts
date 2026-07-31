const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureRole, ensurePasswordChanged } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');

router.use(ensureAuthenticated);
router.use(ensurePasswordChanged);
router.use(ensureRole(['Admin']));

router.get('/dashboard', adminController.getDashboard);

router.get('/settings', adminController.getSettings);
router.post('/settings', [
  body('attendanceThreshold').optional().isNumeric(),
  body('minCreditLoad').optional().isNumeric(),
  body('maxCreditLoad').optional().isNumeric(),
  body('currentAcademicSession').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid Academic Session'),
  body('currentSemester').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid Semester'),
  body('activeGradeScale').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid Grade Scale')
], validate, adminController.putSettings);

router.get('/departments', adminController.getDepartments);
router.post('/departments', [
  body('name').notEmpty().withMessage('Name is required'),
  body('code').notEmpty().withMessage('Code is required')
], validate, adminController.createDepartment);

router.post('/departments/:id/edit', [
  body('name').notEmpty().withMessage('Name is required'),
  body('code').notEmpty().withMessage('Code is required')
], validate, adminController.updateDepartment);

router.post('/departments/:id/toggle-status', adminController.toggleDepartmentStatus);

router.get('/calendar', adminController.getCalendar);
router.post('/sessions', [
  body('name').notEmpty().withMessage('Name is required'),
  body('status').isIn(['Upcoming', 'Active', 'Closed', 'Archived']).withMessage('Invalid status')
], validate, adminController.createSession);

router.post('/semesters', [
  body('sessionId').isMongoId().withMessage('Invalid sessionId'),
  body('name').notEmpty().withMessage('Name is required')
], validate, adminController.createSemester);

router.post('/sessions/:id/edit', [
  body('name').notEmpty().withMessage('Name is required'),
  body('status').isIn(['Upcoming', 'Active', 'Closed', 'Archived']).withMessage('Invalid status')
], validate, adminController.updateSession);

router.post('/semesters/:id/edit', [
  body('sessionId').isMongoId().withMessage('Invalid sessionId'),
  body('name').notEmpty().withMessage('Name is required')
], validate, adminController.updateSemester);

router.get('/grades', adminController.getGrades);

// Other admin routes
router.get('/users', adminController.getUsers);
router.post('/users', [
  body('loginIdentifier').notEmpty().withMessage('loginIdentifier is required'),
  body('loginType').isIn(['ADMIN_USERNAME', 'INSTITUTIONAL_EMAIL', 'REG_NUMBER']).withMessage('Invalid loginType'),
  body('password').notEmpty().withMessage('password is required'),
  body('role').isIn(['Admin', 'HOD', 'Lecturer', 'Student']).withMessage('Invalid role'),
  body('firstName').notEmpty().withMessage('firstName is required'),
  body('lastName').notEmpty().withMessage('lastName is required')
], validate, adminController.createUser);

router.post('/users/:id/edit', [
  body('firstName').notEmpty().withMessage('firstName is required'),
  body('lastName').notEmpty().withMessage('lastName is required'),
  body('loginIdentifier').notEmpty().withMessage('loginIdentifier is required')
], validate, adminController.updateUser);

router.post('/users/:id/toggle-status', adminController.toggleUserStatus);

router.post('/users/bulk-action', [
  body('action').isIn(['delete', 'restore']).withMessage('Invalid action'),
  body('userIds').isArray({ min: 1 }).withMessage('At least one user must be selected')
], validate, adminController.postBulkUserAction);

router.post('/courses/bulk-action', [
  body('action').isIn(['delete', 'restore']).withMessage('Invalid action'),
  body('courseIds').isArray({ min: 1 }).withMessage('At least one course must be selected')
], validate, adminController.postBulkCourseAction);
module.exports = router;
