import React from 'react';

type StatusType = 'matched' | 'ready' | 'warning' | 'needs-validation' | 'error' | 'unmatched';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  let defaultLabel = '';

  switch (status) {
    case 'matched':
    case 'ready':
      bgColor = 'bg-signal-green/10';
      textColor = 'text-signal-green';
      defaultLabel = status === 'matched' ? 'Matched' : 'Ready';
      icon = (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
      break;
    case 'warning':
    case 'needs-validation':
      bgColor = 'bg-safety-amber/10';
      textColor = 'text-safety-amber';
      defaultLabel = status === 'warning' ? 'Warning' : 'Needs Validation';
      icon = (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    case 'error':
    case 'unmatched':
      bgColor = 'bg-alert-red/10';
      textColor = 'text-alert-red';
      defaultLabel = status === 'error' ? 'Error' : 'Unmatched';
      icon = (
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-current ${bgColor} ${textColor} ${className}`}>
      {icon}
      {label || defaultLabel}
    </span>
  );
};
