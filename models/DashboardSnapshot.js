const mongoose = require('mongoose');

const dashboardSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One snapshot per user, gets updated
    index: true
  },
  role: {
    type: String,
    required: true
  },
  currentGPA: { type: Number },
  currentCGPA: { type: Number },
  attendancePercentage: { type: Number },
  creditsEarned: { type: Number },
  creditsRemaining: { type: Number },
  currentClassification: { type: String },
  expectedClassification: { type: String },
  riskLevel: { type: String },
  goalProgress: { type: Number },
  lastUpdated: { type: Date, default: Date.now },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('DashboardSnapshot', dashboardSnapshotSchema);
