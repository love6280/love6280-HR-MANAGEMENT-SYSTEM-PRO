import express from 'express';
import {
  getGoals,
  createGoal,
  updateGoalProgress,
  getReviews,
  createReviewCycle,
  submitPerformanceReview,
  acknowledgeReview,
} from '../controllers/performanceController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/goals', protect, getGoals);
router.post('/goals', protect, checkPermission('performance', 'goals'), createGoal);
router.put('/goals/:id', protect, checkPermission('performance', 'goals'), updateGoalProgress);

router.get('/reviews', protect, getReviews);
router.post('/reviews/cycle', protect, checkPermission('performance', 'manage_cycle'), createReviewCycle);
router.put('/reviews/:id', protect, submitPerformanceReview);
router.put('/reviews/:id/acknowledge', protect, acknowledgeReview);

export default router;
