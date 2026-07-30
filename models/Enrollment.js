const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true
  },
  courseOfferingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'Enrolled',
    enum: ['Enrolled', 'Dropped', 'Withdrawn', 'Deferred', 'Completed']
  }
}, { timestamps: true });

// Compound index to ensure a student can't enroll in the same offering twice
enrollmentSchema.index({ studentId: 1, courseOfferingId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
