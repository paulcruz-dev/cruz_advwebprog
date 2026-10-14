const express = require('express');

const router = express.Router();

const {
    register,
    login,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    setUserActiveStatus,
    changePassword,
    updateMyProfile
} = require('../controllers/userController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');
const {
    registerValidation,
    loginValidation,
    userIdValidation,
    userCreateValidation,
    userUpdateValidation,
    profileUpdateValidation,
    passwordChangeValidation,
    activeStatusValidation
} = require('../middleware/validationMiddleware');
const {
    loginLimiter,
    registrationLimiter,
    passwordChangeLimiter,
    userApiLimiter
} = require('../middleware/rateLimiterMiddleware');

router.use(userApiLimiter);

// Public: registration and login
router.post('/register', registrationLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);

// Logged-in user managing their own profile
router.put('/me/profile', profileUpdateValidation, authentication, updateMyProfile);
router.put('/me/password', passwordChangeLimiter, passwordChangeValidation, authentication, changePassword);

// Admin-only user management
router.get('/', authentication, authorization('admin'), getUsers);
router.get('/:id', userIdValidation, authentication, authorization('admin'), getUserById);
router.post('/', registrationLimiter, userCreateValidation, authentication, authorization('admin'), createUser);

// Self-or-admin: ownership is checked inside the controller
router.put('/:id', userIdValidation, userUpdateValidation, authentication, updateUser);

router.patch('/:id/active', userIdValidation, activeStatusValidation, authentication, authorization('admin'), setUserActiveStatus);
router.delete('/:id', userIdValidation, authentication, authorization('admin'), deleteUser);

module.exports = router;