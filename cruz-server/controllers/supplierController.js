const Supplier = require('../models/supplierModel');
const { HttpStatus } = require('../config/constants');

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();

        res.status(HttpStatus.OK).json(suppliers);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: 'Supplier not found'
            });
        }

        res.status(HttpStatus.OK).json(supplier);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);

        res.status(HttpStatus.CREATED).json(supplier);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).json({
            message: error.message
        });
    }
};

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier
};