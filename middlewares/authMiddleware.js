const ResponseHandler = require('../utils/responseHandler');

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.originalUrl.startsWith('/api')) {
    return ResponseHandler.error(res, 'Unauthorized', 401);
  }
  
  res.redirect('/auth/login');
};

const ensureRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.originalUrl.startsWith('/api')) {
      return ResponseHandler.error(res, 'Forbidden', 403);
    }
    
    res.status(403).render('error', { message: 'Forbidden' });
  };
};

const ensurePasswordChanged = (req, res, next) => {
  if (req.isAuthenticated() && req.user.requiresPasswordChange) {
    if (req.originalUrl !== '/auth/change-password' && req.originalUrl !== '/auth/logout') {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.originalUrl.startsWith('/api')) {
        return ResponseHandler.error(res, 'Password change required', 403);
      }
      return res.redirect('/auth/change-password');
    }
  }
  next();
};

const ensureResponsibility = (responsibility) => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    
    if (req.user.role !== 'Lecturer') {
      return ResponseHandler.error(res, 'Forbidden', 403);
    }

    try {
      const LecturerProfile = require('../models/LecturerProfile');
      const profile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false });
      
      if (!profile || !profile.responsibilities.includes(responsibility)) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.originalUrl.startsWith('/api')) {
          return ResponseHandler.error(res, 'Forbidden', 403);
        }
        return res.status(403).render('error', { message: 'Forbidden: You lack the required responsibility.' });
      }
      
      req.lecturerProfile = profile; // Attach profile for downstream use
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensurePasswordChanged,
  ensureResponsibility
};
