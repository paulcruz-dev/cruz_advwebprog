const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Supplier = require('../models/supplierModel');
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

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// GET /api/v1/products
const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            supplier,
            search,
            sort
        } = req.query;

        const currentPage = Math.max(parseInt(page) || 1, 1);
        const itemsPerPage = Math.max(parseInt(limit) || 10, 1);

        const skip = (currentPage - 1) * itemsPerPage;

        // Build filter
        const filter = {};

        // Category filtering
        if (category) {
            const categoryDoc = await Category.findOne({
                name: {
                    $regex: `^${escapeRegex(category)}$`,
                    $options: 'i'
                }
            });

            if (!categoryDoc) {
                return res.status(HttpStatus.OK).json({
                    success: true,
                    message: 'Products retrieved successfully.',
                    count: 0,
                    data: []
                });
            }

            filter.category = categoryDoc._id;
        }

        // Supplier filtering
        if (supplier) {
            const supplierDoc = await Supplier.findOne({
                name: {
                    $regex: `^${escapeRegex(supplier)}$`,
                    $options: 'i'
                }
            });

            if (!supplierDoc) {
                return res.status(HttpStatus.OK).json({
                    success: true,
                    message: 'Products retrieved successfully.',
                    count: 0,
                    data: []
                });
            }

            filter.supplier = supplierDoc._id;
        }

        // Keyword search
        if (search) {
            const searchRegex = {
                $regex: search,
                $options: 'i'
            };

            filter.$or = [
                { name: searchRegex },
                { title: searchRegex },
                { content: searchRegex }
            ];
        }

        // Sorting
        let sortOption = {};

        if (sort) {
            const sortFields = ['name', 'title', 'price', 'stock'];

            let sortField = sort;
            let sortOrder = 1;

            if (sort.startsWith('-')) {
                sortField = sort.substring(1);
                sortOrder = -1;
            }

            if (sortFields.includes(sortField)) {
                sortOption[sortField] = sortOrder;
            }
        }

        const totalProducts = await Product.countDocuments(filter);

        const products = await Product.find(filter)
            .populate('category')
            .populate('supplier')
            .sort(sortOption)
            .skip(skip)
            .limit(itemsPerPage);

        res.status(HttpStatus.OK).json({
            success: true,
            message: 'Products retrieved successfully.',
            count: totalProducts,
            data: products
        });

    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            count: 0,
            data: []
        });
    }
};


// GET /api/v1/products/:id
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('supplier');

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: 'Product not found.',
                count: 0,
                data: null
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: 'Product retrieved successfully.',
            count: 1,
            data: product
        });

    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            count: 0,
            data: null
        });
    }
};


// POST /api/v1/products
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

        const populatedProduct = await Product.findById(product._id)
            .populate('category')
            .populate('supplier');

        res.status(HttpStatus.CREATED).json({
            success: true,
            message: 'Product created successfully.',
            count: 1,
            data: populatedProduct
        });

    } catch (error) {
        if (uploadedImage) await cleanupProductImage(uploadedImage.public_id);
        res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: error.message,
            count: 0,
            data: null
        });
    }
};


// PUT /api/v1/products/:id
const updateProduct = async (req, res) => {
    let uploadedImage;
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: 'Product not found.',
                count: 0,
                data: null
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
        if (uploadedImage && previousImagePublicId) await cleanupProductImage(previousImagePublicId);
        await product.populate('category');
        await product.populate('supplier');

        res.status(HttpStatus.OK).json({
            success: true,
            message: 'Product updated successfully.',
            count: 1,
            data: product
        });

    } catch (error) {
        if (uploadedImage) await cleanupProductImage(uploadedImage.public_id);
        res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: error.message,
            count: 0,
            data: null
        });
    }
};


// DELETE /api/v1/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: 'Product not found.',
                count: 0,
                data: null
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: 'Product deleted successfully.',
            count: 1,
            data: product
        });

    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            count: 0,
            data: null
        });
    }
};


module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};