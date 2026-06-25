import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import { sendEmail } from '../config/email.js';
import { getSocketInstance } from '../server.js';
import Notification from '../models/Notification.js';

// Calculate working days excluding Saturdays, Sundays, and holidays
const calculateWorkingDays = (fromDate, toDate) => {
  let start = new Date(fromDate);
  const end = new Date(toDate);
  let days = 0;

  while (start <= end) {
    const dayOfWeek = start.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    
    // In production, check against a holidays collection. Here we mock:
    // Dec 25, Jan 1, Aug 15 national holidays
    const month = start.getMonth() + 1;
    const date = start.getDate();
    const isHoliday = (month === 12 && date === 25) || (month === 1 && date === 1) || (month === 8 && date === 15);

    if (!isWeekend && !isHoliday) {
      days++;
    }
    start.setDate(start.getDate() + 1);
  }
  return days;
};

export const getLeaveBalance = async (req, res, next) => {
  const { employeeId } = req.params;
  const year = new Date().getFullYear();

  try {
    let balance = await LeaveBalance.findOne({ employee: employeeId, year });
    if (!balance) {
      balance = await LeaveBalance.create({
        employee: employeeId,
        year,
      });
    }

    res.status(200).json({
      status: 'success',
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

export const applyLeave = async (req, res, next) => {
  const { leaveType, fromDate, toDate, isHalfDay, halfDayType, reason, attachment } = req.body;
  const employeeId = req.user.employee?._id;

  if (!employeeId) {
    return next(new AppError('No employee profile associated with this account', 400));
  }

  try {
    const year = new Date(fromDate).getFullYear();
    const totalDays = isHalfDay ? 0.5 : calculateWorkingDays(fromDate, toDate);

    if (totalDays === 0) {
      return next(new AppError('The selected range contains only weekends/holidays', 400));
    }

    // Check leave balance
    let balance = await LeaveBalance.findOne({ employee: employeeId, year });
    if (!balance) {
      balance = await LeaveBalance.create({ employee: employeeId, year });
    }

    const typeKey = leaveType.toLowerCase(); // casual, sick, paid, wfh
    const remaining = balance[typeKey].remaining;

    // Reject application if insufficient balance, except for Paid leave (which allows negative balance)
    if (leaveType !== 'Paid' && remaining < totalDays) {
      return next(new AppError(`Insufficient ${leaveType} leave balance. Remaining: ${remaining} days.`, 400));
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      fromDate,
      toDate,
      totalDays,
      isHalfDay,
      halfDayType,
      reason,
      attachment,
      status: 'Pending',
    });

    // Create Notification & email reporting manager
    const emp = await Employee.findById(employeeId).populate('workInfo.reportingManager');
    if (emp && emp.workInfo.reportingManager) {
      const managerUser = await Employee.findById(emp.workInfo.reportingManager);
      if (managerUser) {
        await Notification.create({
          employee: emp.workInfo.reportingManager._id,
          type: 'leave_request',
          message: `${emp.fullName} has applied for ${totalDays} day(s) of ${leaveType} leave.`,
          link: `/leaves/approval`,
        });

        // Email manager
        await sendEmail({
          to: emp.workInfo.reportingManager.contactInfo.workEmail,
          subject: `Leave Application: ${emp.fullName}`,
          text: `${emp.fullName} has requested ${totalDays} day(s) of ${leaveType} leave starting ${new Date(fromDate).toLocaleDateString()} for reason: ${reason}. Please approve or reject on the portal.`,
        });
      }
    }

    res.status(201).json({
      status: 'success',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveApplications = async (req, res, next) => {
  try {
    const { role } = req.user;
    const employeeId = req.user.employee?._id;
    let query = {};

    if (role === 'Employee') {
      // Employee views own applications
      query.employee = employeeId;
    } else if (role === 'TeamManager') {
      // Team manager views own leaves + team leaves
      const teamEmployees = await Employee.find({ 'workInfo.reportingManager': employeeId }).select('_id');
      const ids = teamEmployees.map(e => e._id);
      ids.push(employeeId); // Include manager's own
      query.employee = { $in: ids };
    } // HRManager & SuperAdmin can view all (empty query)

    const leaves = await Leave.find(query)
      .populate('employee', 'personalInfo.firstName personalInfo.lastName personalInfo.photo workInfo.designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRejectLeave = async (req, res, next) => {
  const { id } = req.params;
  const { status, comments } = req.body; // status: 'Approved' | 'Rejected' | 'Cancelled'

  try {
    const leave = await Leave.findById(id).populate('employee');
    if (!leave) {
      return next(new AppError('No leave application found with this ID', 404));
    }

    if (leave.status !== 'Pending') {
      return next(new AppError('Leave has already been processed', 400));
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.comments = comments;
    await leave.save();

    // If approved, deduct leave balance
    if (status === 'Approved') {
      const year = new Date(leave.fromDate).getFullYear();
      let balance = await LeaveBalance.findOne({ employee: leave.employee._id, year });
      
      if (balance) {
        const typeKey = leave.leaveType.toLowerCase(); // casual, sick, paid, wfh
        balance[typeKey].used += leave.totalDays;
        balance[typeKey].remaining -= leave.totalDays;
        await balance.save();
      }
    }

    // In-app Notification to Employee
    await Notification.create({
      employee: leave.employee._id,
      type: status === 'Approved' ? 'leave_approved' : 'leave_rejected',
      message: `Your ${leave.leaveType} leave application has been ${status.toLowerCase()}`,
      link: '/leaves',
    });

    // Email employee
    await sendEmail({
      to: leave.employee.contactInfo.workEmail,
      subject: `Leave Application Status: ${status}`,
      text: `Dear ${leave.employee.fullName},\n\nYour application for ${leave.totalDays} day(s) of ${leave.leaveType} leave starting ${new Date(leave.fromDate).toLocaleDateString()} has been ${status.toLowerCase()}.\n\nComments: ${comments || 'N/A'}\n\nRegards,\nHRMS Team`,
    });

    res.status(200).json({
      status: 'success',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamOnLeaveToday = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const activeLeaves = await Leave.find({
      fromDate: { $lte: today },
      toDate: { $gte: today },
      status: 'Approved',
    }).populate('employee', 'personalInfo.firstName personalInfo.lastName personalInfo.photo workInfo.designation');

    res.status(200).json({
      status: 'success',
      data: activeLeaves,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamCalendar = async (req, res, next) => {
  const { month, year } = req.params;

  try {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const leaves = await Leave.find({
      status: 'Approved',
      $or: [
        { fromDate: { $gte: startDate, $lte: endDate } },
        { toDate: { $gte: startDate, $lte: endDate } },
        { fromDate: { $lte: startDate }, toDate: { $gte: endDate } },
      ],
    }).populate('employee', 'personalInfo.firstName personalInfo.lastName');

    res.status(200).json({
      status: 'success',
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};
