import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import { sendEmail } from '../config/email.js';
import Notification from '../models/Notification.js';

// --- JOB OPENINGS ---

export const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find().populate('department', 'name').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      ...req.body,
      postedBy: req.user._id,
    });
    res.status(201).json({
      status: 'success',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) {
      return next(new AppError('No job found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// --- CANDIDATE PIPELINE ---

export const getCandidates = async (req, res, next) => {
  const { jobId } = req.query;
  const query = jobId ? { job: jobId } : {};

  try {
    const candidates = await Candidate.find(query)
      .populate('job', 'title department')
      .populate('interviews')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};

export const createCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.create(req.body);
    
    // Increment application count on job
    await Job.findByIdAndUpdate(req.body.job, { $inc: { applicationsCount: 1 } });

    res.status(201).json({
      status: 'success',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCandidateStage = async (req, res, next) => {
  const { id } = req.params;
  const { stage } = req.body; // stage: 'Applied'|'Shortlisted'|'Interview'|'Technical'|'HR'|'Offered'|'Joined'|'Rejected'

  try {
    const candidate = await Candidate.findById(id).populate('job');
    if (!candidate) {
      return next(new AppError('Candidate not found', 404));
    }

    candidate.stage = stage;
    await candidate.save();

    res.status(200).json({
      status: 'success',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

export const addCandidateNote = async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return next(new AppError('Candidate not found', 404));
    }

    candidate.notes.push({
      text,
      addedBy: req.user._id,
    });

    await candidate.save();

    res.status(200).json({
      status: 'success',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

// --- INTERVIEW SCHEDULING ---

export const scheduleInterview = async (req, res, next) => {
  const { candidateId, jobId, date, time, type, interviewers, meetingLink } = req.body;

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return next(new AppError('Candidate not found', 404));
    }

    const interview = await Interview.create({
      candidate: candidateId,
      job: jobId,
      date,
      time,
      type,
      interviewers,
      meetingLink,
    });

    // Link interview in Candidate
    candidate.interviews.push(interview._id);
    candidate.stage = 'Interview'; // auto advance stage
    await candidate.save();

    // Notify Interviewers
    const emps = await Employee.find({ _id: { $in: interviewers } });
    for (const emp of emps) {
      await Notification.create({
        employee: emp._id,
        type: 'interview_scheduled',
        message: `You have been scheduled to interview ${candidate.fullName} on ${new Date(date).toLocaleDateString()} at ${time}`,
        link: '/recruitment',
      });

      // Email Interviewer
      await sendEmail({
        to: emp.contactInfo.workEmail,
        subject: `Interview Scheduled: ${candidate.fullName}`,
        text: `Hello ${emp.personalInfo.firstName},\n\nYou are scheduled to conduct an interview with candidate ${candidate.fullName} for job opening.\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${time}\nType: ${type}\nMeeting Link: ${meetingLink || 'N/A'}\n\nPlease join on time.\n\nRegards,\nHR Team`,
      });
    }

    // Email Candidate
    await sendEmail({
      to: candidate.email,
      subject: `Interview Scheduled - HRMS Pro`,
      text: `Dear ${candidate.fullName},\n\nWe are pleased to invite you for an interview regarding your application.\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${time}\nFormat: ${type}\nMeeting Link: ${meetingLink || 'N/A'}\n\nOur team is looking forward to speaking with you.\n\nBest regards,\nRecruitment Team`,
    });

    res.status(201).json({
      status: 'success',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const submitInterviewFeedback = async (req, res, next) => {
  const { id } = req.params; // interview ID
  const { rating, comments, recommendation } = req.body;

  try {
    const interview = await Interview.findById(id);
    if (!interview) {
      return next(new AppError('No interview found', 404));
    }

    interview.feedback = {
      rating,
      comments,
      recommendation,
      submittedBy: req.user.employee?._id,
      submittedAt: new Date(),
    };

    await interview.save();

    res.status(200).json({
      status: 'success',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find()
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title')
      .populate('interviewers', 'personalInfo.firstName personalInfo.lastName')
      .sort({ date: 1 });

    res.status(200).json({
      status: 'success',
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

// --- OFFER LETTER ---

export const sendOfferLetter = async (req, res, next) => {
  const { id } = req.params; // Candidate ID
  const { designation, salary, joiningDate, benefits } = req.body;

  try {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return next(new AppError('Candidate not found', 404));
    }

    candidate.offer = {
      letterUrl: `/offers/offer_EMP_${candidate.firstName}_${Date.now()}.pdf`, // mock PDF url
      status: 'Sent',
      sentAt: new Date(),
      joiningDate,
      salary,
    };

    candidate.stage = 'Offered';
    await candidate.save();

    // Email Offer details
    await sendEmail({
      to: candidate.email,
      subject: `Employment Offer: HRMS Pro`,
      text: `Dear ${candidate.fullName},\n\nWe are excited to offer you the position of ${designation} at our firm.\nJoining Date: ${new Date(joiningDate).toLocaleDateString()}\nOffered Salary: $${salary} per annum.\n\nPlease review and reply with your acceptance.\n\nBest regards,\nHR Management`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Offer letter details sent successfully',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};
