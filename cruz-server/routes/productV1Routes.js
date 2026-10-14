const express = require('express');
const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

const router = express.Router();
const uploadImageMiddleware = require('../middleware/uploadImageMiddleware');

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productV1Controller');

router.get('/', getProducts);

router.get('/:id', getProductById);

router.post('/', authentication, authorization('admin'), uploadImageMiddleware, createProduct);

router.put('/:id', authentication, authorization('admin'), uploadImageMiddleware, updateProduct);

router.delete('/:id', authentication, authorization('admin'), deleteProduct);

module.exports = router;