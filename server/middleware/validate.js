const AppError = require('../utils/AppError');

/**
 * Middleware factory to validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Report all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return next(new AppError(errorMessage, 400));
    }

    // Replace request body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Middleware factory to validate request params against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return next(new AppError(errorMessage, 400));
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware factory to validate request query against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return next(new AppError(errorMessage, 400));
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateParams,
  validateQuery
};
