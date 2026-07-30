const mongoose = require('mongoose');

const lecturerProfileSchema = new mongoose.Schema({
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
  designation: {
    type: String
  },
  specialization: {
    type: String
  },
  approvalStatus: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Approved', 'Active', 'Suspended', 'Archived']
  },
  responsibilities: {
    type: [String],
    default: ['LECTURER']
  },
  assignedLevels: {
    type: [Number],
    default: []
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('LecturerProfile', lecturerProfileSchema);
