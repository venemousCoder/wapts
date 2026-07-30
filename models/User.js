const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  loginIdentifier: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  loginType: {
    type: String,
    required: true,
    enum: ['ADMIN_USERNAME', 'INSTITUTIONAL_EMAIL', 'REG_NUMBER']
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'HOD', 'Lecturer', 'Student']
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  middleName: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  avatar: {
    type: String
  },
  email: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String
  },
  accountStatus: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Suspended', 'Archived']
  },
  lastLogin: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  requiresPasswordChange: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
