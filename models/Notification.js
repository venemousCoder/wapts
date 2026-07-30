const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    default: 'Normal',
    enum: ['Low', 'Normal', 'High', 'Critical']
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
