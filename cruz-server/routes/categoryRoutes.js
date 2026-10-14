const express = require('express');

const router = express.Router();

const {
    getCategories,
    getCategoryById,
    createCategory
} = require('../controllers/categoryController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authentication, authorization('admin'), createCategory);

module.exports = router;