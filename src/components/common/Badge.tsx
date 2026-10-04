import React from 'react';
import { ProjectStatus, PaymentStatus } from '../../types';

interface BadgeProps {
  status: ProjectStatus | PaymentStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md', className = '' }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'On Track':
    case 'Paid':
    case 'Healthy':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'Needs Attention':
    case 'Watch':
    case 'Partially Paid':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'Budget Alert':
    case 'Risk':
    case 'Over Budget':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;
    case 'Delayed':
    case 'Pending':
      style = 'bg-orange-50 text-orange-700 border-orange-200';
      dotColor = 'bg-orange-500';
      break;
    case 'Completed':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotColor = 'bg-indigo-500';
      break;
    case 'Residential':
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      break;
    case 'Commercial':
      style = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${style} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
