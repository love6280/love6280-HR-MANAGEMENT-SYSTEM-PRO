import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

const CalendarHeatmap = ({
  data = [], // Array of { date, status }
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
}) => {
  const currentMonthDate = new Date(year, month, 1);
  const start = startOfMonth(currentMonthDate);
  const end = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start, end });

  // Day offset for grid starting point (e.g. Sunday=0, Monday=1, etc.)
  const startDayOffset = getDay(start);

  const getStatusColorClass = (day) => {
    // Find attendance record for this day
    const record = data.find(r => isSameDay(new Date(r.date), day));
    
    if (!record) {
      const dayOfWeek = day.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'bg-white/5 border-white/5 text-text-muted'; // Weekend default
      }
      return 'bg-white/5 border-white/5 text-text-muted';
    }

    const statusMap = {
      Present: 'bg-state-success/20 border-state-success/40 text-state-success font-semibold shadow-[0_0_10px_rgba(16,185,129,0.15)]',
      WFH: 'bg-accent-secondary/20 border-accent-secondary/40 text-accent-secondary font-semibold shadow-[0_0_10px_rgba(139,92,246,0.15)]',
      'Half-day': 'bg-state-warning/20 border-state-warning/40 text-state-warning font-semibold',
      Leave: 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary font-semibold',
      Absent: 'bg-state-danger/25 border-state-danger/45 text-state-danger font-semibold shadow-[0_0_10px_rgba(244,63,94,0.15)]',
      Holiday: 'bg-white/10 border-white/10 text-text-secondary',
    };

    return statusMap[record.status] || 'bg-white/5 border-white/5';
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-primary">
          {format(currentMonthDate, 'MMMM yyyy')}
        </h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-state-success/20 border border-state-success/30" />Present</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-accent-secondary/20 border border-accent-secondary/30" />WFH</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-state-warning/20 border border-state-warning/30" />Half-day</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-accent-primary/20 border border-accent-primary/30" />Leave</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-state-danger/20 border border-state-danger/30" />Absent</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Weekday headers */}
        {weekdays.map((wd, i) => (
          <div key={i} className="text-center text-xs font-semibold text-text-muted py-1">
            {wd}
          </div>
        ))}

        {/* Empty cells for starting offset */}
        {Array.from({ length: startDayOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="aspect-square opacity-0" />
        ))}

        {/* Calendar days */}
        {daysInMonth.map((day, idx) => (
          <div
            key={idx}
            className={`
              aspect-square rounded-lg border flex flex-col items-center justify-center text-xs relative group transition-all duration-200 hover:scale-105 cursor-pointer
              ${getStatusColorClass(day)}
            `}
          >
            <span>{format(day, 'd')}</span>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-background-end border border-white/10 px-2 py-1 rounded text-[10px] text-text-primary whitespace-nowrap shadow-glass">
              {format(day, 'EEE, d MMM')} - {data.find(r => isSameDay(new Date(r.date), day))?.status || 'Holiday/Weekend'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarHeatmap;
