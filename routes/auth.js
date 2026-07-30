const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

router.get('/login', authController.getLogin);

router.post('/login', loginLimiter, [
  body('loginIdentifier').notEmpty().withMessage('Login Identifier is required'),
  body('password').notEmpty().withMessage('Password is required')
], validate, authController.postLogin);

router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

const { ensureAuthenticated } = require('../middlewares/authMiddleware');
router.get('/change-password', ensureAuthenticated, authController.getChangePassword);
router.post('/change-password', ensureAuthenticated, [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], validate, authController.postChangePassword);

router.get('/reset-password', authController.getResetPassword);
router.post('/reset-password', [
  body('loginIdentifier').notEmpty().withMessage('Login Identifier is required'),
  body('currentPassword').notEmpty().withMessage('Current Password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], validate, authController.postResetPassword);

module.exports = router;
