const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/auth/login');
});

router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/hod', require('./hod'));
router.use('/lecturer', require('./lecturer'));
router.use('/student', require('./student'));
router.use('/import', require('./import'));
router.use('/onboarding', require('./public'));
router.use('/profile', require('./profile'));

module.exports = router;
