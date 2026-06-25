import React from 'react';
import CountUp from 'react-countup';
import Card from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
  title,
  value,
  change, // object: { value: number, type: 'up' | 'down' | 'neutral' }
  icon: Icon,
  color = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'rose'
}) => {
  const glowShadows = {
    blue: 'shadow-[0_0_15px_rgba(79,158,255,0.25)] border-accent-primary/20',
    purple: 'shadow-[0_0_15px_rgba(139,92,246,0.25)] border-accent-secondary/20',
    green: 'shadow-[0_0_15px_rgba(16,185,129,0.25)] border-state-success/20',
    amber: 'shadow-[0_0_15px_rgba(245,158,11,0.25)] border-state-warning/20',
    rose: 'shadow-[0_0_15px_rgba(244,63,94,0.25)] border-state-danger/20',
  };

  const textColors = {
    blue: 'text-accent-primary',
    purple: 'text-accent-secondary',
    green: 'text-state-success',
    amber: 'text-state-warning',
    rose: 'text-state-danger',
  };

  return (
    <Card hover={true} className={`border ${glowShadows[color]} flex flex-col justify-between h-32`}>
      <div className="flex items-start justify-between">
        <span className="text-text-secondary text-sm font-medium">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg bg-white/5 ${textColors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-auto">
        <span className="text-3xl font-bold font-mono tracking-tight text-text-primary">
          {typeof value === 'number' ? (
            <CountUp end={value} duration={1.5} separator="," />
          ) : (
            value
          )}
        </span>

        {change && change.value !== undefined && change.type !== 'neutral' && (
          <div
            className={`
              flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border
              ${change.type === 'up' 
                ? 'bg-state-success/15 border-state-success/20 text-state-success' 
                : 'bg-state-danger/15 border-state-danger/20 text-state-danger'
              }
            `}
          >
            {change.type === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
