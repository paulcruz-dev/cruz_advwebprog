const multer = require('multer');
const sharp = require('sharp');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const hasValidImageSignature = (file) => {
    const { buffer, mimetype } = file;

    if (mimetype === 'image/jpeg') {
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (mimetype === 'image/png') {
        return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    if (mimetype === 'image/webp') {
        return buffer.length >= 12
            && buffer.toString('ascii', 0, 4) === 'RIFF'
            && buffer.toString('ascii', 8, 12) === 'WEBP';
    }

    return false;
};

const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (request, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            return callback(new Error('Only JPEG, PNG, or WebP images are allowed.'));
        }

        callback(null, true);
    }
}).single('image');

const uploadImageMiddleware = (request, response, next) => {
    parser(request, response, async (error) => {
        if (error) {
            const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Image must be 5 MB or smaller.'
                : error.message;
            return response.status(status).json({ message });
        }

        if (request.file && !hasValidImageSignature(request.file)) {
            return response.status(400).json({
                message: 'The uploaded file is not a valid JPEG, PNG, or WebP image.'
            });
        }

        if (request.file) {
            try {
                const sharpOptions = { limitInputPixels: 40_000_000, failOn: 'error' };
                const metadata = await sharp(request.file.buffer, sharpOptions).metadata();
                await sharp(request.file.buffer, sharpOptions).stats();
                const formatsByMimeType = {
                    'image/jpeg': 'jpeg',
                    'image/png': 'png',
                    'image/webp': 'webp'
                };

                if (metadata.format !== formatsByMimeType[request.file.mimetype]) {
                    return response.status(400).json({
                        message: 'The image content does not match its file type.'
                    });
                }
            } catch {
                return response.status(400).json({
                    message: 'The uploaded file is not a valid or supported image.'
                });
            }
        }

        next();
    });
};

module.exports = uploadImageMiddleware;