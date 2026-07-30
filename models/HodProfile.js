const mongoose = require('mongoose');

const hodProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    unique: true // A department usually has only one HOD at a time
  },
  appointmentDate: {
    type: Date,
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

module.exports = mongoose.model('HodProfile', hodProfileSchema);
