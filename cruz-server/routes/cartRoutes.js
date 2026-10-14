const express = require('express');

const router = express.Router();

const {
    getCarts,
    getCartById,
    getMyCart,
    createCart,
    addCartItem
} = require('../controllers/cartController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

// Carts belong to a logged-in customer
router.get('/', authentication, authorization('admin'), getCarts);
router.get('/me', authentication, getMyCart);
router.get('/:id', authentication, getCartById);
router.post('/', authentication, createCart);
router.post('/items', authentication, addCartItem);

module.exports = router;