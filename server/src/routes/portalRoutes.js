import express from 'express';
import {
  getDashboardMetrics,
  getAnnouncements,
  createAnnouncement,
  commentAnnouncement,
  reactAnnouncement,
  uploadDocument,
  getDocuments,
  verifyDocument,
  getNotifications,
  markNotificationsRead,
} from '../controllers/portalController.js';
import { protect, checkPermission } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Dashboard
router.get('/dashboard/metrics', protect, getDashboardMetrics);

// Announcements
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, checkPermission('employees', 'create'), createAnnouncement);
router.post('/announcements/:id/comment', protect, commentAnnouncement);
router.post('/announcements/:id/react', protect, reactAnnouncement);

// Documents
router.post('/documents/upload', protect, upload.single('file'), uploadDocument);
router.get('/documents', protect, getDocuments);
router.put('/documents/:id/verify', protect, checkPermission('employees', 'create'), verifyDocument);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

export default router;
