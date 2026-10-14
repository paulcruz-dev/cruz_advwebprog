const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
    const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);

    if (cloudinaryUrl.protocol !== 'cloudinary:' || !cloudinaryUrl.hostname) {
        throw new Error('CLOUDINARY_URL must be a valid Cloudinary URL.');
    }

    cloudinary.config({
        cloud_name: cloudinaryUrl.hostname,
        api_key: decodeURIComponent(cloudinaryUrl.username),
        api_secret: decodeURIComponent(cloudinaryUrl.password)
    });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

module.exports = cloudinary;