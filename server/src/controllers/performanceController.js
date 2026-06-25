import PerformanceReview from '../models/PerformanceReview.js';
import Goal from '../models/Goal.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import Notification from '../models/Notification.js';

// --- GOAL MANAGEMENT ---

export const getGoals = async (req, res, next) => {
  const { employeeId } = req.query;
  // If employeeId is specified, fetch that, otherwise default to logged in employee
  const targetEmployee = employeeId || req.user.employee?._id;

  if (!targetEmployee) {
    return next(new AppError('No employee profile associated with this account', 400));
  }

  try {
    const goals = await Goal.find({ employee: targetEmployee }).sort({ targetDate: 1 });
    res.status(200).json({
      status: 'success',
      data: goals,
    });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  const employeeId = req.body.employeeId || req.user.employee?._id;

  if (!employeeId) {
    return next(new AppError('Please provide employee ID', 400));
  }

  try {
    const goal = await Goal.create({
      employee: employeeId,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      targetDate: req.body.targetDate,
      progress: 0,
      status: 'Not Started',
    });

    res.status(201).json({
      status: 'success',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGoalProgress = async (req, res, next) => {
  const { id } = req.params;
  const { progress, notes } = req.body; // progress: 0-100, notes: comment string

  try {
    const goal = await Goal.findById(id);
    if (!goal) {
      return next(new AppError('Goal not found', 404));
    }

    goal.progress = progress;
    if (progress === 100) {
      goal.status = 'Completed';
    } else if (progress > 0) {
      goal.status = 'In Progress';
    }

    if (notes) {
      goal.notes.push({
        text: notes,
        addedBy: req.user._id,
      });
    }

    await goal.save();

    res.status(200).json({
      status: 'success',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// --- PERFORMANCE REVIEWS ---

export const getReviews = async (req, res, next) => {
  const { employeeId } = req.query;
  const targetEmployee = employeeId || req.user.employee?._id;

  try {
    let query = {};
    if (req.user.role === 'Employee') {
      query.employee = targetEmployee;
    } else if (req.user.role === 'TeamManager') {
      // Manager can see reviews they wrote or reviews of their team
      const teamEmployees = await Employee.find({ 'workInfo.reportingManager': req.user.employee?._id }).select('_id');
      const teamIds = teamEmployees.map(e => e._id);
      query.$or = [
        { employee: targetEmployee },
        { employee: { $in: teamIds } },
        { reviewer: req.user.employee?._id }
      ];
    } // Admin gets all

    const reviews = await PerformanceReview.find(query)
      .populate('employee', 'personalInfo.firstName personalInfo.lastName workInfo.designation')
      .populate('reviewer', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const createReviewCycle = async (req, res, next) => {
  const { reviewCycle, employeeId, periodStart, periodEnd, type } = req.body;

  try {
    const emp = await Employee.findById(employeeId);
    if (!emp) {
      return next(new AppError('Employee not found', 404));
    }

    const review = await PerformanceReview.create({
      reviewCycle,
      employee: employeeId,
      reviewer: emp.workInfo.reportingManager,
      type: type || 'Self',
      period: {
        start: periodStart,
        end: periodEnd,
      },
      status: 'Draft',
    });

    // Notify employee to complete self assessment
    await Notification.create({
      employee: employeeId,
      type: 'announcement', // generic performance review notify
      message: `Performance Review Cycle ${reviewCycle} has started. Please submit your self-assessment.`,
      link: '/performance',
    });

    res.status(201).json({
      status: 'success',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const submitPerformanceReview = async (req, res, next) => {
  const { id } = req.params; // review ID
  const { ratings, selfAssessment, managerComments, developmentPlan, isManagerSubmit } = req.body;

  try {
    const review = await PerformanceReview.findById(id).populate('employee');
    if (!review) {
      return next(new AppError('Performance Review record not found', 404));
    }

    if (isManagerSubmit) {
      // Manager submitting evaluation
      review.ratings = ratings || review.ratings;
      review.managerComments = managerComments;
      review.developmentPlan = developmentPlan;
      review.status = 'ReviewedByManager';
      
      // Notify employee to acknowledge
      await Notification.create({
        employee: review.employee._id,
        type: 'announcement',
        message: `Your manager has reviewed your performance cycle ${review.reviewCycle}. Please review and acknowledge.`,
        link: '/performance',
      });
    } else {
      // Employee submitting self assessment
      review.selfAssessment = selfAssessment;
      review.status = 'SubmittedByEmployee';

      // Notify manager
      if (review.reviewer) {
        await Notification.create({
          employee: review.reviewer,
          type: 'announcement',
          message: `${review.employee.fullName} has submitted self assessment for cycle ${review.reviewCycle}.`,
          link: '/performance',
        });
      }
    }

    await review.save();

    res.status(200).json({
      status: 'success',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeReview = async (req, res, next) => {
  const { id } = req.params;

  try {
    const review = await PerformanceReview.findById(id);
    if (!review) {
      return next(new AppError('Performance Review record not found', 404));
    }

    review.status = 'Completed';
    await review.save();

    res.status(200).json({
      status: 'success',
      message: 'Review acknowledged and completed',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
