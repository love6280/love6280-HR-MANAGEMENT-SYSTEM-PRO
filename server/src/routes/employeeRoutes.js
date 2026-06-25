import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  bulkEmployeeAction,
  getDepartments,
  createDepartment,
  updateDepartment,
  getDepartmentById,
  deleteDepartment,
  getOrgChart,
} from '../controllers/employeeController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Employees
router.get('/employees', protect, checkPermission('employees', 'view'), getEmployees);
router.get('/employees/org-chart', protect, getOrgChart);
router.get('/employees/:id', protect, getEmployeeById);
router.post('/employees', protect, checkPermission('employees', 'create'), createEmployee);
router.put('/employees/:id', protect, checkPermission('employees', 'edit'), updateEmployee);
router.post('/employees/bulk', protect, checkPermission('employees', 'edit'), bulkEmployeeAction);

// Departments
router.get('/departments', protect, getDepartments);
router.get('/departments/:id', protect, getDepartmentById);
router.post('/departments', protect, checkPermission('employees', 'create'), createDepartment);
router.put('/departments/:id', protect, checkPermission('employees', 'edit'), updateDepartment);
router.delete('/departments/:id', protect, checkPermission('employees', 'create'), deleteDepartment);

export default router;
