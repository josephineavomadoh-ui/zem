/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'status' | 'priority' | 'role' | 'criticality';
  status?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, status = '', className = '' }) => {
  const s = status.toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['operational', 'approved', 'completed', 'verified', 'active', 'clean'].includes(s)) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
  } else if (['inprogress', 'assigned', 'sent'].includes(s)) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  } else if (['pendingapproval', 'pending', 'underreview', 'onhold', 'standby', 'degraded'].includes(s)) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
  } else if (['down', 'rejected', 'urgent', 'critical', 'overdue', 'cancelled', 'breached'].includes(s)) {
    bg = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
  } else if (['high'].includes(s)) {
    bg = 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
  } else if (['medium', 'draft', 'open'].includes(s)) {
    bg = 'bg-sky-50 text-sky-700 border-sky-200 font-medium';
  } else if (['low', 'closed', 'paid'].includes(s)) {
    bg = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border tracking-tight ${bg} ${className}`}
    >
      {children}
    </span>
  );
};
