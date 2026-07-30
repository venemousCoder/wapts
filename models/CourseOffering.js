const mongoose = require('mongoose');

const courseOfferingSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LecturerProfile'
  },
  capacity: {
    type: Number,
    required: true,
    default: 50
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'Draft',
    enum: ['Draft', 'Published', 'Closed']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('CourseOffering', courseOfferingSchema);
