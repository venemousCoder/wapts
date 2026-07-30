const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester', // Assuming Semester collection exists
    required: true
  },
  requiredCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  electiveCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  totalCredits: {
    type: Number,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
