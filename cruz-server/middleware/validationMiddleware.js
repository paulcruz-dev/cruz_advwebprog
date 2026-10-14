const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (request, response, next) => {
	const errors = validationResult(request);

	if (!errors.isEmpty()) {
		return response.status(400).json({
			message: 'Validation failed',
			errors: errors.array()
		});
	}

	next();
};

const registerValidation = [
	body('name')
		.trim()
		.notEmpty().withMessage('Name is required')
		.isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
	body('email')
		.trim()
		.isEmail().withMessage('Invalid email address')
		.normalizeEmail(),
	body('password')
		.isString().withMessage('Password must be a string')
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
	handleValidationErrors
];

const loginValidation = [
	body('email')
		.trim()
		.isEmail().withMessage('Invalid email address')
		.normalizeEmail(),
	body('password')
		.isString().withMessage('Password must be a string')
		.notEmpty().withMessage('Password is required'),
	handleValidationErrors
];

const userIdValidation = [
	param('id')
		.isMongoId().withMessage('User ID must be a valid MongoDB ID'),
	handleValidationErrors
];

const userCreateValidation = [
	body('name')
		.trim()
		.notEmpty().withMessage('Name is required')
		.isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
	body('email')
		.trim()
		.isEmail().withMessage('Invalid email address')
		.normalizeEmail(),
	body('password')
		.isString().withMessage('Password must be a string')
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
	body('role')
		.optional()
		.isIn(['customer', 'admin']).withMessage('Role must be customer or admin'),
	handleValidationErrors
];

const userUpdateValidation = [
	body('name')
		.optional()
		.trim()
		.notEmpty().withMessage('Name cannot be empty')
		.isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
	body('email')
		.optional()
		.trim()
		.isEmail().withMessage('Invalid email address')
		.normalizeEmail(),
	body('role')
		.optional()
		.isIn(['customer', 'admin']).withMessage('Role must be customer or admin'),
	handleValidationErrors
];

const profileUpdateValidation = [
	body('name')
		.optional()
		.trim()
		.notEmpty().withMessage('Name cannot be empty')
		.isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
	body('email')
		.optional()
		.trim()
		.isEmail().withMessage('Invalid email address')
		.normalizeEmail(),
	handleValidationErrors
];

const passwordChangeValidation = [
	body('currentPassword')
		.isString().withMessage('Current password must be a string')
		.notEmpty().withMessage('Current password is required'),
	body('newPassword')
		.isString().withMessage('New password must be a string')
		.isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
	handleValidationErrors
];

const activeStatusValidation = [
	body('isActive')
		.isBoolean().withMessage('isActive must be true or false')
		.toBoolean(),
	handleValidationErrors
];

module.exports = {
	registerValidation,
	loginValidation,
	userIdValidation,
	userCreateValidation,
	userUpdateValidation,
	profileUpdateValidation,
	passwordChangeValidation,
	activeStatusValidation
};
