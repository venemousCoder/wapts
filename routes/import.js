const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/authMiddleware');
const StorageService = require('../providers/StorageService');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');

router.use(ensureAuthenticated);
router.use(ensureRole(['Admin', 'HOD', 'Lecturer']));

router.post('/csv/scores', 
  StorageService.single('csv'),
  [
    body('assessmentId').notEmpty().withMessage('assessmentId is required')
  ], 
  validate, 
  importController.importScores
);

module.exports = router;
