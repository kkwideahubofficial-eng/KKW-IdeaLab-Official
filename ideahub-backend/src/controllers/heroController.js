import HeroImage from '../models/HeroImage.js';
import cloudinary from '../config/cloudinary.js';

// Upload a new hero image
export const uploadHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get the highest order to append to the end
    const lastImage = await HeroImage.findOne().sort({ order: -1 });
    const nextOrder = lastImage ? lastImage.order + 1 : 0;

    const newHeroImage = new HeroImage({
      secure_url: req.file.path,
      public_id: req.file.filename,
      order: nextOrder,
    });

    await newHeroImage.save();

    res.status(201).json(newHeroImage);
  } catch (error) {
    console.error('Error uploading hero image:', error);
    res.status(500).json({ message: 'Server error uploading image', error: error.message });
  }
};

// Get hero images
// Helper to get active images for public, all for admin
export const getHeroImages = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    let query = {};
    if (activeOnly === 'true') {
      query = { isActive: true };
    }

    const images = await HeroImage.find(query).sort({ order: 1 });
    res.json(images);
  } catch (error) {
    console.error('Error fetching hero images:', error);
    res.status(500).json({ message: 'Server error fetching images', error: error.message });
  }
};

// Update hero image status (Activate/Deactivate)
export const updateHeroStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const image = await HeroImage.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    image.isActive = isActive;
    await image.save();

    res.json(image);
  } catch (error) {
    console.error('Error updating hero image status:', error);
    res.status(500).json({ message: 'Server error updating status', error: error.message });
  }
};

// Reorder hero images
export const reorderHeroImages = async (req, res) => {
  try {
    const { orderedIds } = req.body; // Array of IDs in the new order

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Use bulkWrite for efficient multiple updates
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index },
      },
    }));

    if (bulkOps.length > 0) {
      await HeroImage.bulkWrite(bulkOps);
    }

    res.json({ message: 'Images reordered successfully' });
  } catch (error) {
    console.error('Error reordering hero images:', error);
    res.status(500).json({ message: 'Server error reordering images', error: error.message });
  }
};

// Delete hero image
export const deleteHeroImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await HeroImage.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    if (image.public_id) {
       await cloudinary.uploader.destroy(image.public_id);
    }

    // Delete from DB
    await HeroImage.findByIdAndDelete(id);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero image:', error);
    res.status(500).json({ message: 'Server error deleting image', error: error.message });
  }
};
