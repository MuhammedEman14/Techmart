/**
 * Alert Controller
 * Handles custom business alerts
 */

const { asyncHandler } = require('../middleware/errorHandler');

// In-memory storage for alerts (in production, use a database)
let alerts = [];
let alertIdCounter = 1;

/**
 * POST /api/alerts
 * Create a new custom alert
 */
const createAlert = asyncHandler(async (req, res) => {
  const { type, message, severity, metadata } = req.body;
  
  const alert = {
    id: alertIdCounter++,
    type,
    message,
    severity,
    metadata: metadata || {},
    status: 'active',
    created_at: new Date(),
    acknowledged: false
  };
  
  alerts.push(alert);
  
  res.status(201).json({
    success: true,
    message: 'Alert created successfully',
    data: alert
  });
});

/**
 * GET /api/alerts
 * Get all alerts
 */
const getAlerts = asyncHandler(async (req, res) => {
  const { status, severity, type, limit = 50 } = req.query;
  
  let filteredAlerts = [...alerts];
  
  // Apply filters
  if (status) {
    filteredAlerts = filteredAlerts.filter(a => a.status === status);
  }
  
  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  }
  
  if (type) {
    filteredAlerts = filteredAlerts.filter(a => a.type === type);
  }
  
  // Sort by creation date (newest first)
  filteredAlerts.sort((a, b) => b.created_at - a.created_at);
  
  // Apply limit
  const limitedAlerts = filteredAlerts.slice(0, parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      alerts: limitedAlerts,
      total: filteredAlerts.length,
      summary: {
        active: alerts.filter(a => a.status === 'active').length,
        acknowledged: alerts.filter(a => a.acknowledged).length,
        by_severity: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      }
    }
  });
});

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
const getAlertById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const alert = alerts.find(a => a.id === parseInt(id));
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Alert not found'
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: alert
  });
});

/**
 * PATCH /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const alert = alerts.find(a => a.id === parseInt(id));
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Alert not found'
      }
    });
  }
  
  alert.acknowledged = true;
  alert.acknowledged_at = new Date();
  
  res.status(200).json({
    success: true,
    message: 'Alert acknowledged',
    data: alert
  });
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
const deleteAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const index = alerts.findIndex(a => a.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Alert not found'
      }
    });
  }
  
  alerts.splice(index, 1);
  
  res.status(200).json({
    success: true,
    message: 'Alert deleted successfully'
  });
});

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  deleteAlert
};