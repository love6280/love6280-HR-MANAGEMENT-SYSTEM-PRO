import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetEmployeeByIdQuery,
  useUploadDocumentMutation,
  useGetLeaveBalanceQuery
} from '../../services/api';
import {
  User, Calendar, FileText, ClipboardList, Wallet, FilePlus,
  ArrowLeft, Download, ShieldCheck, Mail, Phone, CalendarRange
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import CalendarHeatmap from '../../components/ui/CalendarHeatmap';
import FileUpload from '../../components/ui/FileUpload';
import toast from 'react-hot-toast';
import ProgressBar from '../../components/ui/ProgressBar';

const EmployeeProfile = () => {
  const { id } = useParams();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  
  // Default to logged-in user employee profile if no ID is passed in path
  const targetId = id || user?.employee?._id;

  const [activeTab, setActiveTab] = useState('overview');
  const { data: profileResult, isLoading, refetch } = useGetEmployeeByIdQuery(targetId, {
    skip: !targetId
  });

  const { data: leaveBalance } = useGetLeaveBalanceQuery(targetId, {
    skip: !targetId
  });

  const [uploadDocApi, { isLoading: uploadLoading }] = useUploadDocumentMutation();

  const handleUploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'Resume'); // default for now, HR can verify and set it

    try {
      await uploadDocApi(formData).unwrap();
      toast.success('Document uploaded successfully!');
      refetch();
    } catch (err) {
      toast.error('Document upload failed.');
    }
  };

  if (isLoading || !profileResult?.data) {
    return <LoadingSkeleton type="list" />;
  }

  const { employee, leaves = [], attendance = [], payslips = [], reviews = [] } = profileResult.data;

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'leaves', label: 'Leaves', icon: CalendarRange },
    { id: 'documents', label: 'Documents', icon: FilePlus },
    { id: 'payslips', label: 'Payslips', icon: Wallet },
    { id: 'performance', label: 'Performance', icon: ClipboardList }
  ];

  // Helper to parse dates
  const formatDateStr = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  // Calculate attendance rate (percentage of Present days)
  const totalLogs = attendance.length;
  const presentLogs = attendance.filter(a => a.status === 'Present' || a.status === 'WFH').length;
  const attendanceRate = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/employees')}
          className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-lg transition-colors border border-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Employee Folder</h1>
          <p className="text-sm text-text-secondary">View detailed personal, payroll, and work records</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card hover={false} className="border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-6 py-6">
        <Avatar src={employee.personalInfo.photo} name={employee.fullName} size="lg" className="h-20 w-20 border-white/10" />
        
        <div className="flex-1 flex flex-col gap-1.5 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary">{employee.fullName}</h2>
            <Badge variant={employee.isActive ? 'success' : 'danger'} className="w-fit mx-auto md:mx-0">
              {employee.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <span className="text-xs text-accent-primary font-semibold font-mono">{employee.employeeId}</span>
          <span className="text-sm text-text-secondary font-medium">{employee.workInfo.designation} — {employee.workInfo.department?.name || 'Unassigned'}</span>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-3 text-xs text-text-secondary font-medium">
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-text-muted" />{employee.contactInfo.workEmail}</span>
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-text-muted" />{employee.contactInfo.phone}</span>
          </div>
        </div>

        {/* Overview Stats Quick widget */}
        <div className="grid grid-cols-3 gap-4 border-l border-white/10 pl-6 shrink-0">
          <div className="flex flex-col text-center md:text-left">
            <span className="text-[10px] text-text-secondary uppercase">Attendance</span>
            <span className="text-lg font-bold text-state-success font-mono">{attendanceRate}%</span>
          </div>
          <div className="flex flex-col text-center md:text-left">
            <span className="text-[10px] text-text-secondary uppercase">Leaves Taken</span>
            <span className="text-lg font-bold text-accent-primary font-mono">
              {leaveBalance ? leaveBalance.paid.used + leaveBalance.sick.used + leaveBalance.casual.used : 0}
            </span>
          </div>
          <div className="flex flex-col text-center md:text-left">
            <span className="text-[10px] text-text-secondary uppercase">Reviews</span>
            <span className="text-lg font-bold text-accent-secondary font-mono">
              {reviews[0]?.overallRating || 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Personal Details */}
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-text-secondary">Gender</p>
                  <p className="font-semibold mt-0.5">{employee.personalInfo.gender}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Date of Birth</p>
                  <p className="font-semibold mt-0.5">{formatDateStr(employee.personalInfo.dob)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Marital Status</p>
                  <p className="font-semibold mt-0.5">{employee.personalInfo.maritalStatus || 'Single'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Blood Group</p>
                  <p className="font-semibold mt-0.5">{employee.personalInfo.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Aadhaar Number</p>
                  <p className="font-semibold mt-0.5 font-mono">{employee.personalInfo.aadhaar || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">PAN Number</p>
                  <p className="font-semibold mt-0.5 font-mono">{employee.personalInfo.pan || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Employment details */}
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Employment Information</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-text-secondary">Employment Type</p>
                  <p className="font-semibold mt-0.5">{employee.workInfo.employmentType}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Date of Joining</p>
                  <p className="font-semibold mt-0.5">{formatDateStr(employee.workInfo.dateOfJoining)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Work Location</p>
                  <p className="font-semibold mt-0.5">{employee.workInfo.workLocation || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Reporting Manager</p>
                  <p className="font-semibold mt-0.5 text-accent-primary">
                    {employee.workInfo.reportingManager ? `${employee.workInfo.reportingManager.personalInfo.firstName} ${employee.workInfo.reportingManager.personalInfo.lastName}` : 'No reporting manager'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-secondary">Address</p>
                  <p className="font-semibold mt-0.5 leading-relaxed">
                    {employee.contactInfo.address
                      ? `${employee.contactInfo.address.street}, ${employee.contactInfo.address.city}, ${employee.contactInfo.address.state} - ${employee.contactInfo.address.pin}, ${employee.contactInfo.address.country}`
                      : 'Address details not set'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ATTENDANCE PANEL */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Heatmap calendar */}
            <Card hover={false} className="lg:col-span-2 border border-white/5 p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Attendance Calendar</h3>
              <CalendarHeatmap data={attendance.map(a => ({ date: a.date, status: a.status }))} />
            </Card>

            {/* Attendance logs table */}
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Recent Logs</h3>
              <div className="overflow-y-auto max-h-[300px] divide-y divide-white/5 text-xs pr-1 scrollbar-none">
                {attendance.slice(0, 15).map((log, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="text-[10px] text-text-muted mt-0.5 font-mono">{log.checkIn || '--'} to {log.checkOut || '--'}</span>
                    </div>
                    <Badge variant={log.status === 'Present' || log.status === 'WFH' ? 'success' : log.status === 'Half-day' ? 'warning' : 'danger'}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* LEAVES PANEL */}
        {activeTab === 'leaves' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Leave Balance Circular / Progress Cards */}
            {leaveBalance && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
                  <span className="text-[10px] text-text-secondary uppercase">Casual Leave</span>
                  <span className="text-2xl font-bold font-mono">{leaveBalance.casual.remaining} / {leaveBalance.casual.total}</span>
                  <ProgressBar value={leaveBalance.casual.used} max={leaveBalance.casual.total} color="blue" />
                </Card>
                <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
                  <span className="text-[10px] text-text-secondary uppercase">Sick Leave</span>
                  <span className="text-2xl font-bold font-mono">{leaveBalance.sick.remaining} / {leaveBalance.sick.total}</span>
                  <ProgressBar value={leaveBalance.sick.used} max={leaveBalance.sick.total} color="green" />
                </Card>
                <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
                  <span className="text-[10px] text-text-secondary uppercase">Paid Leave</span>
                  <span className="text-2xl font-bold font-mono">{leaveBalance.paid.remaining} / {leaveBalance.paid.total}</span>
                  <ProgressBar value={leaveBalance.paid.used} max={leaveBalance.paid.total} color="purple" />
                </Card>
                <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
                  <span className="text-[10px] text-text-secondary uppercase">WFH Allocation</span>
                  <span className="text-2xl font-bold font-mono">{leaveBalance.wfh.remaining} / {leaveBalance.wfh.total}</span>
                  <ProgressBar value={leaveBalance.wfh.used} max={leaveBalance.wfh.total} color="amber" />
                </Card>
              </div>
            )}

            {/* Leave applications table */}
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Leave Request History</h3>
              <Table
                columns={[
                  { header: 'Type', key: 'leaveType' },
                  { header: 'From Date', render: (row) => formatDateStr(row.fromDate) },
                  { header: 'To Date', render: (row) => formatDateStr(row.toDate) },
                  { header: 'Days', render: (row) => <span className="font-mono">{row.totalDays}</span> },
                  { header: 'Reason', key: 'reason' },
                  {
                    header: 'Status',
                    render: (row) => (
                      <Badge variant={row.status === 'Approved' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger'}>
                        {row.status}
                      </Badge>
                    )
                  }
                ]}
                data={leaves}
              />
            </Card>
          </div>
        )}

        {/* DOCUMENTS PANEL */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Upload Zone */}
            <Card hover={false} className="border border-white/5 flex flex-col gap-4 h-fit">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Upload Document</h3>
              <FileUpload onUpload={handleUploadDocument} loading={uploadLoading} />
            </Card>

            {/* Document list */}
            <Card hover={false} className="md:col-span-2 border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Uploaded Documents</h3>
              <Table
                columns={[
                  { header: 'Document Type', key: 'type' },
                  { header: 'Filename', key: 'name' },
                  {
                    header: 'Size',
                    render: (row) => <span className="font-mono text-xs text-text-secondary">{((row.fileSize || 0) / 1024).toFixed(1)} KB</span>
                  },
                  {
                    header: 'Status',
                    render: (row) => (
                      <Badge variant={row.verificationStatus === 'Verified' ? 'success' : row.verificationStatus === 'Pending' ? 'warning' : 'danger'}>
                        {row.verificationStatus}
                      </Badge>
                    )
                  },
                  {
                    header: 'Action',
                    render: (row) => (
                      <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    )
                  }
                ]}
                data={employee.documents || []}
              />
            </Card>
          </div>
        )}

        {/* PAYSLIPS PANEL */}
        {activeTab === 'payslips' && (
          <Card hover={false} className="border border-white/5 flex flex-col gap-4 animate-fade-in">
            <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Monthly Payslips</h3>
            <Table
              columns={[
                { header: 'Pay Period', key: 'payPeriod' },
                { header: 'Gross Earnings', render: (row) => <span className="font-mono">${row.grossEarnings.toLocaleString()}</span> },
                { header: 'Total Deductions', render: (row) => <span className="font-mono">${row.totalDeductions.toLocaleString()}</span> },
                { header: 'Net Payout', render: (row) => <span className="font-mono text-state-success font-semibold">${row.netPay.toLocaleString()}</span> },
                {
                  header: 'Actions',
                  render: (row) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/payroll/payslip/${row._id}`)}
                      icon={Download}
                    >
                      View Payslip
                    </Button>
                  )
                }
              ]}
              data={payslips}
            />
          </Card>
        )}

        {/* PERFORMANCE PANEL */}
        {activeTab === 'performance' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Evaluation History</h3>
              <Table
                columns={[
                  { header: 'Review Cycle', key: 'reviewCycle' },
                  { header: 'Period', render: (row) => `${formatDateStr(row.period?.start)} - ${formatDateStr(row.period?.end)}` },
                  {
                    header: 'Overall Rating',
                    render: (row) => <span className="font-mono text-state-warning font-semibold">{row.overallRating} / 5.0</span>
                  },
                  {
                    header: 'Status',
                    render: (row) => (
                      <Badge variant={row.status === 'Completed' ? 'success' : 'warning'}>
                        {row.status}
                      </Badge>
                    )
                  }
                ]}
                data={reviews}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
