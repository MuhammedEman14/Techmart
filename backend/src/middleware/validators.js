/**
 * Input Validation Middleware
 * Validates request data using express-validator
 */

const { body, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Validation result checker
 */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new AppError(errorMessages, 400);
  }
  
  next();
};

/**
 * Transaction creation validation rules
 */
const validateTransactionCreation = [
  body('customer_id')
    .notEmpty().withMessage('Customer ID is required')
    .isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
    
  body('product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    
  body('payment_method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'])
    .withMessage('Invalid payment method'),
    
  body('ip_address')
    .optional()
    .isIP().withMessage('Invalid IP address format'),
    
  checkValidation
];

/**
 * Date range validation for analytics
 */
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601().withMessage('Invalid start date format (use ISO 8601)'),
    
  query('end_date')
    .optional()
    .isISO8601().withMessage('Invalid end date format (use ISO 8601)'),
    
  checkValidation
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
  checkValidation
];

/**
 * Alert creation validation
 */
const validateAlertCreation = [
  body('type')
    .notEmpty().withMessage('Alert type is required')
    .isIn(['low_stock', 'fraud', 'high_value', 'system'])
    .withMessage('Invalid alert type'),
    
  body('message')
    .notEmpty().withMessage('Alert message is required')
    .isLength({ min: 10, max: 500 }).withMessage('Message must be between 10 and 500 characters'),
    
  body('severity')
    .notEmpty().withMessage('Severity is required')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
    
  checkValidation
];

/**
 * Low stock threshold validation
 */
const validateLowStockQuery = [
  query('threshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer'),
    
  query('category')
    .optional()
    .isString().withMessage('Category must be a string'),
    
  checkValidation
];

/**
 * Suspicious transactions query validation
 */
const validateSuspiciousQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
    
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    
  query('minRiskScore')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Risk score must be between 0 and 100'),
    
  checkValidation
];

module.exports = {
  validateTransactionCreation,
  validateDateRange,
  validatePagination,
  validateAlertCreation,
  validateLowStockQuery,
  validateSuspiciousQuery,
  checkValidation
};