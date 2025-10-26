const Joi = require('joi');

/**
 * Validation schema for creating a group
 */
const createGroupSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Group name must not be empty',
      'string.max': 'Group name must not exceed 100 characters',
      'any.required': 'Group name is required'
    })
});

/**
 * Validation schema for creating a supplication
 */
const createSupplicationSchema = Joi.object({
  groupId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Group ID must be a number',
      'number.positive': 'Group ID must be positive',
      'any.required': 'Group ID is required'
    }),
  title: Joi.string()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Title must not exceed 200 characters'
    }),
  text: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Supplication text must not be empty',
      'string.max': 'Supplication text must not exceed 5000 characters',
      'any.required': 'Supplication text is required'
    }),
  target: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .required()
    .messages({
      'number.min': 'Target must be at least 1',
      'number.max': 'Target must not exceed 100000',
      'any.required': 'Target is required'
    })
});

/**
 * Validation schema for updating a supplication
 */
const updateSupplicationSchema = Joi.object({
  title: Joi.string()
    .max(200)
    .allow('')
    .optional(),
  text: Joi.string()
    .min(1)
    .max(5000)
    .optional(),
  target: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .optional()
}).min(1); // At least one field must be present

/**
 * Validation schema for reordering supplications
 */
const reorderSupplicationsSchema = Joi.object({
  supplicationIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one supplication ID is required',
      'any.required': 'Supplication IDs array is required'
    })
});

module.exports = {
  createGroupSchema,
  createSupplicationSchema,
  updateSupplicationSchema,
  reorderSupplicationsSchema
};
