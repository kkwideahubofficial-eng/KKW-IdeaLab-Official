import express from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/roomController.js';
import { requireAuth, requireCoordinator } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/upload', requireAuth, requireCoordinator, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ url: req.file.path });
});

router.get('/', requireAuth, getRooms);
router.post('/', requireAuth, requireCoordinator, createRoom);
router.put('/:id', requireAuth, requireCoordinator, updateRoom);
router.delete('/:id', requireAuth, requireCoordinator, deleteRoom);

export default router;
