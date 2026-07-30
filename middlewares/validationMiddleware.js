const { validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  // If this is an API request (expects JSON)
  if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/auth/login')) {
    return ResponseHandler.error(res, 'Validation failed', 422, extractedErrors);
  }

  // If this is a standard web request
  req.session.errors = extractedErrors;
  const backURL = req.header('Referer') || req.baseUrl || '/';
  
  // Attach errors to session and redirect
  // Note: For simple setups, passing as query param can also work if sessions aren't consumed in view
  return res.redirect(`${backURL}?error=${encodeURIComponent('Validation failed: ' + JSON.stringify(extractedErrors))}`);
};

module.exports = {
  validate
};
