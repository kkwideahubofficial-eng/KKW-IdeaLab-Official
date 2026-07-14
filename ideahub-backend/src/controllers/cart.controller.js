import Cart from '../models/Cart.js';

// Get current user's cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// Sync/Update cart (Replaces items with client state usually, or simpler: add item)
// For this implementation, we will assume the client sends the FULL cart state to sync
// or we can do granular operations. Let's do granular 'addToCart' for better security 
// but 'sync' is easier for guest->user transition. 
// Let's implement a 'updateCart' that takes the detailed items list.
export const updateCart = async (req, res) => {
  try {
    const { items } = req.body; // Expects array of { productId, quantity, price }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    cart.items = items;
    await cart.save();
    
    // value-add: populate before returning
    await cart.populate('items.productId');

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user._id });
        res.status(200).json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
};
