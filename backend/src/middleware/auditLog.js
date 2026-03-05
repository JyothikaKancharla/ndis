const AuditLog = require('../models/AuditLog');

/**
 * Audit logging middleware
 * Logs all changes to notes, assignments, and trips
 * Includes shift information for NDIS compliance
 */
const auditLog = (options = {}) => {
  return async (req, res, next) => {
    // Store original response.json to intercept responses
    const originalJson = res.json;

    res.json = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
        logAuditEntry(req, res, data, options);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Log an audit entry to database
 */
const logAuditEntry = async (req, res, responseData, options) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return; // Cannot log without user

    const auditLogEntry = new AuditLog({
      action: options.action || getActionFromRequest(req),
      performedBy: userId,
      performedByName: req.user?.name || 'Unknown',
      performedByRole: req.user?.role || 'Unknown',
      resourceType: options.resourceType,
      resourceId: getResourceId(req, responseData),
      staffId: req.user?.role === 'staff' ? userId : req.body?.staffId,
      supervisorId: req.user?.role === 'supervisor' ? userId : null,
      clientId: req.body?.clientId,
      shift: req.validatedShift?.code || req.body?.shift,
      shiftDate: req.validatedShift?.date || req.body?.shiftDate,
      changes: {
        before: options.before,
        after: options.after || responseData.data
      },
      status: 'success',
      details: options.details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });

    await auditLogEntry.save();
  } catch (error) {
    // Log error but don't break the response
    console.error('Audit logging error:', error.message);
  }
};

/**
 * Utility: Get action from request method and path
 */
const getActionFromRequest = (req) => {
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();

  if (path.includes('/notes')) {
    if (method === 'POST') return 'note:created';
    if (method === 'PUT') {
      if (path.includes('/lock')) return 'note:locked';
      return 'note:updated';
    }
    if (path.includes('/verify')) return 'note:verified';
    if (path.includes('/reject')) return 'note:rejected';
    if (path.includes('/unlock')) return 'note:unlocked';
  }

  if (path.includes('/assignments')) {
    if (method === 'POST') return 'assignment:created';
    if (method === 'PUT') return 'assignment:updated';
    if (method === 'DELETE') return 'assignment:deleted';
  }

  if (path.includes('/trips')) {
    if (method === 'POST') return 'trip:created';
    if (path.includes('/verify')) return 'trip:verified';
    if (path.includes('/reject')) return 'trip:rejected';
  }

  return 'system:config';
};

/**
 * Utility: Extract resource ID from response or request
 */
const getResourceId = (req, responseData) => {
  // First check response data
  if (responseData?.data?._id) return responseData.data._id;
  if (responseData?.data?.id) return responseData.data.id;

  // Then check request params
  if (req.params?.id) return req.params.id;

  // Return null if not found
  return null;
};

/**
 * Manual audit log function for complex operations
 */
const logManual = async (options) => {
  try {
    const auditLogEntry = new AuditLog({
      action: options.action,
      performedBy: options.userId,
      performedByName: options.userName,
      performedByRole: options.userRole,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      staffId: options.staffId,
      supervisorId: options.supervisorId,
      clientId: options.clientId,
      shift: options.shift,
      shiftDate: options.shiftDate,
      changes: options.changes,
      status: options.status || 'success',
      details: options.details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      timestamp: new Date()
    });

    return await auditLogEntry.save();
  } catch (error) {
    console.error('Audit logging error:', error.message);
    throw error;
  }
};

/**
 * Get audit logs for a resource
 */
const getAuditLogs = async (resourceType, resourceId, options = {}) => {
  try {
    const query = {
      resourceType,
      resourceId
    };

    if (options.staffId) query.staffId = options.staffId;
    if (options.action) query.action = options.action;
    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    return await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .lean();
  } catch (error) {
    console.error('Error retrieving audit logs:', error.message);
    throw error;
  }
};

/**
 * Get audit logs for a staff member
 */
const getStaffAuditLogs = async (staffId, options = {}) => {
  try {
    const query = { staffId };

    if (options.action) query.action = options.action;
    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }

    return await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .lean();
  } catch (error) {
    console.error('Error retrieving staff audit logs:', error.message);
    throw error;
  }
};

module.exports = {
  auditLog,
  logManual,
  getAuditLogs,
  getStaffAuditLogs,
  logAuditEntry
};
