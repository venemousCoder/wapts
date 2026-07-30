const ImportService = require('../services/ImportService');
const ResponseHandler = require('../utils/responseHandler');

exports.importScores = async (req, res, next) => {
  try {
    const { assessmentId } = req.body;
    if (!req.file) {
      return ResponseHandler.error(res, 'No CSV file uploaded', 400);
    }
    
    const csvData = await ImportService.parseCSV(req.file.path);
    const { errors, validData } = await ImportService.validateAssessmentScores(csvData, assessmentId);
    
    if (errors.length > 0) {
      return ResponseHandler.error(res, 'CSV Validation failed', 422, errors);
    }
    
    const result = await ImportService.importAssessmentScores(validData, assessmentId);
    
    return ResponseHandler.success(res, result, 'Scores imported successfully');
  } catch (err) {
    next(err);
  }
};
