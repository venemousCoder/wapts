const mongoose = require('mongoose');

const studentAssessmentSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true
  },
  score: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Ensure one score per assessment per student
studentAssessmentSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('StudentAssessment', studentAssessmentSchema);
