const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { HttpStatus } = require('../config/constants');

module.exports = async (request, response, next) => {
    try {
        // get the token from the authorization header
        const authHeader = request.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
                error: 'Invalid Request!'
            });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.id);

        if (!user) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
                error: 'Invalid Request!'
            });
        }

        if (!user.isActive) {
            return response.status(HttpStatus.FORBIDDEN).json({
                error: 'Your account has been deactivated'
            });
        }

        request.user = user;

        next();
    } catch (error) {
        response.status(HttpStatus.UNAUTHORIZED).json({
            error: 'Invalid request!'
        });
    }
};