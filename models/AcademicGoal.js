const mongoose = require('mongoose');

const academicGoalSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
    unique: true
  },
  targetCGPA: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  currentCGPA: {
    type: Number,
    default: 0
  },
  creditsCompleted: {
    type: Number,
    default: 0
  },
  creditsRemaining: {
    type: Number,
    default: 0
  },
  expectedGraduationSession: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AcademicGoal', academicGoalSchema);
