const express = require('express');

const router = express.Router();

const {
    getReviews,
    getReviewById,
    getReviewsByProduct,
    createReview,
    updateReview
} = require('../controllers/reviewController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

router.get('/', getReviews);
router.get('/product/:productId', getReviewsByProduct);
router.get('/:id', getReviewById);
router.post('/', authentication, createReview);
router.put('/:id', authentication, authorization('admin'), updateReview);

module.exports = router;