import Product from '../models/Product.js';
import { validationResult } from 'express-validator';

export async function listProducts(_req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
}

export async function createProduct(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, description, price, category, stock } = req.body;
    const imageUrl = req.file ? req.file.path : (req.body.imageUrl || '');
    const product = await Product.create({ title, description, price, category, stock, imageUrl });
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.deleteOne();
    return res.status(200).json({ message: 'Product removed' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
}

export async function updateProduct(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const { title, description, price, category, stock } = req.body;
    
    let product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.category = category || product.category;
    product.stock = stock ? Number(stock) : product.stock;

    if (req.file) {
      product.imageUrl = req.file.path;
    } else if (req.body.imageUrl) {
      product.imageUrl = req.body.imageUrl;
    }

    await product.save();
    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
}

export default { listProducts, createProduct, updateProduct, deleteProduct };


