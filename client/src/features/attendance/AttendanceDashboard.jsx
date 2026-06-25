import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useRegularizeAttendanceMutation,
  useGetAttendanceSummaryQuery
} from '../../services/api';
import { Clock, CheckSquare, XCircle, AlertCircle, FilePlus, CalendarCheck2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CalendarHeatmap from '../../components/ui/CalendarHeatmap';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const AttendanceDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [time, setTime] = useState(new Date());
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('09:00');
  const [reqCheckOut, setReqCheckOut] = useState('18:00');
  const [reqReason, setReqReason] = useState('');

  const { data: attendanceData, refetch } = useGetAttendanceQuery({
    employeeId: user?.employee?._id,
    startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
    endDate: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
  }, { skip: !user?.employee?._id });

  const { data: summaryData } = useGetAttendanceSummaryQuery({
    employeeId: user?.employee?._id,
    month: currentMonth,
    year: currentYear
  }, { skip: !user?.employee?._id });

  const [checkInApi, { isLoading: checkInLoading }] = useCheckInMutation();
  const [checkOutApi, { isLoading: checkOutLoading }] = useCheckOutMutation();
  const [regularizeApi, { isLoading: regLoading }] = useRegularizeAttendanceMutation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayRecord = attendanceData?.data.find(r => {
    const logDate = new Date(r.date).toISOString().split('T')[0];
    return logDate === todayStr;
  });

  const handleClockIn = async () => {
    try {
      await checkInApi({ wfh: false }).unwrap();
      toast.success('Clocked in successfully!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await checkOutApi().unwrap();
      toast.success('Clocked out successfully!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to clock out');
    }
  };

  const handleOpenRegularize = (log) => {
    setSelectedLogId(log._id);
    setReqCheckIn(log.checkIn || '09:00');
    setReqCheckOut(log.checkOut || '18:00');
    setReqReason('');
    setIsModalOpen(true);
  };

  const handleSubmitRegularize = async (e) => {
    e.preventDefault();
    if (!reqReason) return toast.error('Please input a reason for correction.');

    try {
      await regularizeApi({
        id: selectedLogId,
        checkIn: `${reqCheckIn}:00`,
        checkOut: `${reqCheckOut}:00`,
        reason: reqReason
      }).unwrap();

      toast.success('Correction request submitted!');
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to submit request.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Attendance</h1>
        <p className="text-sm text-text-secondary font-medium">Clock check-ins, record working hours, and request corrections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock In / Out widget */}
        <Card hover={false} className="border border-white/5 flex flex-col justify-between items-center py-8 h-[280px]">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Current System Time</span>
            <div className="flex items-center gap-2 text-3xl font-extrabold font-mono text-accent-primary drop-shadow-[0_0_10px_rgba(79,158,255,0.3)]">
              <Clock className="h-6 w-6" />
              <span>{time.toLocaleTimeString()}</span>
            </div>
            <span className="text-[10px] text-text-muted mt-1 font-mono">{time.toDateString()}</span>
          </div>

          <div className="flex items-center gap-4 w-full justify-center">
            {!todayRecord?.checkIn ? (
              <Button
                onClick={handleClockIn}
                loading={checkInLoading}
                variant="primary"
                size="lg"
                className="w-40 font-bold tracking-wide"
              >
                CLOCK IN
              </Button>
            ) : !todayRecord?.checkOut ? (
              <Button
                onClick={handleClockOut}
                loading={checkOutLoading}
                variant="danger"
                size="lg"
                className="w-40 font-bold tracking-wide"
              >
                CLOCK OUT
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-state-success font-bold">Today Completed!</span>
                <span className="text-[10px] text-text-secondary">IN: {todayRecord.checkIn} | OUT: {todayRecord.checkOut}</span>
              </div>
            )}
          </div>

          {/* Today Summary */}
          {todayRecord && (
            <div className="flex gap-4 text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-2 border-t border-white/5 pt-3 w-full justify-center">
              <span>Work Time: <span className="text-text-primary font-mono">{todayRecord.totalHours || 0} hrs</span></span>
              <span>Status: <span className="text-text-primary">{todayRecord.status}</span></span>
            </div>
          )}
        </Card>

        {/* Monthly Summary counters */}
        <Card hover={false} className="lg:col-span-2 border border-white/5 flex flex-col gap-4 h-[280px]">
          <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Summary this Month</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-auto">
            <div className="p-4 rounded-xl bg-state-success/5 border border-state-success/15 flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-state-success" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">Present / WFH</span>
                <span className="text-xl font-bold font-mono text-state-success">
                  {summaryData?.data ? (summaryData.data.Present || 0) + (summaryData.data.WFH || 0) : 0}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-state-warning/5 border border-state-warning/15 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-state-warning" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">Half Days</span>
                <span className="text-xl font-bold font-mono text-state-warning">
                  {summaryData?.data ? summaryData.data['Half-day'] || 0 : 0}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-state-danger/5 border border-state-danger/15 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-state-danger" />
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary">Absences</span>
                <span className="text-xl font-bold font-mono text-state-danger">
                  {summaryData?.data ? summaryData.data.Absent || 0 : 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Heatmap & Regularization triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card hover={false} className="lg:col-span-2 border border-white/5 p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Monthly Heatmap Grid</h3>
          <CalendarHeatmap data={attendanceData?.data.map(r => ({ date: r.date, status: r.status })) || []} />
        </Card>

        {/* Action list for missed check-ins */}
        <Card hover={false} className="border border-white/5 flex flex-col gap-4">
          <div className="border-b border-white/5 pb-2 flex items-center gap-1.5 text-text-primary font-semibold">
            <CalendarCheck2 className="h-4.5 w-4.5" />
            <h3>Log Corrections</h3>
          </div>
          <div className="overflow-y-auto max-h-[300px] divide-y divide-white/5 text-xs pr-1 scrollbar-none">
            {attendanceData?.data.filter(log => log.status === 'Absent' || log.status === 'Half-day').slice(0, 10).map((log, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold">{new Date(log.date).toLocaleDateString()}</span>
                  <span className="text-[9px] text-text-muted font-mono">{log.status}</span>
                </div>
                {log.regularizationRequest?.requested ? (
                  <Badge variant="warning">Pending</Badge>
                ) : (
                  <Button
                    onClick={() => handleOpenRegularize(log)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-accent-primary"
                    icon={FilePlus}
                  >
                    Correct
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Correction Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Attendance Correction Request">
        <form onSubmit={handleSubmitRegularize} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Request Check-in Time"
              type="time"
              value={reqCheckIn}
              onChange={(e) => setReqCheckIn(e.target.value)}
              required
            />
            <Input
              label="Request Check-out Time"
              type="time"
              value={reqCheckOut}
              onChange={(e) => setReqCheckOut(e.target.value)}
              required
            />
          </div>

          <Input
            label="Reason for Regularization *"
            placeholder="e.g. Forgot to punch check-in while rushing for team sync"
            value={reqReason}
            onChange={(e) => setReqReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={regLoading} variant="primary" className="font-semibold">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceDashboard;
