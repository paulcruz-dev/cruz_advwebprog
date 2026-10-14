const express = require('express');

const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const authentication = require('../middleware/authentication');
const {
	registerValidation,
	loginValidation
} = require('../middleware/validationMiddleware');
const {
    loginLimiter,
    registrationLimiter
} = require('../middleware/rateLimiterMiddleware');

router.post('/register', registrationLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.get('/me', authentication, getMe);

module.exports = router;