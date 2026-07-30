const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');

router.get('/lecturer', onboardingController.getLecturerRegistration);

router.post('/lecturer', [
  body('firstName').notEmpty().withMessage('First Name is required'),
  body('lastName').notEmpty().withMessage('Last Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('staffNumber').notEmpty().withMessage('Staff Number is required'),
  body('departmentId').notEmpty().withMessage('Department is required')
], validate, onboardingController.postLecturerRegistration);

module.exports = router;
