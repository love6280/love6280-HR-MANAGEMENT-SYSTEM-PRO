import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Payroll from '../models/Payroll.js';
import PerformanceReview from '../models/PerformanceReview.js';
import AppError from '../utils/AppError.js';
import bcrypt from 'bcryptjs';

// Get all employees with pagination, filtering & sorting
export const getEmployees = async (req, res, next) => {
  try {
    const { department, designation, status, search, page = 1, limit = 10, sort = 'employeeId' } = req.query;

    const query = {};

    // Apply department filter
    if (department) {
      query['workInfo.department'] = department;
    }

    // Apply designation filter
    if (designation) {
      query['workInfo.designation'] = designation;
    }

    // Apply status filter
    if (status) {
      query.isActive = status === 'Active';
    }

    // Apply search filter (name, email, employeeID)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'contactInfo.workEmail': searchRegex },
        { employeeId: searchRegex },
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const employees = await Employee.find(query)
      .populate('workInfo.department')
      .populate('workInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName')
      .sort({ [sort]: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      status: 'success',
      total,
      pages: Math.ceil(total / limit),
      page: parseInt(page),
      limit: parseInt(limit),
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// Get single employee detailed data for profile view
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('workInfo.department')
      .populate('workInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName personalInfo.photo contactInfo.workEmail')
      .populate('documents');

    if (!employee) {
      return next(new AppError('No employee found with that ID', 404));
    }

    // Retrieve supplementary profile data
    const leaves = await Leave.find({ employee: employee._id }).sort({ createdAt: -1 });
    const attendance = await Attendance.find({ employee: employee._id }).sort({ date: -1 }).limit(100);
    const payslips = await Payroll.find({ employee: employee._id }).sort({ year: -1, month: -1 });
    const reviews = await PerformanceReview.find({ employee: employee._id }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        employee,
        leaves,
        attendance,
        payslips,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new employee, auto-generate Employee ID and Email, create login user account
export const createEmployee = async (req, res, next) => {
  try {
    const { personalInfo, contactInfo, emergencyContact, workInfo, salaryInfo } = req.body;

    // Auto-generate employee ID
    const lastEmployee = await Employee.findOne({}, {}, { sort: { employeeId: -1 } });
    let nextIdNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const match = lastEmployee.employeeId.match(/\d+/);
      if (match) {
        nextIdNumber = parseInt(match[0]) + 1;
      }
    }
    
    let employeeId = `EMP${String(nextIdNumber).padStart(3, '0')}`;
    
    // Fallback: Ensure the generated ID is completely unique
    let idCheck = await Employee.findOne({ employeeId });
    while (idCheck) {
      nextIdNumber += 1;
      employeeId = `EMP${String(nextIdNumber).padStart(3, '0')}`;
      idCheck = await Employee.findOne({ employeeId });
    }

    // Auto-generate work email
    const fName = personalInfo.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lName = personalInfo.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const workEmail = `${fName}.${lName}@hrms.com`;

    // Ensure email is unique (append random digits if exists)
    let emailCheck = await Employee.findOne({ 'contactInfo.workEmail': workEmail });
    let finalWorkEmail = workEmail;
    if (emailCheck) {
      finalWorkEmail = `${fName}.${lName}${Math.floor(Math.random() * 100)}@hrms.com`;
    }

    // Clean up empty ObjectIds in workInfo to avoid Mongoose CastError
    const cleanedWorkInfo = { ...workInfo };
    if (cleanedWorkInfo.reportingManager === '') {
      cleanedWorkInfo.reportingManager = null;
    }
    if (cleanedWorkInfo.department === '') {
      cleanedWorkInfo.department = null;
    }

    // Create Employee record
    const newEmployee = await Employee.create({
      employeeId,
      personalInfo,
      contactInfo: {
        ...contactInfo,
        workEmail: finalWorkEmail,
      },
      emergencyContact,
      workInfo: cleanedWorkInfo,
      salaryInfo,
      isActive: true,
      createdBy: req.user ? req.user._id : null,
    });

    // Create User login account for the employee
    const defaultPassword = 'Emp@123';
    const userRole = workInfo.designation.toLowerCase().includes('manager') ? 'TeamManager' : 'Employee';
    
    await User.create({
      email: finalWorkEmail,
      password: defaultPassword, // pre-save hook handles hashing in User model
      role: userRole,
      employee: newEmployee._id,
      isActive: true,
    });

    // Initialize Leave Balance for the year
    const currentYear = new Date().getFullYear();
    await LeaveBalance.create({
      employee: newEmployee._id,
      year: currentYear,
      casual: { total: 10, used: 0, remaining: 10 },
      sick: { total: 10, used: 0, remaining: 10 },
      paid: { total: 15, used: 0, remaining: 15 },
      wfh: { total: 20, used: 0, remaining: 20 },
    });

    res.status(201).json({
      status: 'success',
      data: newEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// Update employee
export const updateEmployee = async (req, res, next) => {
  try {
    // Clean up empty ObjectIds to avoid Mongoose CastError
    if (req.body.workInfo) {
      if (req.body.workInfo.reportingManager === '') {
        req.body.workInfo.reportingManager = null;
      }
      if (req.body.workInfo.department === '') {
        req.body.workInfo.department = null;
      }
    }
    if (req.body['workInfo.reportingManager'] === '') {
      req.body['workInfo.reportingManager'] = null;
    }
    if (req.body['workInfo.department'] === '') {
      req.body['workInfo.department'] = null;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedEmployee) {
      return next(new AppError('No employee found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk action (Deactivate or delete employees)
export const bulkEmployeeAction = async (req, res, next) => {
  const { ids, action } = req.body; // ids: array of ids, action: 'deactivate' | 'delete' | 'activate'

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('Please provide an array of employee IDs', 400));
  }

  try {
    if (action === 'deactivate') {
      await Employee.updateMany({ _id: { $in: ids } }, { isActive: false });
      // Deactivate associated users
      const emps = await Employee.find({ _id: { $in: ids } });
      const emails = emps.map(e => e.contactInfo.workEmail);
      await User.updateMany({ email: { $in: emails } }, { isActive: false });
    } else if (action === 'activate') {
      await Employee.updateMany({ _id: { $in: ids } }, { isActive: true });
      const emps = await Employee.find({ _id: { $in: ids } });
      const emails = emps.map(e => e.contactInfo.workEmail);
      await User.updateMany({ email: { $in: emails } }, { isActive: true });
    } else if (action === 'delete') {
      const emps = await Employee.find({ _id: { $in: ids } });
      const emails = emps.map(e => e.contactInfo.workEmail);
      await User.deleteMany({ email: { $in: emails } });
      await Employee.deleteMany({ _id: { $in: ids } });
      await LeaveBalance.deleteMany({ employee: { $in: ids } });
    } else {
      return next(new AppError('Invalid bulk action', 400));
    }

    res.status(200).json({
      status: 'success',
      message: `Bulk ${action} action performed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// --- DEPARTMENT MANAGEMENT ---

// Get all departments
export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('hod', 'personalInfo.firstName personalInfo.lastName personalInfo.photo workInfo.designation')
      .populate('parentDepartment', 'name');

    // Attach counts of employees in each department
    const results = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ 'workInfo.department': dept._id, isActive: true });
        return {
          ...dept.toObject(),
          totalEmployees: count,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Create a department
export const createDepartment = async (req, res, next) => {
  try {
    const newDepartment = await Department.create(req.body);
    res.status(201).json({
      status: 'success',
      data: newDepartment,
    });
  } catch (error) {
    next(error);
  }
};

// Update department
export const updateDepartment = async (req, res, next) => {
  try {
    const updatedDepartment = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDepartment) {
      return next(new AppError('No department found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: updatedDepartment,
    });
  } catch (error) {
    next(error);
  }
};

// Get department detail with team employees list
export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hod', 'personalInfo.firstName personalInfo.lastName personalInfo.photo contactInfo.workEmail')
      .populate('parentDepartment', 'name');

    if (!department) {
      return next(new AppError('No department found with that ID', 404));
    }

    const team = await Employee.find({ 'workInfo.department': department._id, isActive: true })
      .populate('workInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName');

    res.status(200).json({
      status: 'success',
      data: {
        department,
        employees: team,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete department
export const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return next(new AppError('No department found with that ID', 404));
    }
    // Remove references in employees
    await Employee.updateMany({ 'workInfo.department': req.params.id }, { $unset: { 'workInfo.department': '' } });

    res.status(200).json({
      status: 'success',
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Org Chart Visualization data structure builder
export const getOrgChart = async (req, res, next) => {
  try {
    // Get active employees
    const employees = await Employee.find({ isActive: true }, '_id personalInfo.firstName personalInfo.lastName personalInfo.photo workInfo.designation workInfo.reportingManager')
      .populate('workInfo.reportingManager', '_id');

    // Build hierarchical tree structure starting from CEO / CEO-equivalent (employee without reportingManager)
    const map = {};
    const roots = [];

    employees.forEach(emp => {
      map[emp._id.toString()] = {
        id: emp._id.toString(),
        name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        title: emp.workInfo.designation,
        photo: emp.personalInfo.photo,
        children: []
      };
    });

    employees.forEach(emp => {
      const parentId = emp.workInfo.reportingManager?._id?.toString();
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[emp._id.toString()]);
      } else {
        roots.push(map[emp._id.toString()]);
      }
    });

    res.status(200).json({
      status: 'success',
      data: roots.length > 0 ? roots[0] : null, // Assuming a single root node (e.g. EMP001 / Admin or CEO)
    });
  } catch (error) {
    next(error);
  }
};
