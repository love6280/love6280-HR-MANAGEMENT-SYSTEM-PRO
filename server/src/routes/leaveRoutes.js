import express from 'express';
import {
  getLeaveBalance,
  applyLeave,
  getLeaveApplications,
  approveRejectLeave,
  getTeamOnLeaveToday,
  getTeamCalendar,
} from '../controllers/leaveController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/balance/:employeeId', protect, getLeaveBalance);
router.post('/apply', protect, checkPermission('leaves', 'apply'), applyLeave);
router.get('/applications', protect, getLeaveApplications);
router.put('/approve/:id', protect, checkPermission('leaves', 'approve'), approveRejectLeave);
router.get('/today', protect, checkPermission('leaves', 'view_all'), getTeamOnLeaveToday);
router.get('/calendar/:month/:year', protect, checkPermission('leaves', 'view_all'), getTeamCalendar);

export default router;
