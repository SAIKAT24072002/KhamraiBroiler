const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  details: {
    type: String,
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  targetModel: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
