const Log = require('../models/logModel');

const logger = {
	info: async (message, metadata = {}) => {
		try {
			await Log.create({ level: 'info', message, metadata });
		} catch (error) {
			console.error('Failed to write info audit log:', error.message);
		}
	},

	warn: async (message, metadata = {}) => {
		try {
			await Log.create({ level: 'warn', message, metadata });
		} catch (error) {
			console.error('Failed to write warn audit log:', error.message);
		}
	},

	error: async (message, metadata = {}) => {
		try {
			await Log.create({ level: 'error', message, metadata });
		} catch (error) {
			console.error('Failed to write error audit log:', error.message);
		}
	}
};

const auditLoggerMiddleware = (request, response, next) => {
	const startTime = Date.now();

	response.on('finish', () => {
		const logData = {
			method: request.method,
			path: request.originalUrl,
			ip: request.ip || request.socket.remoteAddress || null,
			userId: request.user?._id?.toString() || null,
			username: request.user?.username || null,
			statusCode: response.statusCode,
			userAgent: request.get('user-agent') || null,
			durationMs: Date.now() - startTime
		};

		const message = `${logData.method} ${logData.path} - ${logData.statusCode}`;
		if (response.statusCode >= 500) {
			logger.error(message, logData);
		} else if (response.statusCode >= 400) {
			logger.warn(message, logData);
		} else {
			logger.info(message, logData);
		}
	});

	next();
};

module.exports = { logger, auditLoggerMiddleware };
