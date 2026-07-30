const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    default: 'Upcoming',
    enum: ['Upcoming', 'Active', 'Closed', 'Archived']
  }
}, { timestamps: true });

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
