const AuditLog = require('../models/AuditLog');

/**
 * Returns audit trail. (Admin only)
 * Endpoint: GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, search } = req.query;
    let query = {};

    if (action) {
      query.action = action;
    }

    if (search) {
      query.details = { $regex: search, $options: 'i' };
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name role mobile')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
