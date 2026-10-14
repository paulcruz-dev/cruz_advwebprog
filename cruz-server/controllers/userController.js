const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { HttpStatus } = require('../config/constants');

const getLockoutMinutes = (failedAttempts) => {
    if (failedAttempts >= 10) return 30;
    if (failedAttempts >= 8) return 5;
    if (failedAttempts >= 5) return 3;
    return 0;
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Name, email, and password are required'
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'An account with this email already exists'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'customer'
        });

        const token = generateToken(user._id, user.role);

        res.status(HttpStatus.CREATED).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.status(HttpStatus.FORBIDDEN).json({
                message: 'Your account has been deactivated'
            });
        }

        if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
            const retryAfterMinutes = Math.ceil(
                (user.loginLockedUntil.getTime() - Date.now()) / 60000
            );

            return res.status(429).json({
                message: `Too many failed login attempts. Try again in ${retryAfterMinutes} minute(s).`,
                retryAfterMinutes
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            user.failedLoginAttempts += 1;

            const lockoutMinutes = getLockoutMinutes(user.failedLoginAttempts);
            if (lockoutMinutes > 0) {
                user.loginLockedUntil = new Date(Date.now() + lockoutMinutes * 60000);
            }

            await user.save();

            if (lockoutMinutes > 0) {
                return res.status(429).json({
                    message: `Too many failed login attempts. Try again in ${lockoutMinutes} minute(s).`,
                    failedLoginAttempts: user.failedLoginAttempts,
                    retryAfterMinutes: lockoutMinutes
                });
            }

            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid email or password'
            });
        }

        user.failedLoginAttempts = 0;
        user.loginLockedUntil = null;
        await user.save();

        const token = generateToken(user._id, user.role);

        res.status(HttpStatus.OK).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};


// Admin: view all users
const getUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.status(HttpStatus.OK).json(users);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
        }

        res.status(HttpStatus.OK).json(user);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);

        const safeUser = await User.findById(user._id);

        res.status(HttpStatus.CREATED).json(safeUser);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

// Admin: edit a user's info (name, email, role)
const updateUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;

        await user.save();

        res.status(HttpStatus.OK).json(user);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

// Admin: set a user's account active/inactive
const setUserActiveStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'isActive must be true or false'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
        }

        user.isActive = isActive;

        await user.save();

        res.status(HttpStatus.OK).json(user);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

// Admin: permanently delete a user account
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
        }

        res.status(HttpStatus.OK).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

// User: change own password (requires current password)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Current password and new password are required'
            });
        }

        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;

        await user.save();

        res.status(HttpStatus.OK).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

// User: edit own profile (name, email)
const updateMyProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = await User.findById(req.user._id);

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;

        await user.save();

        res.status(HttpStatus.OK).json(user);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
};

module.exports = {
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
};