const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  programme: {
    type: String
  },
  admissionYear: {
    type: String,
    required: true
  },
  admissionType: {
    type: String
  },
  currentCGPA: {
    type: Number,
    default: 0
  },
  totalCreditsEarned: {
    type: Number,
    default: 0
  },
  totalCreditsAttempted: {
    type: Number,
    default: 0
  },
  graduationStatus: {
    type: String,
    default: 'Undergraduate',
    enum: ['Undergraduate', 'Graduated', 'Withdrawn', 'Suspended']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
