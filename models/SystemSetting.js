const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  allowedEmailDomains: {
    type: [String],
    default: ['university.edu.ng']
  },
  attendanceThreshold: {
    type: Number,
    default: 75
  },
  minCreditLoad: {
    type: Number,
    default: 12
  },
  maxCreditLoad: {
    type: Number,
    default: 24
  },
  currentAcademicSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession'
  },
  currentSemester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  activeGradeScale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradeScale'
  },
  activeClassificationScheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classification'
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
