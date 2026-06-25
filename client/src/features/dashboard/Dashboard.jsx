import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetDashboardMetricsQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useGetAttendanceQuery
} from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
  Users, CalendarCheck, CalendarOff, Briefcase, Plus,
  Clock, PlusSquare, Receipt, ArrowRight, Gift, Megaphone, Activity
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: metricsData, isLoading, refetch } = useGetDashboardMetricsQuery();
  const [checkInApi, { isLoading: checkInLoading }] = useCheckInMutation();
  const [checkOutApi, { isLoading: checkOutLoading }] = useCheckOutMutation();
  
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceLogs } = useGetAttendanceQuery({
    employeeId: user?.employee?._id,
    startDate: today,
    endDate: today,
  }, { skip: !user?.employee?._id });

  const todayLog = attendanceLogs && attendanceLogs.data[0];

  const handleCheckIn = async () => {
    try {
      await checkInApi({ wfh: false }).unwrap();
      toast.success('Successfully checked in!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutApi().unwrap();
      toast.success('Successfully checked out!');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Check-out failed.');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="card" />;
  }

  const {
    metrics,
    headcountTrend = [],
    deptDistribution = [],
    attendanceThisWeek = [],
    leaveStatusDist = [],
    recentActivities = [],
    birthdays = [],
    announcements = [],
  } = metricsData?.data || {};

  const PIE_COLORS = ['#10b981', '#8b5cf6', '#4f9eff', '#f59e0b', '#f43f5e'];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome header & clock-in / quick options */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            Welcome back, {user?.employee?.personalInfo?.firstName || 'Administrator'}!
          </p>
        </div>

        {/* Check-in Widget / Quick Actions */}
        <div className="flex items-center gap-3">
          {user?.role === 'Employee' && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl p-2 px-3">
              <Clock className="h-4.5 w-4.5 text-accent-primary" />
              <span className="text-xs font-medium text-text-secondary">Today:</span>
              {!todayLog?.checkIn ? (
                <Button
                  onClick={handleCheckIn}
                  loading={checkInLoading}
                  variant="primary"
                  size="sm"
                >
                  Clock In
                </Button>
              ) : !todayLog?.checkOut ? (
                <Button
                  onClick={handleCheckOut}
                  loading={checkOutLoading}
                  variant="danger"
                  size="sm"
                >
                  Clock Out
                </Button>
              ) : (
                <span className="text-xs text-state-success font-semibold">Clocked Out ({todayLog.checkOut})</span>
              )}
            </div>
          )}

          {user?.role !== 'Employee' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/employees?add=true')}
                variant="secondary"
                size="sm"
                icon={Plus}
              >
                Add Employee
              </Button>
              <Button
                onClick={() => navigate('/payroll')}
                variant="secondary"
                size="sm"
                icon={Receipt}
              >
                Run Payroll
              </Button>
            </div>
          )}

          <Button
            onClick={() => navigate('/leaves')}
            variant="primary"
            size="sm"
            icon={PlusSquare}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Top row metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Employees"
          value={metrics?.totalEmployees?.value || 0}
          change={metrics?.totalEmployees}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Present Today"
          value={metrics?.presentToday?.value || 0}
          change={metrics?.presentToday}
          icon={CalendarCheck}
          color="green"
        />
        <StatCard
          title="On Leave Today"
          value={metrics?.onLeaveToday?.value || 0}
          change={metrics?.onLeaveToday}
          icon={CalendarOff}
          color="rose"
        />
        <StatCard
          title="Open Positions"
          value={metrics?.openPositions?.value || 0}
          change={metrics?.openPositions}
          icon={Briefcase}
          color="purple"
        />
      </div>

      {/* Second row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount trend */}
        <Card className="lg:col-span-2 h-[340px] flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-text-primary">Employee Headcount Trend</h3>
            <p className="text-[10px] text-text-secondary">Last 12 months growth curve</p>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={headcountTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f9eff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f9eff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="headcount" stroke="#4f9eff" fillOpacity={1} fill="url(#colorHeadcount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dept donut chart */}
        <Card className="h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Department Distribution</h3>
            <p className="text-[10px] text-text-secondary">Headcount ratio by group</p>
          </div>
          <div className="flex-1 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={deptDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center mt-2 text-[10px] text-text-secondary">
            {deptDistribution.map((d, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Third row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly attendance */}
        <Card className="lg:col-span-2 h-[320px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Attendance Statistics</h3>
            <p className="text-[10px] text-text-secondary">Present vs Half-day vs Absent logs (this week)</p>
          </div>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceThisWeek} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
                <Legend iconSize={8} iconType="circle" />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Half-day" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leave status pie chart */}
        <Card className="h-[320px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Leave Requests Overview</h3>
            <p className="text-[10px] text-text-secondary">Monthly leaves split by state</p>
          </div>
          <div className="flex-1 w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={leaveStatusDist}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {leaveStatusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f1428', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom row Activities, Birthdays, Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity feed */}
        <Card className="h-[320px] flex flex-col justify-between">
          <div className="border-b border-white/5 pb-2.5 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Recent Activity Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto mt-3 space-y-3.5 pr-1 scrollbar-none">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex gap-3 text-xs leading-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 shrink-0" />
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-text-primary font-medium">{act.action}</span>
                  <span className="text-[9px] font-mono text-text-muted">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Birthdays */}
        <Card className="h-[320px] flex flex-col justify-between">
          <div className="border-b border-white/5 pb-2.5 flex items-center gap-2">
            <Gift className="h-4.5 w-4.5 text-accent-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Upcoming Birthdays</h3>
          </div>
          <div className="flex-1 overflow-y-auto mt-3 space-y-3.5 pr-1 scrollbar-none">
            {birthdays.length > 0 ? (
              birthdays.map((b, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Avatar src={b.photo} name={b.name} size="sm" />
                  <div className="flex-1 flex flex-col">
                    <span className="text-xs font-semibold text-text-primary">{b.name}</span>
                    <span className="text-[10px] text-accent-secondary font-mono">{b.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No birthdays in next 7 days
              </div>
            )}
          </div>
        </Card>

        {/* Announcements */}
        <Card className="h-[320px] flex flex-col justify-between">
          <div className="border-b border-white/5 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4.5 w-4.5 text-state-warning" />
              <h3 className="text-sm font-semibold text-text-primary">Latest Announcements</h3>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="text-[10px] text-accent-primary hover:underline font-semibold flex items-center gap-0.5"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto mt-3 space-y-3.5 pr-1 scrollbar-none">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                onClick={() => navigate('/announcements')}
                className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer flex flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-state-warning uppercase font-semibold">{ann.category}</span>
                  <span className="text-text-muted">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="text-xs font-semibold text-text-primary truncate">{ann.title}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
