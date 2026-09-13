import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'emerald' | 'amber' | 'blue' | 'purple' | 'stone';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'stone',
  badgeText,
}) => {
  const accentClasses = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    purple: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    stone: 'text-stone-700 bg-stone-100 border-stone-200',
  };

  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-stone-600">{title}</span>
        <div className={`p-2 rounded-lg border ${accentClasses[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-stone-900 tracking-tight">
          {value}
        </div>
        {(subtitle || badgeText) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
            {badgeText && (
              <span className="font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                {badgeText}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
