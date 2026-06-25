import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PageWrapper from '../components/layout/PageWrapper';

// Feature Pages Imports
import Login from '../features/auth/Login';
import ForgotPassword from '../features/auth/ForgotPassword';
import ResetPassword from '../features/auth/ResetPassword';
import Unauthorized from '../features/auth/Unauthorized';
import Dashboard from '../features/dashboard/Dashboard';
import EmployeeList from '../features/employees/EmployeeList';
import EmployeeForm from '../features/employees/EmployeeForm';
import EmployeeProfile from '../features/employees/EmployeeProfile';
import DepartmentList from '../features/departments/DepartmentList';
import OrgChartView from '../features/departments/OrgChartView';
import AttendanceDashboard from '../features/attendance/AttendanceDashboard';
import AttendanceManagement from '../features/attendance/AttendanceManagement';
import LeaveDashboard from '../features/leaves/LeaveDashboard';
import PayrollDashboard from '../features/payroll/PayrollDashboard';
import Payslip from '../features/payroll/Payslip';
import RecruitmentBoard from '../features/recruitment/RecruitmentBoard';
import JobForm from '../features/recruitment/JobForm';
import PerformanceDashboard from '../features/performance/PerformanceDashboard';
import AnnouncementsPage from '../features/announcements/AnnouncementsPage';
import DocumentsPage from '../features/documents/DocumentsPage';
import ReportsPage from '../features/reports/ReportsPage';
import SettingsPage from '../features/settings/SettingsPage';

const AppRoutes = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Pages */}
      <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
      
      {/* Employees */}
      <Route path="/employees" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin', 'HRManager', 'TeamManager']}><EmployeeList /></RoleRoute></PageWrapper></ProtectedRoute>} />
      <Route path="/employees/add" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin', 'HRManager']}><EmployeeForm /></RoleRoute></PageWrapper></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><PageWrapper><EmployeeProfile /></PageWrapper></ProtectedRoute>} />

      {/* Departments */}
      <Route path="/departments" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin', 'HRManager', 'TeamManager']}><DepartmentList /></RoleRoute></PageWrapper></ProtectedRoute>} />
      <Route path="/departments/org-chart" element={<ProtectedRoute><PageWrapper><OrgChartView /></PageWrapper></ProtectedRoute>} />

      {/* Attendance - Serves view depending on role */}
      <Route path="/attendance" element={
        <ProtectedRoute>
          <PageWrapper>
            {user?.role === 'Employee' ? <AttendanceDashboard /> : <AttendanceManagement />}
          </PageWrapper>
        </ProtectedRoute>
      } />

      {/* Leaves */}
      <Route path="/leaves" element={<ProtectedRoute><PageWrapper><LeaveDashboard /></PageWrapper></ProtectedRoute>} />

      {/* Payroll */}
      <Route path="/payroll" element={<ProtectedRoute><PageWrapper><PayrollDashboard /></PageWrapper></ProtectedRoute>} />
      <Route path="/payroll/payslip/:id" element={<ProtectedRoute><PageWrapper><Payslip /></PageWrapper></ProtectedRoute>} />

      {/* Recruitment */}
      <Route path="/recruitment" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin', 'HRManager', 'TeamManager']}><RecruitmentBoard /></RoleRoute></PageWrapper></ProtectedRoute>} />
      <Route path="/recruitment/jobs/add" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin', 'HRManager']}><JobForm /></RoleRoute></PageWrapper></ProtectedRoute>} />

      {/* Performance */}
      <Route path="/performance" element={<ProtectedRoute><PageWrapper><PerformanceDashboard /></PageWrapper></ProtectedRoute>} />

      {/* Announcements */}
      <Route path="/announcements" element={<ProtectedRoute><PageWrapper><AnnouncementsPage /></PageWrapper></ProtectedRoute>} />

      {/* Documents */}
      <Route path="/documents" element={<ProtectedRoute><PageWrapper><DocumentsPage /></PageWrapper></ProtectedRoute>} />

      {/* Reports */}
      <Route path="/reports" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin', 'HRManager', 'TeamManager']}><ReportsPage /></RoleRoute></PageWrapper></ProtectedRoute>} />

      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><PageWrapper><RoleRoute allowedRoles={['SuperAdmin']}><SettingsPage /></RoleRoute></PageWrapper></ProtectedRoute>} />

      {/* 404 Fallback */}
      <Route path="*" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes;
