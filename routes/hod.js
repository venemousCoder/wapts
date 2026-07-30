const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');
const { ensureAuthenticated, ensureRole, ensurePasswordChanged } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');

router.use(ensureAuthenticated);
router.use(ensurePasswordChanged);
router.use(ensureRole(['HOD']));

router.get('/dashboard', hodController.getDashboard);

router.get('/results/review', hodController.getReviewView);
router.get('/analytics', hodController.getAnalytics);

router.post('/results/approve', [
  body('resultId').notEmpty().withMessage('resultId is required')
], validate, hodController.approveResult);

router.post('/results/publish', [
  body('resultId').notEmpty().withMessage('resultId is required')
], validate, hodController.publishResult);

router.post('/results/publish-all', hodController.postPublishAllResults);

router.post('/results/bulk-action', [
  body('action').isIn(['approve', 'publish']).withMessage('Invalid action'),
  body('resultIds').isArray({ min: 1 }).withMessage('At least one result must be selected')
], validate, hodController.postBulkAction);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/coordinators', hodController.getCoordinators);
router.post('/coordinators/:id/assign', [
  body('assignedLevels').notEmpty().withMessage('Assigned levels are required')
], validate, hodController.assignCoordinator);
router.post('/coordinators/:id/remove', hodController.removeCoordinator);

router.get('/lecturer-requests', hodController.getLecturerRequests);
router.post('/lecturer-requests/:id/approve', hodController.approveLecturerRequest);
router.post('/lecturer-requests/:id/reject', [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], validate, hodController.rejectLecturerRequest);

router.post('/lecturer-requests/bulk-action', [
  body('action').isIn(['approve', 'reject']).withMessage('Invalid action'),
  body('requestIds').isArray({ min: 1 }).withMessage('At least one request must be selected'),
  body('reason').optional().isString()
], validate, hodController.postBulkLecturerRequestAction);

// Course Management
router.get('/courses', hodController.getCourses);
router.post('/courses', [
  body('code').notEmpty().withMessage('code is required'),
  body('title').notEmpty().withMessage('title is required'),
  body('creditUnits').isNumeric().withMessage('creditUnits must be numeric'),
  body('programme').notEmpty().withMessage('programme is required'),
  body('level').isNumeric().withMessage('level must be numeric')
], validate, hodController.createCourse);

router.post('/courses/:id/edit', [
  body('code').notEmpty().withMessage('code is required'),
  body('title').notEmpty().withMessage('title is required'),
  body('creditUnits').isNumeric().withMessage('creditUnits must be numeric'),
  body('programme').notEmpty().withMessage('programme is required'),
  body('level').isNumeric().withMessage('level must be numeric')
], validate, hodController.updateCourse);

router.post('/courses/:id/toggle-status', hodController.toggleCourseStatus);

// Course Offerings Management
router.get('/offerings', hodController.getOfferings);
router.post('/offerings', [
  body('courseId').isMongoId().withMessage('Valid Course is required'),
  body('sessionId').isMongoId().withMessage('Valid Session is required'),
  body('semesterId').isMongoId().withMessage('Valid Semester is required'),
  body('capacity').isNumeric().withMessage('Capacity must be numeric')
], validate, hodController.createOffering);

router.get('/offerings/lookup-lecturer', hodController.lookupLecturer);
router.post('/offerings/:id/publish', hodController.publishOffering);
router.post('/offerings/:id/close', hodController.closeOffering);

router.post('/offerings/bulk-action', [
  body('action').isIn(['publish']).withMessage('Invalid action'),
  body('offeringIds').isArray({ min: 1 }).withMessage('At least one offering must be selected')
], validate, hodController.postBulkOfferingAction);

router.post('/offerings/:id/assign-lecturer', [
  body('lecturerId').isMongoId().withMessage('Valid Lecturer is required')
], validate, hodController.assignLecturer);

module.exports = router;
