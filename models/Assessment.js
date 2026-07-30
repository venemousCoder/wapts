const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  assessmentTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssessmentType',
    required: true
  },
  courseOfferingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    required: true,
    index: true
  },
  weight: {
    type: Number,
    required: true
  },
  maximumMarks: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  dueDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
