const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: 'Too many login attempts. Please try again after 15 minutes.'
	}
});

const registrationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: 'Too many registration attempts. Please try again later.'
	}
});

const passwordChangeLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: 'Too many password change attempts. Please try again later.'
	}
});

const userApiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		message: 'Too many user API requests. Please try again later.'
	}
});

module.exports = {
	loginLimiter,
	registrationLimiter,
	passwordChangeLimiter,
	userApiLimiter
};
