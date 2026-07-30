const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
    unique: true // One result per enrollment
  },
  finalScore: {
    type: Number
  },
  letterGrade: {
    type: String
  },
  gradePoint: {
    type: Number
  },
  isPass: {
    type: Boolean
  },
  status: {
    type: String,
    default: 'Draft',
    enum: ['Draft', 'Submitted', 'Approved', 'Published', 'Archived']
  }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
