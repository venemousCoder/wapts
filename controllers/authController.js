const passport = require('passport');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/AuditService');

exports.getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect(`/${req.user.role.toLowerCase()}/dashboard`);
  }
  res.render('auth/login', { layout: false, error: null, success: req.query.success });
};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return ResponseHandler.error(res, info.message, 401);
      }
      return res.render('auth/login', { error: info.message, layout: false });
    }
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      
      await AuditService.log('LOGIN', 'User', user._id, user, null, null, req.ip, req.headers['user-agent']);
      
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return ResponseHandler.success(res, { role: user.role, redirectUrl: `/${user.role.toLowerCase()}/dashboard` }, 'Logged in successfully');
      }
      return res.redirect(`/${user.role.toLowerCase()}/dashboard`);
    });
  })(req, res, next);
};

exports.getChangePassword = (req, res) => {
  res.render('auth/change-password', { layout: false, error: null });
};

exports.postChangePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    req.user.passwordHash = passwordHash;
    req.user.requiresPasswordChange = false;
    await req.user.save();

    res.redirect(`/${req.user.role.toLowerCase()}/dashboard`);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  if (req.user) {
    await AuditService.log('LOGOUT', 'User', req.user._id, req.user, null, null, req.ip, req.headers['user-agent']);
  }
  
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/auth/login');
  });
};

exports.getResetPassword = (req, res) => {
  res.render('auth/reset-password', { layout: false, error: null });
};

exports.postResetPassword = async (req, res, next) => {
  try {
    const { loginIdentifier, currentPassword, newPassword } = req.body;
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ loginIdentifier, isDeleted: false });
    if (!user) {
      return res.render('auth/reset-password', { layout: false, error: 'Invalid identifier or current password.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.render('auth/reset-password', { layout: false, error: 'Invalid identifier or current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    user.passwordHash = passwordHash;
    user.requiresPasswordChange = false;
    await user.save();

    res.redirect('/auth/login?success=Password%20updated%20successfully.%20Please%20login.');
  } catch (err) {
    res.render('auth/reset-password', { layout: false, error: 'An error occurred. Please try again.' });
  }
};
