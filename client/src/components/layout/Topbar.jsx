import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from '../../services/api';
import { Bell, Clock, ShieldAlert, Award, FileText, Gift, Megaphone } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { io } from 'socket.io-client';

const Topbar = () => {
  const user = useSelector(selectCurrentUser);
  const [time, setTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { data: notifData, refetch: refetchNotifs } = useGetNotificationsQuery(undefined, {
    skip: !user,
  });
  const [markRead] = useMarkNotificationsReadMutation();

  // Clock runner
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket.io for Real-time alerts
  useEffect(() => {
    if (!user || !user.employee) return;

    const envSocketUrl = import.meta.env.VITE_SOCKET_URL;
    let hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    if (hostname === 'localhost') {
      hostname = '127.0.0.1';
    }
    const socketUrl = (envSocketUrl && !envSocketUrl.includes('localhost'))
      ? envSocketUrl
      : `http://${hostname}:5000`;
    const socket = io(socketUrl);

    // Join room for this employee
    socket.emit('join', user.employee._id);

    socket.on('notification', () => {
      refetchNotifs();
    });

    socket.on('connect', () => console.log('Socket client connected'));

    return () => {
      socket.disconnect();
    };
  }, [user, refetchNotifs]);

  const handleToggleNotif = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && notifData?.unreadCount > 0) {
      try {
        await markRead().unwrap();
        refetchNotifs();
      } catch (e) {
        // ignore
      }
    }
  };

  const getNotifIcon = (type) => {
    const icons = {
      leave_request: ShieldAlert,
      leave_approved: Award,
      leave_rejected: ShieldAlert,
      attendance_regularization: FileText,
      payslip_generated: FileText,
      interview_scheduled: Megaphone,
      announcement: Megaphone,
      birthday_reminder: Gift,
    };
    const IconComponent = icons[type] || Bell;
    return <IconComponent className="h-4 w-4 text-accent-primary" />;
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-[#0a0a1a]/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20 transition-all duration-300">
      {/* Search space / Empty spacing for left shift */}
      <div className="flex-1" />

      <div className="flex items-center gap-5">
        {/* Real-time Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-text-secondary text-xs font-mono font-medium">
          <Clock className="h-3.5 w-3.5 text-accent-primary" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={handleToggleNotif}
            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {notifData?.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-state-danger text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {notifData.unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 glass-card border border-white/10 shadow-glass rounded-xl overflow-hidden flex flex-col z-50">
              <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Recent Notifications</span>
                {notifData?.unreadCount > 0 && (
                  <span className="text-[10px] text-accent-primary font-medium">New alerts pending</span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {notifData?.data && notifData.data.length > 0 ? (
                  notifData.data.map((item) => (
                    <div
                      key={item._id}
                      className={`p-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors ${
                        !item.isRead ? 'bg-white/[0.01]' : ''
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-white/5 shrink-0 mt-0.5">
                        {getNotifIcon(item.type)}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 text-left">
                        <span className="text-xs text-text-primary font-medium leading-tight">
                          {item.message}
                        </span>
                        <span className="text-[9px] font-mono text-text-muted mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 text-center text-xs text-text-muted">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-text-primary">
                {user.employee ? `${user.employee.personalInfo.firstName} ${user.employee.personalInfo.lastName}` : 'Administrator'}
              </span>
              <span className="text-[10px] text-text-secondary font-mono">
                {user.role}
              </span>
            </div>
            <Avatar
              src={user.employee?.personalInfo?.photo}
              name={user.employee ? `${user.employee.personalInfo.firstName} ${user.employee.personalInfo.lastName}` : 'Admin'}
              size="sm"
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
