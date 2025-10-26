const Joi = require('joi');

/**
 * Validation schema for updating user settings
 */
const updateSettingsSchema = Joi.object({
  notificationsEnabled: Joi.boolean().optional(),
  theme: Joi.string()
    .valid('light', 'dark', 'auto')
    .optional()
    .messages({
      'any.only': 'Theme must be one of: light, dark, auto'
    }),
  defaultFontSize: Joi.string()
    .valid('3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl')
    .optional()
    .messages({
      'any.only': 'Invalid font size'
    }),
  defaultFontWeight: Joi.string()
    .valid('normal', 'medium', 'semibold', 'bold')
    .optional()
    .messages({
      'any.only': 'Font weight must be one of: normal, medium, semibold, bold'
    })
}).min(1); // At least one field must be present

/**
 * Validation schema for creating a reminder
 */
const createReminderSchema = Joi.object({
  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (e.g., 09:30)',
      'any.required': 'Time is required'
    }),
  message: Joi.string()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Message must not exceed 200 characters'
    }),
  enabled: Joi.boolean()
    .optional()
    .default(true)
});

/**
 * Validation schema for updating a reminder
 */
const updateReminderSchema = Joi.object({
  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (e.g., 09:30)'
    }),
  message: Joi.string()
    .max(200)
    .allow('')
    .allow(null)
    .optional(),
  enabled: Joi.boolean()
    .optional()
}).min(1); // At least one field must be present

module.exports = {
  updateSettingsSchema,
  createReminderSchema,
  updateReminderSchema
};
