import express from 'express';
import {
  checkIn,
  checkOut,
  getAttendance,
  regularizeAttendance,
  approveRegularization,
  getTodayPresentEmployees,
  bulkImportAttendance,
  getAttendanceSummary,
} from '../controllers/attendanceController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkin', protect, checkPermission('attendance', 'mark'), checkIn);
router.post('/checkout', protect, checkPermission('attendance', 'mark'), checkOut);
router.get('/', protect, getAttendance);
router.put('/:id/regularize', protect, checkPermission('attendance', 'view_own'), regularizeAttendance);
router.put('/:id/approve-regularization', protect, checkPermission('attendance', 'manage'), approveRegularization);
router.get('/today/present', protect, checkPermission('attendance', 'view_all'), getTodayPresentEmployees);
router.post('/bulk-import', protect, checkPermission('attendance', 'manage'), bulkImportAttendance);
router.get('/summary/:employeeId/:month/:year', protect, getAttendanceSummary);

export default router;
