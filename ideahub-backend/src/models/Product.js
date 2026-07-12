import mongoose from 'mongoose';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    category: { type: String, default: '' },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;


