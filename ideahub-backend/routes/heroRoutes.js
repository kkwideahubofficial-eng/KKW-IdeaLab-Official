import express from 'express';
import { uploadHeroImage, getHeroImages, updateHeroStatus, reorderHeroImages, deleteHeroImage } from '../controllers/heroController.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Multer config for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'idea-hub-hero',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }], // Optional resize on upload as safeguard
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Public Routes
router.get('/', getHeroImages); // Get active images (default) or all (activeOnly=false for debug if needed, but intended public is active only)

// Protected Routes (Coordinator & Admin)
router.use(protect);
router.use(authorize('coordinator', 'admin'));

router.get('/all', getHeroImages); // Explicit route to get all including inactive (though Query param works on base too, this is clearer)
router.post('/upload', upload.single('image'), uploadHeroImage);
router.put('/reorder', reorderHeroImages);
router.patch('/:id/status', updateHeroStatus);
router.delete('/:id', deleteHeroImage);

export default router;
