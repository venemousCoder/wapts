const AuditLog = require('../models/AuditLog');

class AuditService {
  async log(action, resource, resourceId, user, previousState = null, newState = null, ipAddress = null, userAgent = null) {
    try {
      const logEntry = new AuditLog({
        userId: user ? user._id : null,
        action,
        resource,
        resourceId,
        previousState,
        newState,
        ipAddress,
        userAgent
      });
      await logEntry.save();
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // We generally do not want to fail the main request if logging fails, but it should be alerted
    }
  }

  async getLogs(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName loginIdentifier role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await AuditLog.countDocuments(filter);
    
    return {
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new AuditService();
