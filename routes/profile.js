const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const User = require('../models/User');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profileData = null;
    
    // Load specific profile data based on role
    if (user.role === 'Student') {
      const StudentProfile = require('../models/StudentProfile');
      profileData = await StudentProfile.findOne({ userId: user._id }).populate('departmentId');
    } else if (user.role === 'Lecturer') {
      const LecturerProfile = require('../models/LecturerProfile');
      profileData = await LecturerProfile.findOne({ userId: user._id }).populate('departmentId');
    } else if (user.role === 'HOD') {
      const HodProfile = require('../models/HodProfile');
      profileData = await HodProfile.findOne({ userId: user._id }).populate('departmentId');
    }
    
    res.render('profile', {
      title: 'My Profile',
      path: '/profile',
      user: user,
      profile: profileData,
      success: req.query.success === 'true',
      error: req.query.error
    });
  } catch (error) {
    console.error(error);
    res.redirect('/?error=Error+loading+profile');
  }
});

// Just placeholder for password update or profile update
router.post('/update', ensureAuthenticated, async (req, res) => {
  try {
    // Basic implementation for demonstration
    // Password update logic goes here
    res.redirect('/profile?success=true');
  } catch (error) {
    console.error(error);
    res.redirect('/profile?error=true');
  }
});

module.exports = router;
