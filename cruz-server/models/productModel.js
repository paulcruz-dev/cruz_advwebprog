const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },

    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    availability: {
        type: String,
        enum: ['In stock', 'Low stock', 'Preorder', 'Out of stock'],
        default: 'In stock'
    },

    image: {
        type: String,
        default: ''
    },

    imagePublicId: {
        type: String,
        default: ''
    },

    content: {
        type: [String],
        required: true
    }
});

productSchema.index({ name: 1 });
productSchema.index({ title: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;