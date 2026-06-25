import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetLeaveBalanceQuery,
  useApplyLeaveMutation,
  useGetLeaveApplicationsQuery,
  useApproveRejectLeaveMutation,
  useGetTodayOnLeaveQuery,
  useGetLeaveCalendarQuery
} from '../../services/api';
import { CalendarRange, Plus, CheckSquare, XSquare, Clock, CalendarDays } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ProgressBar from '../../components/ui/ProgressBar';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const LeaveDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  
  const [leaveType, setLeaveType] = useState('Casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('AM');
  const [reason, setReason] = useState('');

  const [reviewId, setReviewId] = useState('');
  const [comment, setComment] = useState('');

  const { data: balanceData, refetch: refetchBalance } = useGetLeaveBalanceQuery(user?.employee?._id, {
    skip: !user?.employee?._id,
  });

  const { data: leavesData, refetch: refetchLeaves } = useGetLeaveApplicationsQuery();
  const { data: onLeaveToday } = useGetTodayOnLeaveQuery();

  const [applyLeaveApi, { isLoading: applyLoading }] = useApplyLeaveMutation();
  const [approveRejectApi, { isLoading: approveLoading }] = useApproveRejectLeaveMutation();

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) return toast.error('Please specify dates.');
    if (!reason) return toast.error('Please specify leave reason.');

    try {
      await applyLeaveApi({
        leaveType,
        fromDate,
        toDate,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : undefined,
        reason,
      }).unwrap();

      toast.success('Leave applied successfully!');
      setIsModalOpen(false);
      refetchLeaves();
      refetchBalance();
      
      // Reset form
      setFromDate('');
      setToDate('');
      setReason('');
      setIsHalfDay(false);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to submit leave application.');
    }
  };

  const handleOpenReview = (id) => {
    setReviewId(id);
    setComment('');
    setIsApproveOpen(true);
  };

  const handleApproveReject = async (status) => {
    try {
      await approveRejectApi({
        id: reviewId,
        status,
        comments: comment,
      }).unwrap();

      toast.success(`Leave application ${status.toLowerCase()}!`);
      setIsApproveOpen(false);
      refetchLeaves();
      refetchBalance();
    } catch (err) {
      toast.error('Failed to submit decision.');
    }
  };

  const formatDateStr = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const myLeaves = leavesData?.data.filter(l => l.employee?._id === user?.employee?._id) || [];
  const teamLeaves = leavesData?.data.filter(l => l.employee?._id !== user?.employee?._id && l.status === 'Pending') || [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Leave Dashboard</h1>
          <p className="text-sm text-text-secondary">Request leaves, review allocation balances, and view approvals</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          icon={Plus}
          className="font-semibold"
        >
          Apply Leave
        </Button>
      </div>

      {/* Leave balance cards */}
      {balanceData?.data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
            <span className="text-[10px] text-text-secondary uppercase">Casual Leave</span>
            <span className="text-2xl font-bold font-mono">{balanceData.data.casual.remaining} / {balanceData.data.casual.total}</span>
            <ProgressBar value={balanceData.data.casual.used} max={balanceData.data.casual.total} color="blue" />
          </Card>
          <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
            <span className="text-[10px] text-text-secondary uppercase">Sick Leave</span>
            <span className="text-2xl font-bold font-mono">{balanceData.data.sick.remaining} / {balanceData.data.sick.total}</span>
            <ProgressBar value={balanceData.data.sick.used} max={balanceData.data.sick.total} color="green" />
          </Card>
          <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
            <span className="text-[10px] text-text-secondary uppercase">Paid Leave</span>
            <span className="text-2xl font-bold font-mono">{balanceData.data.paid.remaining} / {balanceData.data.paid.total}</span>
            <ProgressBar value={balanceData.data.paid.used} max={balanceData.data.paid.total} color="purple" />
          </Card>
          <Card hover={false} className="border border-white/5 py-4 text-center flex flex-col gap-2">
            <span className="text-[10px] text-text-secondary uppercase">WFH Allocation</span>
            <span className="text-2xl font-bold font-mono">{balanceData.data.wfh.remaining} / {balanceData.data.wfh.total}</span>
            <ProgressBar value={balanceData.data.wfh.used} max={balanceData.data.wfh.total} color="amber" />
          </Card>
        </div>
      )}

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 60%: Leave Applications List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card hover={false} className="border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">My Applications</h3>
            <Table
              columns={[
                { header: 'Leave Type', key: 'leaveType' },
                { header: 'From Date', render: (row) => formatDateStr(row.fromDate) },
                { header: 'To Date', render: (row) => formatDateStr(row.toDate) },
                { header: 'Days', render: (row) => <span className="font-mono">{row.totalDays}</span> },
                { header: 'Status', render: (row) => <Badge variant={row.status === 'Approved' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger'}>{row.status}</Badge> }
              ]}
              data={myLeaves}
            />
          </Card>

          {/* Pending approvals for Manager/HR */}
          {user?.role !== 'Employee' && (
            <Card hover={false} className="border border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Pending Approvals</h3>
              <Table
                columns={[
                  { header: 'Employee', render: (row) => <span className="font-semibold">{row.employee?.fullName}</span> },
                  { header: 'Type', key: 'leaveType' },
                  { header: 'Range', render: (row) => `${formatDateStr(row.fromDate)} - ${formatDateStr(row.toDate)}` },
                  { header: 'Days', render: (row) => <span className="font-mono">{row.totalDays}</span> },
                  { header: 'Reason', key: 'reason' },
                  {
                    header: 'Action',
                    render: (row) => (
                      <Button
                        onClick={() => handleOpenReview(row._id)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-accent-primary"
                        icon={Clock}
                      >
                        Review
                      </Button>
                    )
                  }
                ]}
                data={teamLeaves}
              />
            </Card>
          )}
        </div>

        {/* Right 40%: On leave today & upcoming calendars */}
        <div className="flex flex-col gap-6">
          {/* On leave today stack */}
          <Card hover={false} className="border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Out of Office Today</h3>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-60 pr-1 scrollbar-none">
              {onLeaveToday?.data && onLeaveToday.data.length > 0 ? (
                onLeaveToday.data.map((l) => (
                  <div key={l._id} className="flex items-center gap-3">
                    <Avatar src={l.employee?.personalInfo?.photo} name={l.employee?.fullName} size="sm" />
                    <div className="flex-1 flex flex-col">
                      <span className="text-xs font-semibold text-text-primary">{l.employee?.fullName}</span>
                      <span className="text-[10px] text-text-secondary">{l.employee?.workInfo?.designation}</span>
                    </div>
                    <Badge variant="neutral">{l.leaveType}</Badge>
                  </div>
                ))
              ) : (
                <span className="text-xs text-text-muted text-center py-6">All staff present today</span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <Select
            label="Leave Type *"
            options={[
              { label: 'Casual Leave', value: 'Casual' },
              { label: 'Sick Leave', value: 'Sick' },
              { label: 'Paid Leave', value: 'Paid' },
              { label: 'Work From Home (WFH)', value: 'WFH' }
            ]}
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date *"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
            <Input
              label="To Date *"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="rounded bg-white/5 border-white/10 text-accent-primary h-4 w-4"
              />
              <span>Apply for Half Day</span>
            </label>
            
            {isHalfDay && (
              <Select
                options={[
                  { label: 'AM (First Half)', value: 'AM' },
                  { label: 'PM (Second Half)', value: 'PM' }
                ]}
                value={halfDayType}
                onChange={(e) => setHalfDayType(e.target.value)}
                className="py-1 px-2 text-xs"
              />
            )}
          </div>

          <Input
            label="Reason for Leave *"
            placeholder="Please detail the reason for leave request"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={applyLoading} variant="primary" className="font-semibold">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Approval Modal */}
      <Modal isOpen={isApproveOpen} onClose={() => setIsApproveOpen(false)} title="Review Leave Application">
        <div className="space-y-4">
          <Input
            label="Reviewer Comments"
            placeholder="Provide any context or instructions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleApproveReject('Rejected')}
              loading={approveLoading}
              variant="danger"
            >
              Reject
            </Button>
            <Button
              onClick={() => handleApproveReject('Approved')}
              loading={approveLoading}
              variant="primary"
              className="font-semibold"
            >
              Approve Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveDashboard;
