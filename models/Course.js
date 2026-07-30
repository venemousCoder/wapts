const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  creditUnits: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  programme: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
