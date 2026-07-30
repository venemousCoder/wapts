const express = require('express');
const router = express.Router();
const lecturerController = require('../controllers/lecturerController');
const { ensureAuthenticated, ensureRole, ensurePasswordChanged } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');

router.use(ensureAuthenticated);
router.use(ensurePasswordChanged);
router.use(ensureRole(['Lecturer']));

router.get('/dashboard', lecturerController.getDashboard);

router.get('/courses', lecturerController.getCoursesView);
router.get('/attendance', lecturerController.getAttendanceView);
router.get('/assessments', lecturerController.getAssessmentsView);
router.post('/assessments', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required'),
  body('title').notEmpty().withMessage('title is required'),
  body('assessmentTypeId').notEmpty().withMessage('assessmentTypeId is required'),
  body('weight').isNumeric(),
  body('maximumMarks').isNumeric(),
  body('status').isIn(['Draft', 'Published'])
], validate, lecturerController.createAssessment);
router.post('/assessments/:id/publish', lecturerController.publishAssessment);

router.post('/assessments/bulk-action', [
  body('action').isIn(['publish']).withMessage('Invalid action'),
  body('assessmentIds').isArray({ min: 1 }).withMessage('At least one assessment must be selected')
], validate, lecturerController.postBulkAssessmentAction);
router.get('/results', lecturerController.getResultsView);

router.post('/attendance', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required'),
  body('week').isNumeric(),
  body('lectureDate').notEmpty(),
  body('recordsData').isArray().withMessage('recordsData must be an array')
], validate, lecturerController.postAttendance);

router.post('/assessments/scores', [
  body('assessmentId').notEmpty().withMessage('assessmentId is required'),
  body('scoresData').isArray().withMessage('scoresData must be an array')
], validate, lecturerController.postAssessmentScores);

router.post('/results/submit', [
  body('resultId').notEmpty().withMessage('resultId is required')
], validate, lecturerController.submitResults);

router.post('/results/compile', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required')
], validate, lecturerController.postCompileResults);

router.post('/results/submit-all', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required')
], validate, lecturerController.postSubmitAllResults);

const { ensureResponsibility } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use('/students', ensureResponsibility('LEVEL_COORDINATOR'));

router.get('/students', lecturerController.getStudents);
router.post('/students', [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('loginIdentifier').notEmpty().withMessage('Registration Number is required'),
  body('level').isNumeric().withMessage('Valid level is required')
], validate, lecturerController.createStudent);
router.post('/students/import', upload.single('importFile'), lecturerController.importStudents);
router.post('/students/cohort-registration', [
  body('level').isNumeric().withMessage('Valid level is required')
], validate, lecturerController.postCohortRegistration);
router.post('/students/:id/toggle-status', lecturerController.toggleStudentStatus);
router.post('/students/:id/edit-reg-number', [
  body('newRegNumber').notEmpty().withMessage('Registration number is required')
], validate, lecturerController.editStudentRegNumber);

router.get('/students/:id/registration', lecturerController.getRegistrationView);
router.post('/students/:id/registration/recommended', lecturerController.postRecommendedRegistration);
router.post('/students/:id/registration/add', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required')
], validate, lecturerController.postAddCourse);
router.post('/students/:id/registration/remove', [
  body('courseOfferingId').notEmpty().withMessage('courseOfferingId is required')
], validate, lecturerController.postRemoveCourse);

router.post('/students/:id/registration/bulk-action', [
  body('action').isIn(['register', 'drop']).withMessage('Invalid action'),
  body('courseOfferingIds').isArray({ min: 1 }).withMessage('At least one course offering must be selected')
], validate, lecturerController.postBulkRegistrationAction);

module.exports = router;
