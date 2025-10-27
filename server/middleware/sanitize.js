const xss = require('xss');

/**
 * Recursively sanitize an object's string values to prevent XSS
 * @param {any} obj - Object to sanitize
 * @returns {any} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return xss(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body, params, and query
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

module.exports = sanitizeInput;
