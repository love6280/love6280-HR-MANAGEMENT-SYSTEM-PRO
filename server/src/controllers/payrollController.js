import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import AppError from '../utils/AppError.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../config/email.js';

export const getSalaryStructure = async (req, res, next) => {
  const { employeeId } = req.params;

  try {
    const emp = await Employee.findById(employeeId, 'salaryInfo employeeId personalInfo');
    if (!emp) {
      return next(new AppError('No employee found with this ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: emp,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSalaryStructure = async (req, res, next) => {
  const { employeeId } = req.params;
  const { basic, hra, da, conveyance, medical, specialAllowance, otherAllowances, bankName, accountNumber, ifsc, accountHolder } = req.body;

  try {
    const emp = await Employee.findById(employeeId);
    if (!emp) {
      return next(new AppError('No employee found with this ID', 404));
    }

    emp.salaryInfo = {
      basic: basic || 0,
      hra: hra || 0,
      da: da || 0,
      conveyance: conveyance || 0,
      medical: medical || 0,
      specialAllowance: specialAllowance || 0,
      otherAllowances: otherAllowances || 0,
      bankName: bankName || emp.salaryInfo.bankName,
      accountNumber: accountNumber || emp.salaryInfo.accountNumber,
      ifsc: ifsc || emp.salaryInfo.ifsc,
      accountHolder: accountHolder || emp.salaryInfo.accountHolder,
    };

    await emp.save();

    res.status(200).json({
      status: 'success',
      message: 'Salary structure updated successfully',
      data: emp.salaryInfo,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollDashboard = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1; // current month

    const currentPayroll = await Payroll.find({ month, year });
    
    const processedCount = currentPayroll.filter(p => p.status === 'Processed' || p.status === 'Paid').length;
    const pendingCount = currentPayroll.filter(p => p.status === 'Draft').length;
    
    const totalPayout = currentPayroll.reduce((acc, curr) => acc + curr.netPay, 0);

    // Get previous month payout for percentage calculation
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    const prevPayroll = await Payroll.find({ month: lastMonth, year: lastYear });
    const prevPayout = prevPayroll.reduce((acc, curr) => acc + curr.netPay, 0);

    let percentChange = 0;
    if (prevPayout > 0) {
      percentChange = parseFloat((((totalPayout - prevPayout) / prevPayout) * 100).toFixed(2));
    }

    // Department wise payroll breakup
    const employees = await Employee.find({ isActive: true }).populate('workInfo.department');
    const deptBreakdownMap = {};

    currentPayroll.forEach(p => {
      const emp = employees.find(e => e._id.toString() === p.employee.toString());
      const deptName = emp?.workInfo?.department?.name || 'Unassigned';
      if (!deptBreakdownMap[deptName]) {
        deptBreakdownMap[deptName] = 0;
      }
      deptBreakdownMap[deptName] += p.netPay;
    });

    const departmentWiseBreakup = Object.keys(deptBreakdownMap).map(key => ({
      department: key,
      amount: deptBreakdownMap[key],
    }));

    const recentRuns = await Payroll.find()
      .populate('employee', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        statusCounts: {
          processed: processedCount,
          pending: pendingCount,
          onHold: 0, // Mock hold count
        },
        totalPayout,
        percentChange,
        departmentWiseBreakup,
        recentRuns,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const runPayroll = async (req, res, next) => {
  const { month, year } = req.body;

  if (!month || !year) {
    return next(new AppError('Please provide month and year', 400));
  }

  try {
    const activeEmployees = await Employee.find({ isActive: true });
    const processedRecords = [];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    for (const emp of activeEmployees) {
      const sal = emp.salaryInfo;
      const gross = sal.basic + sal.hra + sal.da + sal.conveyance + sal.medical + sal.specialAllowance + sal.otherAllowances;

      // 1. Calculate Loss of Pay (LOP) from Attendance
      const absentCount = await Attendance.countDocuments({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
        status: 'Absent',
      });

      const lopDays = absentCount;
      const dayRate = gross / 30; // standard 30 day divisor
      const lopAmount = Math.round(lopDays * dayRate);

      // 2. Statutory Calculations
      // PF: 12% of basic salary
      const pf = Math.round(sal.basic * 0.12);
      
      // ESI: 0.75% of gross if gross < 21000
      const esi = gross < 21000 ? Math.round(gross * 0.0075) : 0;
      
      // PT: Professional Tax slabs (mocking: 200 INR if gross > 20000)
      const pt = gross > 20000 ? 200 : 0;
      
      // TDS: Mock tax deduction (5% of gross for this demo)
      const tds = Math.round(gross * 0.05);

      const totalDeductions = pf + esi + pt + tds + lopAmount;
      const netPay = Math.max(0, gross - totalDeductions);

      // 3. Save or Update Payroll Record
      const payPeriod = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const record = await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year },
        {
          employee: emp._id,
          month,
          year,
          payPeriod,
          earnings: {
            basic: sal.basic,
            hra: sal.hra,
            da: sal.da,
            conveyance: sal.conveyance,
            medical: sal.medical,
            special: sal.specialAllowance,
            other: sal.otherAllowances,
          },
          deductions: {
            pf,
            esi,
            pt,
            tds,
            loan: 0,
            other: 0,
          },
          lopDays,
          lopAmount,
          grossEarnings: gross,
          totalDeductions,
          netPay,
          status: 'Draft',
          processedBy: req.user._id,
        },
        { upsert: true, new: true }
      );

      processedRecords.push(record);
    }

    res.status(200).json({
      status: 'success',
      message: `Payroll calculations run successfully. Generated ${processedRecords.length} drafts.`,
      data: processedRecords,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayrollStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // status: 'Processed' | 'Paid'

  try {
    const record = await Payroll.findById(id).populate('employee');
    if (!record) {
      return next(new AppError('No payroll record found', 404));
    }

    record.status = status;
    if (status === 'Paid') {
      record.processedAt = new Date();
      // Generate a mock PDF link
      record.payslipUrl = `/payslips/EMP_${record.employee.employeeId}_${record.year}_0${record.month}.pdf`;
    }

    await record.save();

    if (status === 'Paid') {
      // In-app alert
      await Notification.create({
        employee: record.employee._id,
        type: 'payslip_generated',
        message: `Your payslip for ${record.payPeriod} has been generated. Net pay: $${record.netPay}`,
        link: '/payroll',
      });

      // Email alert
      await sendEmail({
        to: record.employee.contactInfo.workEmail,
        subject: `Payslip Released: ${record.payPeriod}`,
        text: `Dear ${record.employee.fullName},\n\nYour payslip for the pay period ${record.payPeriod} has been processed and paid.\nNet Payout: $${record.netPay}\n\nYou can download the PDF payslip from your portal account.\n\nRegards,\nFinance Team`,
      });
    }

    res.status(200).json({
      status: 'success',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayslip = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'workInfo.department', select: 'name' }
      });

    if (!record) {
      return next(new AppError('No payslip record found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalaryReports = async (req, res, next) => {
  try {
    const reports = await Payroll.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year', payPeriod: '$payPeriod' },
          totalPayout: { $sum: '$netPay' },
          totalGross: { $sum: '$grossEarnings' },
          totalDeduction: { $sum: '$totalDeductions' },
          employeeCount: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: reports.map(r => ({
        month: r._id.month,
        year: r._id.year,
        period: r._id.payPeriod,
        totalPayout: r.totalPayout,
        totalGross: r.totalGross,
        totalDeduction: r.totalDeduction,
        employeeCount: r.employeeCount,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRuns = async (req, res, next) => {
  const { month, year } = req.query;

  try {
    const query = {};
    if (month) query.month = parseInt(month, 10);
    if (year) query.year = parseInt(year, 10);

    const runs = await Payroll.find(query)
      .populate('employee', 'personalInfo.firstName personalInfo.lastName employeeId');

    res.status(200).json({
      status: 'success',
      data: runs,
    });
  } catch (error) {
    next(error);
  }
};

