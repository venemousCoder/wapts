const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  attendanceSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true
  },
  isPresent: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

// Compound index to ensure one record per student per session
attendanceRecordSchema.index({ attendanceSessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
