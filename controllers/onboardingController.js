const Department = require('../models/Department');
const SystemSetting = require('../models/SystemSetting');
const LecturerRequest = require('../models/LecturerRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const HodProfile = require('../models/HodProfile');

exports.getLecturerRegistration = async (req, res, next) => {
  try {
    const departments = await Department.find({ isDeleted: false }).lean();
    res.render('public/lecturer-registration', { layout: false, departments, error: req.query.error, success: req.query.success });
  } catch (err) {
    next(err);
  }
};

exports.postLecturerRegistration = async (req, res, next) => {
  try {
    const { firstName, lastName, email, staffNumber, departmentId, phone, academicRank, officeLocation } = req.body;

    // 1. Validate email domain
    const settings = await SystemSetting.findOne().lean();
    const allowedDomains = settings && settings.allowedEmailDomains ? settings.allowedEmailDomains : ['university.edu.ng'];
    
    const emailDomain = email.split('@')[1];
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return res.redirect(`/onboarding/lecturer?error=${encodeURIComponent('Please use an institution-issued email address (' + allowedDomains.join(', ') + ')')}`);
    }

    // 2. Duplicate detection
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { loginIdentifier: staffNumber }
      ],
      isDeleted: false
    });
    
    if (existingUser) {
      return res.redirect(`/onboarding/lecturer?error=${encodeURIComponent('An active account already exists with this email or staff number.')}`);
    }

    const existingRequest = await LecturerRequest.findOne({
      $or: [
        { email: email },
        { staffNumber: staffNumber }
      ],
      status: 'Pending'
    });

    if (existingRequest) {
      return res.redirect(`/onboarding/lecturer?error=${encodeURIComponent('A pending request already exists for this email or staff number.')}`);
    }

    // 3. Create request
    const request = new LecturerRequest({
      firstName,
      lastName,
      email,
      staffNumber,
      departmentId,
      phone,
      academicRank,
      officeLocation,
      status: 'Pending'
    });

    await request.save();

    // 4. Notify HOD
    const hodProfile = await HodProfile.findOne({ departmentId, isDeleted: false });
    if (hodProfile) {
      const hodUser = await User.findById(hodProfile.userId);
      if (hodUser) {
        await Notification.create({
          recipientId: hodUser._id,
          title: 'New Lecturer Request',
          message: `${firstName} ${lastName} has submitted an onboarding request for your department.`,
          type: 'LecturerRequest',
          priority: 'Normal'
        });
      }
    }

    res.redirect('/onboarding/lecturer?success=' + encodeURIComponent('Your account request has been successfully submitted to the Head of Department. You will receive an email once it is approved.'));
  } catch (err) {
    console.error(err);
    res.redirect(`/onboarding/lecturer?error=${encodeURIComponent('An error occurred while processing your request.')}`);
  }
};
