import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import { getSocketInstance } from '../server.js'; // to emit real-time notifications

const getFormattedTime = () => {
  const d = new Date();
  return d.toTimeString().split(' ')[0]; // HH:MM:SS
};

export const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id;
    if (!employeeId) {
      return next(new AppError('No employee profile associated with this account', 400));
    }

    const todayStr = new Date().setHours(0, 0, 0, 0);
    const today = new Date(todayStr);

    // Check if check-in already exists
    let attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (attendance && attendance.checkIn) {
      return next(new AppError('Already checked in for today', 400));
    }

    const checkInTime = getFormattedTime();
    
    // Check if late (e.g., after 09:15 AM)
    const [h, m] = checkInTime.split(':').map(Number);
    const isLate = (h > 9) || (h === 9 && m > 15);

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        checkIn: checkInTime,
        status: req.body.wfh ? 'WFH' : 'Present',
        isLate,
        breakTime: 60, // default 60 mins break
      });
    } else {
      attendance.checkIn = checkInTime;
      attendance.status = req.body.wfh ? 'WFH' : 'Present';
      attendance.isLate = isLate;
      attendance.breakTime = 60;
    }

    await attendance.save();

    // Socket.io Real-time event emit
    const io = getSocketInstance();
    if (io) {
      io.emit('attendance_update', {
        employeeId,
        type: 'check_in',
        time: checkInTime,
      });
    }

    res.status(200).json({
      status: 'success',
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id;
    if (!employeeId) {
      return next(new AppError('No employee profile associated with this account', 400));
    }

    const todayStr = new Date().setHours(0, 0, 0, 0);
    const today = new Date(todayStr);

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance || !attendance.checkIn) {
      return next(new AppError('Must check in first before checking out', 400));
    }

    if (attendance.checkOut) {
      return next(new AppError('Already checked out for today', 400));
    }

    const checkOutTime = getFormattedTime();

    // Check if early departure (e.g., before 06:00 PM)
    const [h, m] = checkOutTime.split(':').map(Number);
    const isEarlyDeparture = h < 18;

    // Calculate total hours
    const [ciH, ciM, ciS] = attendance.checkIn.split(':').map(Number);
    const [coH, coM, coS] = checkOutTime.split(':').map(Number);
    
    // total work minutes minus breakTime (60 min)
    const totalMinutes = (coH * 60 + coM) - (ciH * 60 + ciM) - attendance.breakTime;
    const totalHours = Math.max(0, parseFloat((totalMinutes / 60).toFixed(2)));

    attendance.checkOut = checkOutTime;
    attendance.isEarlyDeparture = isEarlyDeparture;
    attendance.totalHours = totalHours;

    // If total hours is less than 4, set to Half-day
    if (totalHours < 4) {
      attendance.status = 'Half-day';
    }

    await attendance.save();

    // Emit socket alert
    const io = getSocketInstance();
    if (io) {
      io.emit('attendance_update', {
        employeeId,
        type: 'check_out',
        time: checkOutTime,
      });
    }

    res.status(200).json({
      status: 'success',
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate, department, status } = req.query;
    const query = {};

    if (employeeId) {
      query.employee = employeeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(new Date(startDate).setHours(0,0,0,0)),
        $lte: new Date(new Date(endDate).setHours(23,59,59,999)),
      };
    }

    if (status) {
      query.status = status;
    }

    let records = await Attendance.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'workInfo.department', select: 'name' }
      })
      .sort({ date: -1 });

    // Apply department filter post-populate if requested
    if (department) {
      records = records.filter(r => r.employee?.workInfo?.department?._id?.toString() === department);
    }

    res.status(200).json({
      status: 'success',
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const regularizeAttendance = async (req, res, next) => {
  try {
    const { id } = req.params; // attendance log id
    const { checkIn, checkOut, reason } = req.body;

    const record = await Attendance.findById(id);
    if (!record) {
      return next(new AppError('No attendance record found with this ID', 404));
    }

    record.regularizationRequest = {
      requested: true,
      checkIn,
      checkOut,
      reason,
      status: 'Pending',
    };

    await record.save();

    res.status(200).json({
      status: 'success',
      message: 'Regularization request submitted successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRegularization = async (req, res, next) => {
  const { id } = req.params;
  const { status, comment } = req.body; // status: 'Approved' | 'Rejected'

  try {
    const record = await Attendance.findById(id);
    if (!record || !record.regularizationRequest.requested) {
      return next(new AppError('No pending regularization request found', 404));
    }

    record.regularizationRequest.status = status;
    record.regularizationRequest.approvedBy = req.user._id;

    if (status === 'Approved') {
      record.checkIn = record.regularizationRequest.checkIn || record.checkIn;
      record.checkOut = record.regularizationRequest.checkOut || record.checkOut;
      record.status = 'Present'; // regularized is marked present
      record.isLate = false;
      record.isEarlyDeparture = false;

      // Recalculate hours
      if (record.checkIn && record.checkOut) {
        const [ciH, ciM] = record.checkIn.split(':').map(Number);
        const [coH, coM] = record.checkOut.split(':').map(Number);
        const totalMinutes = (coH * 60 + coM) - (ciH * 60 + ciM) - record.breakTime;
        record.totalHours = Math.max(0, parseFloat((totalMinutes / 60).toFixed(2)));
      }
    }

    // turn off flag
    record.regularizationRequest.requested = false;

    await record.save();

    res.status(200).json({
      status: 'success',
      message: `Regularization request ${status.toLowerCase()} successfully`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayPresentEmployees = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const activeEmployees = await Employee.countDocuments({ isActive: true });
    
    const presentRecords = await Attendance.find({
      date: today,
      status: { $in: ['Present', 'WFH', 'Half-day'] },
    }).populate('employee', 'personalInfo.firstName personalInfo.lastName personalInfo.photo workInfo.designation');

    const leaveCount = await Attendance.countDocuments({ date: today, status: 'Leave' });
    const absentCount = activeEmployees - presentRecords.length - leaveCount;

    res.status(200).json({
      status: 'success',
      counts: {
        total: activeEmployees,
        present: presentRecords.length,
        leave: leaveCount,
        absent: Math.max(0, absentCount),
      },
      data: presentRecords,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkImportAttendance = async (req, res, next) => {
  try {
    const { logs } = req.body; // array of: { employeeId, date, checkIn, checkOut, status }
    if (!logs || !Array.isArray(logs)) {
      return next(new AppError('Invalid import format. Expected array.', 400));
    }

    const imported = [];
    for (const log of logs) {
      const emp = await Employee.findOne({ employeeId: log.employeeId });
      if (!emp) continue;

      const date = new Date(log.date);
      date.setHours(0,0,0,0);

      let isLate = false;
      let isEarlyDeparture = false;
      let totalHours = 0;

      if (log.checkIn && log.checkOut) {
        const [ciH, ciM] = log.checkIn.split(':').map(Number);
        const [coH, coM] = log.checkOut.split(':').map(Number);
        isLate = (ciH > 9) || (ciH === 9 && ciM > 15);
        isEarlyDeparture = coH < 18;
        totalHours = parseFloat((((coH * 60 + coM) - (ciH * 60 + ciM) - 60) / 60).toFixed(2));
      }

      const updated = await Attendance.findOneAndUpdate(
        { employee: emp._id, date },
        {
          employee: emp._id,
          date,
          checkIn: log.checkIn,
          checkOut: log.checkOut,
          status: log.status || 'Present',
          totalHours: Math.max(0, totalHours),
          isLate,
          isEarlyDeparture,
          breakTime: 60,
        },
        { upsert: true, new: true }
      );
      imported.push(updated);
    }

    res.status(201).json({
      status: 'success',
      count: imported.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceSummary = async (req, res, next) => {
  const { employeeId, month, year } = req.params;

  try {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const records = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    });

    const summary = {
      Present: 0,
      Absent: 0,
      'Half-day': 0,
      WFH: 0,
      Leave: 0,
      Holiday: 0,
    };

    records.forEach(r => {
      if (summary[r.status] !== undefined) {
        summary[r.status]++;
      }
    });

    res.status(200).json({
      status: 'success',
      data: summary,
      records,
    });
  } catch (error) {
    next(error);
  }
};
