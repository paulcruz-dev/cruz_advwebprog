const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    }
});

supplierSchema.index({ name: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;