const express = require('express');

const router = express.Router();

const {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus
} = require('../controllers/orderController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

// Any logged-in user can place/view orders; controller-level filtering
// (own orders vs all orders) will be tightened when the Order pages are built
router.get('/', authentication, getOrders);
router.get('/:id', authentication, getOrderById);
router.post('/', authentication, createOrder);
router.patch('/:id/status', authentication, authorization('admin'), updateOrderStatus);

module.exports = router;