const express = require('express');

const router = express.Router();

const {
    getProducts,
    getProductById,
    getProductByName,
    createProduct,
    updateProduct,
    uploadProductImage
} = require('../controllers/productController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');
const uploadImageMiddleware = require('../middleware/uploadImageMiddleware');

router.get('/', getProducts);
router.get('/slug/:name', getProductByName);
router.get('/:id', getProductById);
router.post('/:id/upload-image', authentication, authorization('admin'), uploadImageMiddleware, uploadProductImage);
router.post('/', authentication, authorization('admin'), uploadImageMiddleware, createProduct);
router.put('/:id', authentication, authorization('admin'), uploadImageMiddleware, updateProduct);

module.exports = router;