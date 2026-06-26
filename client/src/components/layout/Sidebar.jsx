import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logOut, selectCurrentUser } from '../../store/authSlice';
import { useLogoutMutation } from '../../services/api';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  Wallet,
  Briefcase,
  TrendingUp,
  Megaphone,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (e) {
      // ignore
    }
    dispatch(logOut());
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Employees', icon: Users, path: '/employees', roles: ['SuperAdmin', 'HRManager', 'TeamManager'] },
    { label: 'Departments', icon: Building2, path: '/departments', roles: ['SuperAdmin', 'HRManager', 'TeamManager'] },
    { label: 'Attendance', icon: CalendarCheck, path: '/attendance', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Leaves', icon: CalendarOff, path: '/leaves', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Payroll', icon: Wallet, path: '/payroll', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Recruitment', icon: Briefcase, path: '/recruitment', roles: ['SuperAdmin', 'HRManager', 'TeamManager'] },
    { label: 'Performance', icon: TrendingUp, path: '/performance', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Announcements', icon: Megaphone, path: '/announcements', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Documents', icon: FileText, path: '/documents', roles: ['SuperAdmin', 'HRManager', 'TeamManager', 'Employee'] },
    { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['SuperAdmin', 'HRManager', 'TeamManager'] },
    { label: 'Settings', icon: Settings, path: '/settings', roles: ['SuperAdmin'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-[#060713]/70 backdrop-blur-[25px] border-r border-white/[0.06] flex flex-col z-30 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[70px]' : 'w-[240px]'}
      `}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] h-16 shrink-0 overflow-hidden">
        {!isCollapsed && (
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-accent-primary via-[#00f2fe] to-accent-secondary bg-clip-text text-transparent animate-pulse select-none font-sans uppercase">
            HRMS Pro
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-white/5 text-text-secondary hover:text-text-primary rounded-lg transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1.5 px-2 scrollbar-none">
        {filteredItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative border-l-[3px]
                ${isActive 
                  ? 'bg-gradient-to-r from-accent-primary/15 to-accent-secondary/5 text-text-primary border-accent-primary pl-2.5 rounded-l-none shadow-[0_0_20px_rgba(79,158,255,0.08)]' 
                  : 'text-text-secondary hover:bg-white/[0.03] hover:text-text-primary border-transparent'
                }
              `}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 hidden group-hover:block z-50 bg-background-end border border-white/10 px-2 py-1 rounded text-xs text-text-primary whitespace-nowrap shadow-glass">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer logout */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-state-danger hover:bg-state-danger/10 transition-colors group relative border-l-[4px] border-transparent"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-4 hidden group-hover:block z-50 bg-background-end border border-white/10 px-2 py-1 rounded text-xs text-state-danger whitespace-nowrap shadow-glass">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
