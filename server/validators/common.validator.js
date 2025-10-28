const Joi = require('joi');

/**
 * Common validation schemas for IDs and query parameters
 */

// ID validation schemas
const idSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be positive',
    'any.required': 'ID is required',
  }),
});

const groupIdSchema = Joi.object({
  groupId: Joi.number().integer().positive().required().messages({
    'number.base': 'Group ID must be a number',
    'number.integer': 'Group ID must be an integer',
    'number.positive': 'Group ID must be positive',
    'any.required': 'Group ID is required',
  }),
});

const supplicationIdSchema = Joi.object({
  supplicationId: Joi.number().integer().positive().required().messages({
    'number.base': 'Supplication ID must be a number',
    'number.integer': 'Supplication ID must be an integer',
    'number.positive': 'Supplication ID must be positive',
    'any.required': 'Supplication ID is required',
  }),
});

// Query parameter validation schemas
const daysQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).optional().default(30).messages({
    'number.base': 'Days must be a number',
    'number.integer': 'Days must be an integer',
    'number.min': 'Days must be at least 1',
    'number.max': 'Days cannot exceed 365',
  }),
});

const limitQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional().default(5).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
});

module.exports = {
  idSchema,
  groupIdSchema,
  supplicationIdSchema,
  daysQuerySchema,
  limitQuerySchema,
};
