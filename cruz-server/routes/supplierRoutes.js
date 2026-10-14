const express = require('express');

const router = express.Router();

const {
    getSuppliers,
    getSupplierById,
    createSupplier
} = require('../controllers/supplierController');

const authentication = require('../middleware/authentication');
const authorization = require('../middleware/authorization');

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', authentication, authorization('admin'), createSupplier);

module.exports = router;