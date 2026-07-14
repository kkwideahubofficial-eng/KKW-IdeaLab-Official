import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.js';
import { validationResult } from 'express-validator';
import { upload, uploadIdProof } from '../middlewares/upload.js';

const router = Router();

// Validation chains
const validateSignup = [
  body('name').isString().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min length 6'),
  body('role').optional().isIn(['team', 'coordinator', 'head', 'delivery_boy', 'admin']).withMessage('Invalid role'),
  body('teamName').optional().isString(),
  body('prn').optional().isString(),
  body('division').optional().isString(),
  body('externalMobile').optional().isString(),
  body('externalCollegeOrg').optional().isString(),
  body('externalDept').optional().isString(),
  body('externalCity').optional().isString(),
  body('externalState').optional().isString(),
  body('externalIdentityProof').optional().isString(),
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().withMessage('Password required'),
];

const validateProfileUpdate = [
  body('name').optional().isString().isLength({ min: 2 }),
  body('mobile').optional().isString(),
  body('year').optional().isIn(['FE', 'SE', 'TE', 'BE', '']),
  body('branch').optional().isString(),
  body('prn').optional().isString(),
  body('division').optional().isString(),
  body('externalMobile').optional().isString(),
  body('externalCollegeOrg').optional().isString(),
  body('externalDept').optional().isString(),
  body('externalCity').optional().isString(),
  body('externalState').optional().isString(),
  body('externalIdentityProof').optional().isString(),
];

const validatePasswordChange = [
  body('currentPassword').isString().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password min length 6'),
];

// Simple validation error handler
function handleValidation(req, res, next) {
  const { validationErrors } = req;
  next();
}

// import { validationResult } from 'express-validator'; // Moved to top
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // eslint-disable-next-line no-console
    console.log('Validation Errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}

// import { upload } from '../middlewares/upload.js'; // Moved to top

router.post('/signup', upload.single('image'), validateSignup, validate, signup);
router.post('/login', validateLogin, validate, login);

// Endpoint for uploading external user identity proofs (5MB and PDF/images only)
router.post('/upload-id', optionalAuth, uploadIdProof.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ url: req.file.path });
});

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.get('/me', requireAuth, getProfile); // Alias for session check
router.put('/profile', requireAuth, validateProfileUpdate, validate, updateProfile);
router.post('/change-password', requireAuth, validatePasswordChange, validate, changePassword);

export default router;

