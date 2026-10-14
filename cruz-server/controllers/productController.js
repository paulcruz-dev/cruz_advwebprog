const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const { HttpStatus } = require('../config/constants');
const {
    uploadProductImageToCloudinary,
    deleteProductImageFromCloudinary
} = require('../utils/productImage');

const parseProductBody = (body) => {
    const productData = { ...body };

    if (typeof productData.content === 'string') {
        try {
            const parsedContent = JSON.parse(productData.content);
            productData.content = Array.isArray(parsedContent)
                ? parsedContent
                : productData.content.split(/\r?\n/).filter(Boolean);
        } catch {
            productData.content = productData.content.split(/\r?\n/).filter(Boolean);
        }
    }

    return productData;
};

const cleanupProductImage = async (publicId) => {
    if (!publicId) return;
    try {
        await deleteProductImageFromCloudinary(publicId);
    } catch (error) {
        console.error('Could not remove product image from Cloudinary:', error.message);
    }
};

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;

        const filter = {};

        if (req.query.search) {
            const search = req.query.search.trim();
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        // Filtering by category
        if (req.query.category) {
            const category = await Category.findOne({
                name: req.query.category
            });

            if (!category) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    message: 'Category not found'
                });
            }

            filter.category = category._id;
        }

        let sort = {};

        if (req.query.sort === 'price') {
            sort.price = 1;
        } else if (req.query.sort === '-price') {
            sort.price = -1;
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(filter)
            .populate('category')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filter);

        res.status(HttpStatus.OK).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category');

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: 'Product not found'
            });
        }

        res.status(HttpStatus.OK).json(product);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

// Used by the frontend's /products/:name route (a readable slug),
// as opposed to getProductById which looks up by Mongo _id
const getProductByName = async (req, res) => {
    try {
        const product = await Product.findOne({ name: req.params.name })
            .populate('category')
            .populate('supplier');

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: 'Product not found'
            });
        }

        res.status(HttpStatus.OK).json(product);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

const createProduct = async (req, res) => {
    let uploadedImage;
    try {
        const productData = parseProductBody(req.body);
        if (req.file) {
            uploadedImage = await uploadProductImageToCloudinary(req.file);
            productData.image = uploadedImage.secure_url;
            productData.imagePublicId = uploadedImage.public_id;
        }

        const product = await Product.create(productData);

        res.status(HttpStatus.CREATED).json(product);
    } catch (error) {
        if (uploadedImage) await cleanupProductImage(uploadedImage.public_id);
        res.status(HttpStatus.BAD_REQUEST).json({
            message: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    let uploadedImage;
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: 'Product not found'
            });
        }

        const previousImagePublicId = product.imagePublicId;
        Object.assign(product, parseProductBody(req.body));
        if (req.file) {
            uploadedImage = await uploadProductImageToCloudinary(req.file);
            product.image = uploadedImage.secure_url;
            product.imagePublicId = uploadedImage.public_id;
        }

        await product.save();
        if (uploadedImage && previousImagePublicId) {
            await cleanupProductImage(previousImagePublicId);
        }

        await product.populate('category');
        await product.populate('supplier');
        res.status(HttpStatus.OK).json(product);

    } catch (error) {
        if (uploadedImage) await cleanupProductImage(uploadedImage.public_id);
        res.status(HttpStatus.BAD_REQUEST).json({
            message: error.message
        });
    }
};

const uploadProductImage = async (req, res) => {
    let uploadedImage;
    try {
        if (!req.file) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Select an image to upload.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Product not found' });
        }

        const previousImagePublicId = product.imagePublicId;
        uploadedImage = await uploadProductImageToCloudinary(req.file);
        product.image = uploadedImage.secure_url;
        product.imagePublicId = uploadedImage.public_id;
        await product.save();

        if (previousImagePublicId) await cleanupProductImage(previousImagePublicId);

        res.status(HttpStatus.OK).json({
            success: true,
            imageUrl: product.image,
            publicId: product.imagePublicId,
            product
        });
    } catch (error) {
        if (uploadedImage) await cleanupProductImage(uploadedImage.public_id);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getProductByName,
    createProduct,
    updateProduct,
    uploadProductImage
};