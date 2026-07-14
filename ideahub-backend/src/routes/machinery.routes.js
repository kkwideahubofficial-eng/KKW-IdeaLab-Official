import express from 'express';
import { requireAuth, requireCoordinator, optionalAuth, requireInternalUser } from '../middlewares/auth.js';
import * as machineryController from '../controllers/machineryController.js';
import * as requestController from '../controllers/machineryRequestController.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Upload generic image (Machinery or Request photos)
router.post('/upload', optionalAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const url = req.file.path;
  res.json({ url });
});

// --- Machinery/Material Request Endpoints ---

// Get machine availability/suggestions
router.get('/check/availability', requireAuth, requestController.checkMachineAvailability);

// Public verify route
router.get('/requests/:requestId/verify-public', requestController.verifyPublicRequest);

// Create request (Student or External)
router.post('/requests', optionalAuth, requestController.createRequest);

// Get requests (Head views all, Student views theirs, with filters/search)
router.get('/requests', requireAuth, requestController.getRequests);

// Download machinery/material requests usage report
router.get('/requests/report', requireAuth, requireInternalUser, requireCoordinator, requestController.downloadMachineryUsageReport);

// Get single request details
router.get('/requests/:id', requireAuth, requestController.getRequestById);

// Update request (Student editing drafts/changes requested)
router.put('/requests/:id', requireAuth, requestController.updateRequest);

// Update request status (Head or Coordinator decisions)
router.patch('/requests/:id/status', requireAuth, requireCoordinator, requestController.updateRequestStatus);

// Allocate/Issue materials (Coordinator)
router.post('/requests/:id/issue', requireAuth, requireCoordinator, requestController.issueMaterials);

// Process resource/material returns (Coordinator)
router.post('/requests/:id/return', requireAuth, requireCoordinator, requestController.returnResource);

// Check-in student (Coordinator)
router.post('/requests/:id/checkin', requireAuth, requireCoordinator, requestController.checkInStudent);

// Check-out student (Coordinator)
router.post('/requests/:id/checkout', requireAuth, requireCoordinator, requestController.checkOutStudent);

// Student action: complete work
router.post('/requests/:id/complete-work', requireAuth, requestController.completeWorkRequest);

// Student action: request booking extension
router.post('/requests/:id/request-extension', requireAuth, requestController.requestExtension);

// Coordinator action: Approve/Reject booking extension
router.post('/requests/:id/handle-extension', requireAuth, requireCoordinator, requestController.handleExtension);

// Download machinery/material request PDF
router.get('/requests/:id/pdf', requireAuth, requestController.downloadMachineryPdf);

// --- Machinery Management Endpoints ---

// Get all machinery (Public/Auth)
router.get('/', requireAuth, machineryController.getAllMachinery);

// Create machinery (Head or Coordinator)
router.post('/', requireAuth, requireCoordinator, machineryController.createMachinery);

// Route for getting machinery records (Coordinator, Head, Admin only)
router.get('/records', requireAuth, requireCoordinator, machineryController.getMachineryRecords);

// Get single machinery details
router.get('/:id', requireAuth, machineryController.getMachineryById);

// Update global settings for all machinery (Head or Coordinator)
router.put('/settings/global', requireAuth, requireCoordinator, machineryController.updateGlobalMachinerySettings);

// Update machinery (Head or Coordinator)
router.put('/:id', requireAuth, requireCoordinator, machineryController.updateMachinery);

// Get availability stats (for calendar widget)
router.get('/:id/availability', requireAuth, machineryController.getMachineryAvailability);

// Delete machinery (Head or Coordinator)
router.delete('/:id', requireAuth, requireCoordinator, machineryController.deleteMachinery);

export default router;
