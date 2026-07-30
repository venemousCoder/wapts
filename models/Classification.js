const mongoose = require('mongoose');

const classificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  minimumCGPA: {
    type: Number,
    required: true
  },
  maximumCGPA: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Classification', classificationSchema);
