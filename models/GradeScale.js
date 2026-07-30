const mongoose = require('mongoose');

const gradeScaleSchema = new mongoose.Schema({
  minimumScore: {
    type: Number,
    required: true
  },
  maximumScore: {
    type: Number,
    required: true
  },
  letterGrade: {
    type: String,
    required: true
  },
  gradePoint: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GradeScale', gradeScaleSchema);
