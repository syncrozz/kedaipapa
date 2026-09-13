import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      id={id}
      className="p-8 text-center rounded-xl border border-dashed border-stone-300 bg-stone-50/50 flex flex-col items-center justify-center max-w-lg mx-auto"
    >
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-stone-800">{title}</h4>
      <p className="text-sm text-stone-500 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
