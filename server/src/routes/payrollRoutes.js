import express from 'express';
import {
  getSalaryStructure,
  updateSalaryStructure,
  getPayrollDashboard,
  runPayroll,
  updatePayrollStatus,
  getPayslip,
  getSalaryReports,
  getPayrollRuns,
} from '../controllers/payrollController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, checkPermission('payroll', 'manage'), getPayrollRuns);
router.get('/salary/:employeeId', protect, getSalaryStructure);
router.put('/salary/:employeeId', protect, checkPermission('payroll', 'process'), updateSalaryStructure);
router.get('/dashboard', protect, checkPermission('payroll', 'manage'), getPayrollDashboard);
router.post('/run', protect, checkPermission('payroll', 'process'), runPayroll);
router.put('/status/:id', protect, checkPermission('payroll', 'process'), updatePayrollStatus);
router.get('/payslip/:id', protect, getPayslip);
router.get('/reports', protect, checkPermission('payroll', 'manage'), getSalaryReports);


export default router;
