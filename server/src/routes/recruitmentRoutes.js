import express from 'express';
import {
  getJobs,
  createJob,
  updateJob,
  getCandidates,
  createCandidate,
  updateCandidateStage,
  addCandidateNote,
  scheduleInterview,
  submitInterviewFeedback,
  getInterviews,
  sendOfferLetter,
} from '../controllers/recruitmentController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/jobs', protect, getJobs);
router.post('/jobs', protect, checkPermission('recruitment', 'post_jobs'), createJob);
router.put('/jobs/:id', protect, checkPermission('recruitment', 'manage'), updateJob);

router.get('/candidates', protect, getCandidates);
router.post('/candidates', protect, createCandidate);
router.put('/candidates/:id/stage', protect, checkPermission('recruitment', 'manage'), updateCandidateStage);
router.post('/candidates/:id/note', protect, addCandidateNote);

router.get('/interviews', protect, getInterviews);
router.post('/interviews', protect, checkPermission('recruitment', 'manage'), scheduleInterview);
router.put('/interviews/:id/feedback', protect, submitInterviewFeedback);

router.post('/candidates/:id/offer', protect, checkPermission('recruitment', 'manage'), sendOfferLetter);

export default router;
