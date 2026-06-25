import React, { useState } from 'react';
import {
  useGetAttendanceQuery,
  useApproveRegularizationMutation,
  useBulkImportAttendanceMutation,
  useGetEmployeesQuery,
  useGetDepartmentsQuery
} from '../../services/api';
import { Download, Upload, SlidersHorizontal, CheckSquare, XSquare, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AttendanceManagement = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const { data: deptData } = useGetDepartmentsQuery();
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const { data: attendanceData, isLoading, refetch } = useGetAttendanceQuery({
    startDate,
    endDate,
    status: statusFilter,
    department: deptFilter,
  });

  const [approveReg] = useApproveRegularizationMutation();
  const [bulkImport] = useBulkImportAttendanceMutation();

  const handleApproveCorrection = async (id, status) => {
    try {
      await approveReg({ id, status }).unwrap();
      toast.success(`Correction request ${status.toLowerCase()}!`);
      refetch();
    } catch (err) {
      toast.error('Failed to update correction.');
    }
  };

  // Import Excel sheet
  const handleExcelImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws); // Expecting columns: employeeId, date, checkIn, checkOut, status
        
        await bulkImport({ logs: data }).unwrap();
        toast.success(`Imported ${data.length} logs successfully!`);
        refetch();
      } catch (err) {
        toast.error('Failed to parse or upload attendance excel.');
      } finally {
        setImportLoading(false);
        setIsModalOpen(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!attendanceData?.data || attendanceData.data.length === 0) {
      return toast.error('No data to export');
    }
    const exportData = attendanceData.data.map(log => ({
      'Employee ID': log.employee?.employeeId,
      'Name': log.employee ? `${log.employee.personalInfo.firstName} ${log.employee.personalInfo.lastName}` : 'N/A',
      'Date': new Date(log.date).toLocaleDateString(),
      'Check In': log.checkIn || '--',
      'Check Out': log.checkOut || '--',
      'Hours Worked': log.totalHours || 0,
      'Status': log.status,
      'Late': log.isLate ? 'YES' : 'NO',
      'Early Departure': log.isEarlyDeparture ? 'YES' : 'NO',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `attendance_report_${startDate}_to_${endDate}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!attendanceData?.data || attendanceData.data.length === 0) {
      return toast.error('No data to export');
    }
    const doc = new jsPDF();
    doc.text('HRMS Pro - Attendance Report', 14, 15);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);

    const tableColumn = ['ID', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'];
    const tableRows = attendanceData.data.map(log => [
      log.employee?.employeeId || 'N/A',
      log.employee ? `${log.employee.personalInfo.firstName} ${log.employee.personalInfo.lastName}` : 'N/A',
      new Date(log.date).toLocaleDateString(),
      log.checkIn || '--',
      log.checkOut || '--',
      log.totalHours || 0,
      log.status,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
    });
    doc.save(`attendance_report_${startDate}_to_${endDate}.pdf`);
  };

  const columns = [
    { header: 'Employee ID', render: (row) => <span className="font-mono text-xs">{row.employee?.employeeId}</span> },
    {
      header: 'Employee Name',
      render: (row) => (
        <span className="font-semibold">
          {row.employee ? `${row.employee.personalInfo.firstName} ${row.employee.personalInfo.lastName}` : 'Deleted Employee'}
        </span>
      )
    },
    { header: 'Date', render: (row) => formatDateStr(row.date) },
    {
      header: 'Check In',
      render: (row) => (
        <span className={row.isLate ? 'text-state-warning font-semibold' : ''}>
          {row.checkIn || '--'} {row.isLate && '⚠️'}
        </span>
      )
    },
    {
      header: 'Check Out',
      render: (row) => (
        <span className={row.isEarlyDeparture ? 'text-state-warning font-semibold' : ''}>
          {row.checkOut || '--'} {row.isEarlyDeparture && '🕒'}
        </span>
      )
    },
    { header: 'Hours', render: (row) => <span className="font-mono">{row.totalHours || 0} hrs</span> },
    { header: 'Status', render: (row) => <Badge variant={row.status === 'Present' || row.status === 'WFH' ? 'success' : row.status === 'Half-day' ? 'warning' : 'danger'}>{row.status}</Badge> },
    {
      header: 'Correction Request',
      render: (row) => {
        if (!row.regularizationRequest?.requested) return <span className="text-text-muted">-</span>;
        return (
          <div className="flex flex-col gap-1 text-[11px] bg-white/5 p-2 rounded border border-white/5">
            <span className="font-semibold text-text-primary">Reason: {row.regularizationRequest.reason}</span>
            <span className="text-[10px] text-accent-primary">Requested: {row.regularizationRequest.checkIn} - {row.regularizationRequest.checkOut}</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                onClick={() => handleApproveCorrection(row._id, 'Approved')}
                className="flex items-center gap-0.5 px-2 py-0.5 bg-state-success/15 border border-state-success/20 text-state-success rounded"
              >
                <CheckSquare className="h-3 w-3" /> Approve
              </button>
              <button
                onClick={() => handleApproveCorrection(row._id, 'Rejected')}
                className="flex items-center gap-0.5 px-2 py-0.5 bg-state-danger/15 border border-state-danger/20 text-state-danger rounded"
              >
                <XSquare className="h-3 w-3" /> Reject
              </button>
            </div>
          </div>
        );
      }
    }
  ];

  const formatDateStr = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...(deptData?.data || []).map(d => ({ label: d.name, value: d._id }))
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Present', value: 'Present' },
    { label: 'WFH', value: 'WFH' },
    { label: 'Half-day', value: 'Half-day' },
    { label: 'Absent', value: 'Absent' },
    { label: 'Leave', value: 'Leave' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Manage Attendance</h1>
          <p className="text-sm text-text-secondary">Verify employee timesheets, approve regularizations, and upload bulk logs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)} variant="secondary" icon={Upload}>
            Import Excel
          </Button>
          <Button onClick={exportToExcel} variant="secondary" icon={Download}>
            Export Excel
          </Button>
          <Button onClick={exportToPDF} variant="secondary" icon={Download}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card hover={false} className="border border-white/5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Select
            label="Department"
            options={deptOptions}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Data Table */}
      <Table
        columns={columns}
        data={attendanceData?.data || []}
        loading={isLoading}
      />

      {/* Excel Import Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Import Attendance Log">
        <div className="flex flex-col gap-4 py-2">
          <p className="text-xs text-text-secondary">
            Upload an Excel spreadsheet containing columns: <code className="text-accent-primary bg-white/5 px-1 py-0.5 rounded font-mono">employeeId</code>,{' '}
            <code className="text-accent-primary bg-white/5 px-1 py-0.5 rounded font-mono">date</code>,{' '}
            <code className="text-accent-primary bg-white/5 px-1 py-0.5 rounded font-mono">checkIn</code>,{' '}
            <code className="text-accent-primary bg-white/5 px-1 py-0.5 rounded font-mono">checkOut</code>, and{' '}
            <code className="text-accent-primary bg-white/5 px-1 py-0.5 rounded font-mono">status</code>.
          </p>

          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent-primary transition-all relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={importLoading}
            />
            <Upload className="h-10 w-10 text-text-secondary" />
            <span className="text-xs text-text-secondary font-medium">
              {importLoading ? 'Uploading and parsing data...' : 'Click to select and upload spreadsheet'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceManagement;
