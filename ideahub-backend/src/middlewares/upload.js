import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ideahub',
    resource_type: 'auto',
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto', width: 1920, height: 1080, crop: 'limit' }
    ],
  },
});

export const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } }); // 3MB limit

const idProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ideahub_id_proofs',
    resource_type: 'auto',
  },
});

export const uploadIdProof = multer({
  storage: idProofStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file format. Only PDF, JPG, JPEG, and PNG are allowed.'));
    }
    cb(null, true);
  }
});

export default upload;


