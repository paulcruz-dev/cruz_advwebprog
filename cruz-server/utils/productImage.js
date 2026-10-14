const cloudinary = require('../config/cloudinary');

const uploadProductImageToCloudinary = (file) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        { folder: 'bulldogs-exchange/products', resource_type: 'image' },
        (error, result) => {
            if (error) return reject(error);
            resolve(result);
        }
    );

    stream.end(file.buffer);
});

const deleteProductImageFromCloudinary = (publicId) => {
    if (!publicId) return Promise.resolve();
    return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

module.exports = {
    uploadProductImageToCloudinary,
    deleteProductImageFromCloudinary
};