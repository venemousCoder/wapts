const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  courseOfferingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    required: true,
    index: true
  },
  week: {
    type: Number,
    required: true
  },
  lectureDate: {
    type: Date,
    required: true
  },
  topic: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
