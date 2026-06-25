import React, { useState } from 'react';
import {
  useGetEmployeesQuery,
  useGetAttendanceQuery,
  useGetLeaveApplicationsQuery,
  useGetPayrollReportsQuery
} from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, SlidersHorizontal, BarChart3, Users, Clock, CalendarDays } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('attendance'); // 'attendance' | 'leaves' | 'payroll' | 'employees'

  // Query APIs
  const { data: empData } = useGetEmployeesQuery({ limit: 100 });
  const { data: attendanceData } = useGetAttendanceQuery({ limit: 1000 });
  const { data: leavesData } = useGetLeaveApplicationsQuery();
  const { data: payrollData } = useGetPayrollReportsQuery();

  const handleExportExcel = () => {
    let wsData = [];
    let filename = '';

    if (reportType === 'attendance') {
      if (!attendanceData?.data) return;
      wsData = attendanceData.data.map(log => ({
        'Employee ID': log.employee?.employeeId,
        'Name': log.employee?.fullName,
        'Date': new Date(log.date).toLocaleDateString(),
        'Check In': log.checkIn || '--',
        'Check Out': log.checkOut || '--',
        'Hours': log.totalHours || 0,
        'Status': log.status
      }));
      filename = 'attendance_reporting.xlsx';
    } else if (reportType === 'leaves') {
      if (!leavesData?.data) return;
      wsData = leavesData.data.map(l => ({
        'Name': l.employee?.fullName,
        'Type': l.leaveType,
        'From': new Date(l.fromDate).toLocaleDateString(),
        'To': new Date(l.toDate).toLocaleDateString(),
        'Total Days': l.totalDays,
        'Status': l.status
      }));
      filename = 'leaves_reporting.xlsx';
    } else if (reportType === 'payroll') {
      if (!payrollData?.data) return;
      wsData = payrollData.data;
      filename = 'payroll_closing.xlsx';
    } else {
      if (!empData?.data) return;
      wsData = empData.data.map(e => ({
        'ID': e.employeeId,
        'Name': e.fullName,
        'Email': e.contactInfo?.workEmail,
        'Phone': e.contactInfo?.phone,
        'Designation': e.workInfo?.designation,
        'Department': e.workInfo?.department?.name,
        'Date of Joining': new Date(e.workInfo?.dateOfJoining).toLocaleDateString()
      }));
      filename = 'employees_directory.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
    toast.success('Excel exported successfully');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`HRMS Pro - ${reportType.toUpperCase()} REPORT`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Run Date: ${new Date().toLocaleDateString()}`, 14, 21);

    let tableColumn = [];
    let tableRows = [];

    if (reportType === 'attendance') {
      if (!attendanceData?.data) return;
      tableColumn = ['ID', 'Name', 'Date', 'IN', 'OUT', 'Hours', 'Status'];
      tableRows = attendanceData.data.map(log => [
        log.employee?.employeeId,
        log.employee?.fullName,
        new Date(log.date).toLocaleDateString(),
        log.checkIn || '--',
        log.checkOut || '--',
        log.totalHours || 0,
        log.status
      ]);
    } else if (reportType === 'leaves') {
      if (!leavesData?.data) return;
      tableColumn = ['Name', 'Leave Type', 'From', 'To', 'Days', 'Status'];
      tableRows = leavesData.data.map(l => [
        l.employee?.fullName,
        l.leaveType,
        new Date(l.fromDate).toLocaleDateString(),
        new Date(l.toDate).toLocaleDateString(),
        l.totalDays,
        l.status
      ]);
    } else if (reportType === 'payroll') {
      if (!payrollData?.data) return;
      tableColumn = ['Month', 'Staff Count', 'Gross Pay ($)', 'Deductions ($)', 'Net Payout ($)'];
      tableRows = payrollData.data.map(p => [
        p.period,
        p.employeeCount,
        p.totalGross,
        p.totalDeduction,
        p.totalPayout
      ]);
    } else {
      if (!empData?.data) return;
      tableColumn = ['ID', 'Name', 'Designation', 'Department', 'Joining Date'];
      tableRows = empData.data.map(e => [
        e.employeeId,
        e.fullName,
        e.workInfo?.designation,
        e.workInfo?.department?.name,
        new Date(e.workInfo?.dateOfJoining).toLocaleDateString()
      ]);
    }

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid'
    });

    doc.save(`${reportType}_report.pdf`);
    toast.success('PDF report exported');
  };

  // Aggregate stats charts
  const getAttendanceChartData = () => {
    if (!attendanceData?.data) return [];
    // Count status frequencies
    const map = { Present: 0, WFH: 0, 'Half-day': 0, Absent: 0, Leave: 0 };
    attendanceData.data.forEach(log => {
      if (map[log.status] !== undefined) map[log.status]++;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  };

  const getLeaveChartData = () => {
    if (!leavesData?.data) return [];
    const map = { Casual: 0, Sick: 0, Paid: 0, WFH: 0 };
    leavesData.data.forEach(l => {
      if (l.status === 'Approved' && map[l.leaveType] !== undefined) {
        map[l.leaveType] += l.totalDays;
      }
    });
    return Object.keys(map).map(k => ({ name: k, days: map[k] }));
  };

  const PIE_COLORS = ['#10b981', '#8b5cf6', '#4f9eff', '#f59e0b', '#f43f5e'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight font-sans">Corporate Reports</h1>
          <p className="text-sm text-text-secondary">Export structured timesheet tables and charts for corporate filing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} variant="secondary" icon={Download}>
            Excel Export
          </Button>
          <Button onClick={handleExportPDF} variant="primary" icon={Download} className="font-semibold">
            PDF Report
          </Button>
        </div>
      </div>

      {/* Selector */}
      <Card hover={false} className="border border-white/5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-accent-primary" />
          <span className="text-sm font-semibold">Report Class:</span>
        </div>
        <Select
          options={[
            { label: 'Attendance Reports', value: 'attendance' },
            { label: 'Leaves Usage Reports', value: 'leaves' },
            { label: 'Payroll Payout Closing', value: 'payroll' },
            { label: 'Employee Headcount Roster', value: 'employees' }
          ]}
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="max-w-xs"
        />
      </Card>

      {/* Graphical Chart Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart displays */}
        <Card hover={false} className="md:col-span-2 h-[340px] flex flex-col justify-between border border-white/5 p-6">
          <div>
            <h3 className="text-sm font-semibold text-text-primary capitalize">{reportType} Chart Data View</h3>
            <p className="text-[10px] text-text-secondary">Analytical trends overview</p>
          </div>
          <div className="flex-1 w-full text-xs mt-4">
            {reportType === 'attendance' && (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={getAttendanceChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getAttendanceChartData().map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {reportType === 'leaves' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getLeaveChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                  <Bar dataKey="days" fill="#4f9eff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {reportType === 'payroll' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payrollData?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="period" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                  <Line type="monotone" dataKey="totalPayout" stroke="#10b981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {reportType === 'employees' && (
              <div className="h-full flex items-center justify-center text-text-muted text-xs">
                Employee list view represents the directory headcount structure.
              </div>
            )}
          </div>
        </Card>

        {/* Info panel */}
        <Card hover={false} className="border border-white/5 flex flex-col gap-4 p-6 justify-between h-[340px]">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Corporate Filing Data</h3>
            <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
              Filing reports compile audit metrics. You can export clean spreadsheets and verified PDFs of each report category.
            </p>
          </div>
          <div className="flex flex-col gap-4 border-t border-white/5 pt-4 mt-auto">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-accent-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">Roster Size</span>
                <span className="text-sm font-bold text-text-primary font-mono">{empData?.total || 0} Staff</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-state-success" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">Logged Logs</span>
                <span className="text-sm font-bold text-text-primary font-mono">{attendanceData?.data?.length || 0} Punch logs</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid of details table */}
      <Card hover={false} className="border border-white/5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Closing Data Table</h3>
        {reportType === 'attendance' && (
          <Table
            columns={[
              { header: 'ID', render: (row) => <span className="font-mono text-xs">{row.employee?.employeeId}</span> },
              { header: 'Employee Name', render: (row) => <span className="font-semibold">{row.employee?.fullName}</span> },
              { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
              { header: 'Check In', key: 'checkIn' },
              { header: 'Check Out', key: 'checkOut' },
              { header: 'Total Hours', render: (row) => <span className="font-mono">{row.totalHours || 0} hrs</span> },
              { header: 'Status', render: (row) => <Badge variant={row.status === 'Present' || row.status === 'WFH' ? 'success' : row.status === 'Half-day' ? 'warning' : 'danger'}>{row.status}</Badge> }
            ]}
            data={attendanceData?.data || []}
          />
        )}

        {reportType === 'leaves' && (
          <Table
            columns={[
              { header: 'Employee', render: (row) => <span className="font-semibold">{row.employee?.fullName}</span> },
              { header: 'Leave Type', key: 'leaveType' },
              { header: 'From Date', render: (row) => new Date(row.fromDate).toLocaleDateString() },
              { header: 'To Date', render: (row) => new Date(row.toDate).toLocaleDateString() },
              { header: 'Total Days', render: (row) => <span className="font-mono">{row.totalDays}</span> },
              { header: 'Status', render: (row) => <Badge variant={row.status === 'Approved' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger'}>{row.status}</Badge> }
            ]}
            data={leavesData?.data || []}
          />
        )}

        {reportType === 'payroll' && (
          <Table
            columns={[
              { header: 'Pay Period', key: 'period' },
              { header: 'Employee Count', render: (row) => <span className="font-mono">{row.employeeCount} Staff</span> },
              { header: 'Gross Earnings', render: (row) => <span className="font-mono">${row.totalGross.toLocaleString()}</span> },
              { header: 'Total Deductions', render: (row) => <span className="font-mono text-state-danger">${row.totalDeduction.toLocaleString()}</span> },
              { header: 'Net Corporate Payout', render: (row) => <span className="font-mono text-state-success font-semibold">${row.totalPayout.toLocaleString()}</span> }
            ]}
            data={payrollData?.data || []}
          />
        )}

        {reportType === 'employees' && (
          <Table
            columns={[
              { header: 'ID', render: (row) => <span className="font-mono text-xs">{row.employeeId}</span> },
              { header: 'Name', render: (row) => <span className="font-semibold">{row.fullName}</span> },
              { header: 'Designation', render: (row) => <span>{row.workInfo?.designation}</span> },
              { header: 'Department', render: (row) => <span>{row.workInfo?.department?.name || 'N/A'}</span> },
              { header: 'Joining Date', render: (row) => <span>{new Date(row.workInfo?.dateOfJoining).toLocaleDateString()}</span> }
            ]}
            data={empData?.data || []}
          />
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
