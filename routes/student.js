const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { ensureAuthenticated, ensureRole, ensurePasswordChanged } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');

router.use(ensureAuthenticated);
router.use(ensurePasswordChanged);
router.use(ensureRole(['Student']));

router.get('/dashboard', studentController.getDashboard);

router.get('/goal-tracker', studentController.getGoalTracker);
router.post('/goal-tracker', [
  body('targetCGPA').isNumeric().withMessage('Target CGPA must be a valid number')
], validate, studentController.postSaveGoal);

router.get('/courses', studentController.getCourses);
router.get('/courses/register', studentController.getCourses);

router.post('/courses/enroll', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required')
], validate, studentController.enrollCourse);

router.post('/courses/bulk-enroll', [
  body('action').isIn(['enroll', 'drop']).withMessage('Invalid action'),
  body('courseOfferingIds').isArray({ min: 1 }).withMessage('At least one course offering must be selected')
], validate, studentController.postBulkEnrollAction);

router.get('/attendance', studentController.getAttendance);
router.get('/results', studentController.getResults);

router.get('/transcript', studentController.getTranscript);

module.exports = router;
