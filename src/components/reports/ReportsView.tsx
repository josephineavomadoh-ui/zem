/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const reportMetrics = [
    { title: 'MTTR (Mean Time to Repair)', value: '2.4 hrs', trend: '-18% faster', positive: true },
    { title: 'MTBF (Mean Time Between Failures)', value: '720 hrs', trend: '+12% reliability', positive: true },
    { title: 'Equipment Availability', value: '99.4%', trend: 'Above 99% SLA', positive: true },
    { title: 'First-Time Fix Rate', value: '92.5%', trend: 'High quality work', positive: true },
    { title: 'Preventive vs Reactive Ratio', value: '65% / 35%', trend: 'Healthy proactivity', positive: true },
    { title: 'Technician Labor Utilization', value: '88.2%', trend: 'Capacity optimal', positive: true },
  ];

  const [notification, setNotification] = useState<string | null>(null);

  const handleExport = (name: string) => {
    const csvContent = `Report Name,${name}\nGenerated,${new Date().toISOString()}\nDate Range,${dateRange}\nMetric,Value\nMTTR,2.4 hrs\nMTBF,720 hrs\nAvailability,99.4%\nPM Ratio,65%\nFix Rate,92.5%\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification(`Successfully exported "${name}" report as CSV download!`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Reports & Operational Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key maintenance metrics, MTTR/MTBF analysis, equipment lifecycle cost, and technician capacity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-orange-500 font-medium"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Current Quarter (Q4 2026)</option>
            <option>Year to Date (2026)</option>
          </select>
          <button
            onClick={() => handleExport('Operations_Executive_Summary')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportMetrics.map((m, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs text-slate-500 font-medium">{m.title}</span>
            <div className="text-2xl font-bold text-slate-900 font-mono">{m.value}</div>
            <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{m.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Report Library Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Standard CMMS Report Library (Section 8.4)
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {[
            { name: 'Work Order Backlog & SLA Aging Report', desc: 'Breakdown of unassigned, in-progress, and pending approval jobs by priority and branch.', type: 'Operational' },
            { name: 'Equipment Downtime & Pareto Failure Code Analysis', desc: 'Stoppage duration, frequency, root causes, and top failing components across assets.', type: 'Asset Reliability' },
            { name: 'Preventive Maintenance Compliance & Missed Schedules', desc: 'Completed vs scheduled PM visits, grace period compliance, and parts kit readiness.', type: 'Preventive' },
            { name: 'Technician Labor Time & Overtime Audit', desc: 'Logged on-site hours, GPS check-in stamps, travel time, and billable utilization.', type: 'Workforce' },
            { name: 'Stock Turnover & Inventory Valuation by Bin', desc: 'Current on-hand quantities, weighted average unit costs, and reorder projections.', type: 'Supply Chain' },
            { name: 'Contractor Gross Profit Margin per Work Order', desc: 'Billed price minus technician labor rates and inventory parts purchase costs.', type: 'Financial' },
          ].map((rep, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-800">{rep.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{rep.desc}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  {rep.type}
                </span>
                <button
                  onClick={() => handleExport(rep.name)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
