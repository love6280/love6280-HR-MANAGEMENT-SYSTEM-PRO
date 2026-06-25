import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetPayrollDashboardQuery,
  useRunPayrollMutation,
  useUpdatePayrollStatusMutation,
  useGetPayrollReportsQuery,
  useGetPayrollRunsQuery
} from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, Landmark, RefreshCw, CheckCircle, FilePlus2, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PayrollDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [payMonth, setPayMonth] = useState('6'); // June
  const [payYear, setPayYear] = useState('2026');

  const { data: dashboardData, isLoading, refetch } = useGetPayrollDashboardQuery();
  const { data: reportsData } = useGetPayrollReportsQuery();
  const { data: runsData, isLoading: runsLoading } = useGetPayrollRunsQuery({
    month: parseInt(payMonth, 10),
    year: parseInt(payYear, 10),
  });

  const [runPayrollApi, { isLoading: runLoading }] = useRunPayrollMutation();
  const [updateStatusApi, { isLoading: statusLoading }] = useUpdatePayrollStatusMutation();

  const handleRunPayroll = async () => {
    try {
      const res = await runPayrollApi({ month: parseInt(payMonth), year: parseInt(payYear) }).unwrap();
      toast.success(res.message || 'Payroll calculations completed!');
      refetch();
    } catch (err) {
      toast.error('Failed to run payroll.');
    }
  };

  const handleReleasePayroll = async (id) => {
    try {
      await updateStatusApi({ id, status: 'Paid' }).unwrap();
      toast.success('Salary released and email notification sent!');
      refetch();
    } catch (err) {
      toast.error('Failed to release salary.');
    }
  };

  const handleExportExcel = () => {
    if (!reportsData?.data) return toast.error('No reports data available.');
    const ws = XLSX.utils.json_to_sheet(reportsData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Reports');
    XLSX.writeFile(wb, 'payroll_closing_report.xlsx');
  };

  const monthOptions = [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' }
  ];

  const yearOptions = [
    { label: '2026', value: '2026' },
    { label: '2025', value: '2025' }
  ];

  const tabItems = [
    { id: 'summary', label: 'Summary', icon: Wallet },
    { id: 'run', label: 'Process Payroll', icon: FilePlus2 },
    { id: 'reports', label: 'Salary Reports', icon: Landmark }
  ];

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  const {
    statusCounts = {},
    totalPayout = 0,
    percentChange = 0,
    departmentWiseBreakup = [],
    recentRuns = []
  } = dashboardData?.data || {};

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Payroll Administration</h1>
          <p className="text-sm text-text-secondary">Review company payouts, run payroll, and release payslips</p>
        </div>
        {activeTab === 'reports' && (
          <Button onClick={handleExportExcel} variant="secondary" icon={Download}>
            Export Closing Excel
          </Button>
        )}
      </div>

      <Tabs items={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* SUMMARY PANEL */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card hover={false} className="border border-accent-primary/20 shadow-glow flex flex-col justify-between h-28 py-4">
              <span className="text-xs text-text-secondary">Gross Net Payout (This Month)</span>
              <span className="text-2xl font-bold font-mono text-text-primary">${totalPayout.toLocaleString()}</span>
              <span className="text-[10px] text-state-success font-semibold">+{percentChange}% vs last month</span>
            </Card>
            <Card hover={false} className="border border-white/5 flex flex-col justify-between h-28 py-4">
              <span className="text-xs text-text-secondary">Status: Processed / Completed</span>
              <span className="text-2xl font-bold font-mono text-state-success">{statusCounts.processed} Staff</span>
              <span className="text-[10px] text-text-muted">Salary credited successfully</span>
            </Card>
            <Card hover={false} className="border border-white/5 flex flex-col justify-between h-28 py-4">
              <span className="text-xs text-text-secondary">Status: Drafts Pending</span>
              <span className="text-2xl font-bold font-mono text-state-warning">{statusCounts.pending} Staff</span>
              <span className="text-[10px] text-text-muted">Draft calculations prepared</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department wise breakup BarChart */}
            <Card hover={false} className="lg:col-span-2 h-[320px] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Department Breakup</h3>
                <p className="text-[10px] text-text-secondary font-medium">Payout aggregate per department</p>
              </div>
              <div className="flex-1 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentWiseBreakup} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="department" stroke="#475569" />
                    <YAxis stroke="#475569" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent run logs table */}
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Recent Runs</h3>
              <div className="overflow-y-auto max-h-64 divide-y divide-white/5 text-xs pr-1 scrollbar-none">
                {recentRuns.map((run) => (
                  <div key={run._id} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold">{run.employee?.personalInfo?.firstName} {run.employee?.personalInfo?.lastName}</span>
                      <span className="text-[10px] text-text-muted mt-0.5 font-mono">{run.payPeriod}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold font-mono text-state-success">${run.netPay}</span>
                      <Badge variant={run.status === 'Paid' ? 'success' : 'warning'}>{run.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PROCESS PAYROLL PANEL */}
      {activeTab === 'run' && (
        <div className="space-y-6">
          <Card hover={false} className="border border-white/5 p-5 flex flex-col sm:flex-row items-end gap-4">
            <Select
              label="Select Payout Month"
              options={monthOptions}
              value={payMonth}
              onChange={(e) => setPayMonth(e.target.value)}
            />
            <Select
              label="Select Financial Year"
              options={yearOptions}
              value={payYear}
              onChange={(e) => setPayYear(e.target.value)}
            />
            <Button
              onClick={handleRunPayroll}
              loading={runLoading}
              variant="primary"
              icon={RefreshCw}
              className="font-semibold shrink-0"
            >
              Run Calculations
            </Button>
          </Card>

          {/* Grid lists with payroll actions */}
          <Card hover={false} className="border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Payroll processing logs</h3>
            <Table
              loading={runsLoading}
              columns={[
                { header: 'Employee ID', render: (row) => <span className="font-mono text-xs">{row.employee?.employeeId}</span> },
                {
                  header: 'Name',
                  render: (row) => (
                    <span className="font-semibold">
                      {row.employee ? `${row.employee.personalInfo.firstName} ${row.employee.personalInfo.lastName}` : 'N/A'}
                    </span>
                  )
                },
                { header: 'Pay Period', key: 'payPeriod' },
                { header: 'Gross Pay', render: (row) => <span className="font-mono">${row.grossEarnings.toLocaleString()}</span> },
                { header: 'Deductions', render: (row) => <span className="font-mono text-state-danger">${row.totalDeductions.toLocaleString()}</span> },
                { header: 'LOP Days', render: (row) => <span className="font-mono">{row.lopDays} days</span> },
                { header: 'Net Pay', render: (row) => <span className="font-mono text-state-success font-semibold">${row.netPay.toLocaleString()}</span> },
                { header: 'Status', render: (row) => <Badge variant={row.status === 'Paid' ? 'success' : 'warning'}>{row.status}</Badge> },
                {
                  header: 'Release',
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payroll/payslip/${row._id}`)}
                        icon={Download}
                      >
                        Payslip
                      </Button>
                      {row.status === 'Draft' && (
                        <Button
                          onClick={() => handleReleasePayroll(row._id)}
                          loading={statusLoading}
                          variant="primary"
                          size="sm"
                          icon={CheckCircle}
                        >
                          Credit
                        </Button>
                      )}
                    </div>
                  )
                }
              ]}
              data={runsData?.data || []}
            />
          </Card>
        </div>
      )}

      {/* SALARY REPORTS PANEL */}
      {activeTab === 'reports' && (
        <Card hover={false} className="border border-white/5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Closing Monthly Records</h3>
          <Table
            columns={[
              { header: 'Pay Month', key: 'period' },
              { header: 'Employees Paid', render: (row) => <span className="font-mono">{row.employeeCount} Staff</span> },
              { header: 'Total Gross Payout', render: (row) => <span className="font-mono">${row.totalGross.toLocaleString()}</span> },
              { header: 'Total Deductions Deducted', render: (row) => <span className="font-mono text-state-danger">${row.totalDeduction.toLocaleString()}</span> },
              { header: 'Net Corporate Payout', render: (row) => <span className="font-mono text-state-success font-semibold">${row.totalPayout.toLocaleString()}</span> }
            ]}
            data={reportsData?.data || []}
          />
        </Card>
      )}
    </div>
  );
};

export default PayrollDashboard;
