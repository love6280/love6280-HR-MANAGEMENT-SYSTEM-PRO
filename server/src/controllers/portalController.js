import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Job from '../models/Job.js';
import Announcement from '../models/Announcement.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import { uploadFileToStorage } from '../config/cloudinary.js';

// --- DASHBOARD METRICS ---

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Top row stats
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const presentToday = await Attendance.countDocuments({ date: today, status: { $in: ['Present', 'WFH', 'Half-day'] } });
    const onLeaveToday = await Leave.countDocuments({ fromDate: { $lte: today }, toDate: { $gte: today }, status: 'Approved' });
    const openPositions = await Job.countDocuments({ status: 'Published' });

    // Compare with last month to get percentage change (mocking stats comparisons)
    const empChange = 4.2; // +4.2% change vs last month
    const presentChange = -1.5;
    const leaveChange = 12.0;

    // 2. Employee Headcount Trend (last 12 months)
    const headcountTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      
      // Calculate cumulative employees joined before or during this month
      const maxDate = new Date(year, d.getMonth() + 1, 0, 23, 59, 59);
      const count = await Employee.countDocuments({ 'workInfo.dateOfJoining': { $lte: maxDate }, isActive: true });
      
      headcountTrend.push({
        month: `${monthName} ${year}`,
        headcount: count || 5, // fallback to min
      });
    }

    // 3. Department Distribution Donut
    const deptDistribution = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$workInfo.department',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      {
        $project: {
          name: { $ifNull: [{ $arrayElemAt: ['$deptInfo.name', 0] }, 'Unassigned'] },
          value: '$count'
        }
      }
    ]);

    // 4. Attendance Bar Chart (this week: Mon-Fri)
    const attendanceThisWeek = [];
    const currentDay = today.getDay();
    const mondayOffset = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    for (let i = 0; i < 5; i++) { // Mon - Fri
      const dayDate = new Date(today);
      dayDate.setDate(mondayOffset + i);
      dayDate.setHours(0,0,0,0);

      const dayName = dayDate.toLocaleDateString('default', { weekday: 'short' });

      const present = await Attendance.countDocuments({ date: dayDate, status: { $in: ['Present', 'WFH'] } });
      const halfDay = await Attendance.countDocuments({ date: dayDate, status: 'Half-day' });
      const absent = await Attendance.countDocuments({ date: dayDate, status: 'Absent' });

      attendanceThisWeek.push({
        day: dayName,
        Present: present,
        'Half-day': halfDay,
        Absent: absent,
      });
    }

    // 5. Leave Status Pie Chart (this month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const approvedLeaves = await Leave.countDocuments({ fromDate: { $gte: startOfMonth }, toDate: { $lte: endOfMonth }, status: 'Approved' });
    const pendingLeaves = await Leave.countDocuments({ fromDate: { $gte: startOfMonth }, toDate: { $lte: endOfMonth }, status: 'Pending' });
    const rejectedLeaves = await Leave.countDocuments({ fromDate: { $gte: startOfMonth }, toDate: { $lte: endOfMonth }, status: 'Rejected' });

    const leaveStatusDist = [
      { name: 'Approved', value: approvedLeaves, color: '#10b981' },
      { name: 'Pending', value: pendingLeaves, color: '#f59e0b' },
      { name: 'Rejected', value: rejectedLeaves, color: '#f43f5e' },
    ];

    // 6. Recent Activities feed
    // Mocking recent feed actions
    const recentActivities = [
      { id: 1, action: 'Employee EMP005 checked in', time: '10 mins ago', type: 'checkin' },
      { id: 2, action: 'Leave request approved for EMP004', time: '1 hour ago', type: 'leave' },
      { id: 3, action: 'New announcement published: Quarterly Town Hall', time: '3 hours ago', type: 'announcement' },
      { id: 4, action: 'Candidate Diana Prince moved to Offer stage', time: 'Yesterday', type: 'recruitment' },
      { id: 5, action: 'Payroll processed for May 2026', time: '2 days ago', type: 'payroll' },
    ];

    // 7. Upcoming Birthdays (next 7 days)
    const birthdays = [];
    const activeEmps = await Employee.find({ isActive: true });
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    activeEmps.forEach(emp => {
      if (emp.personalInfo.dob) {
        const dob = new Date(emp.personalInfo.dob);
        const dobMonth = dob.getMonth();
        const dobDate = dob.getDate();
        
        // simple logic: check if month is current and day is within 7 days range
        const diffTime = new Date(today.getFullYear(), dobMonth, dobDate) - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          birthdays.push({
            name: emp.fullName,
            date: dob.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
            photo: emp.personalInfo.photo,
          });
        }
      }
    });

    // 8. Today's announcements (max 3)
    const announcements = await Announcement.find({ expiresAt: { $gt: today } })
      .populate('postedBy', 'email')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(3);

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalEmployees: { value: totalEmployees, change: empChange, type: 'up' },
          presentToday: { value: presentToday, change: presentChange, type: 'down' },
          onLeaveToday: { value: onLeaveToday, change: leaveChange, type: 'up' },
          openPositions: { value: openPositions, change: 0, type: 'neutral' },
        },
        headcountTrend,
        deptDistribution,
        attendanceThisWeek,
        leaveStatusDist,
        recentActivities,
        birthdays,
        announcements,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- ANNOUNCEMENTS ---

export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('postedBy', 'email')
      .populate('comments.employee', 'personalInfo.firstName personalInfo.lastName personalInfo.photo')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      postedBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const commentAnnouncement = async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;
  const employeeId = req.user.employee?._id;

  if (!employeeId) {
    return next(new AppError('No employee profile associated', 400));
  }

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    announcement.comments.push({
      text,
      employee: employeeId,
    });

    await announcement.save();

    const populated = await Announcement.findById(id)
      .populate('postedBy', 'email')
      .populate('comments.employee', 'personalInfo.firstName personalInfo.lastName personalInfo.photo');

    res.status(200).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const reactAnnouncement = async (req, res, next) => {
  const { id } = req.params;
  const { type } = req.body; // type: 'like' | 'love' | 'celebrate'
  const employeeId = req.user.employee?._id;

  if (!employeeId) {
    return next(new AppError('No employee profile associated', 400));
  }

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    // Check if user already reacted, if yes, toggle/remove or change reaction
    const existingIndex = announcement.reactions.findIndex(r => r.employee.toString() === employeeId.toString());

    if (existingIndex > -1) {
      if (announcement.reactions[existingIndex].type === type) {
        // remove
        announcement.reactions.splice(existingIndex, 1);
      } else {
        // update type
        announcement.reactions[existingIndex].type = type;
      }
    } else {
      // add new
      announcement.reactions.push({
        type,
        employee: employeeId,
      });
    }

    await announcement.save();

    res.status(200).json({
      status: 'success',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

// --- DOCUMENT MANAGEMENT ---

export const uploadDocument = async (req, res, next) => {
  const { type } = req.body;
  const employeeId = req.user.employee?._id;

  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  try {
    // Upload file (either to Cloudinary or locally)
    const uploadResult = await uploadFileToStorage(req.file);

    const doc = await Document.create({
      employee: employeeId,
      type,
      name: req.file.originalname,
      fileUrl: uploadResult.url,
      fileSize: req.file.size,
      verificationStatus: 'Pending',
    });

    // Link doc in Employee
    await Employee.findByIdAndUpdate(employeeId, {
      $push: { documents: doc._id }
    });

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'Employee') {
      query.employee = req.user.employee?._id;
    } // HR Manager sees all documents

    const docs = await Document.find(query)
      .populate('employee', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: docs,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectedReason } = req.body; // status: 'Verified' | 'Rejected'

  try {
    const doc = await Document.findById(id);
    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    doc.verificationStatus = status;
    doc.rejectedReason = status === 'Rejected' ? rejectedReason : undefined;
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    await doc.save();

    // Alert employee
    await Notification.create({
      employee: doc.employee,
      type: 'announcement',
      message: `Your document '${doc.name}' has been ${status.toLowerCase()}`,
      link: '/documents',
    });

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

// --- NOTIFICATIONS ---

export const getNotifications = async (req, res, next) => {
  const employeeId = req.user.employee?._id;
  if (!employeeId) {
    return res.status(200).json({ status: 'success', data: [], unreadCount: 0 });
  }

  try {
    const list = await Notification.find({ employee: employeeId })
      .sort({ createdAt: -1 })
      .limit(10);

    const unreadCount = await Notification.countDocuments({ employee: employeeId, isRead: false });

    res.status(200).json({
      status: 'success',
      unreadCount,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (req, res, next) => {
  const employeeId = req.user.employee?._id;
  if (!employeeId) return next(new AppError('Not authorized', 401));

  try {
    await Notification.updateMany({ employee: employeeId, isRead: false }, { isRead: true });
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
