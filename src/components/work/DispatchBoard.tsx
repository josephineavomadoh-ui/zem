/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkOrder, User, Team } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
} from 'lucide-react';

export const DispatchBoard: React.FC = () => {
  const { currentUser, availableUsers } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const technicians = availableUsers.filter((u) => u.role === 'Technician' || u.role === 'Supervisor');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/v1/work-orders');
      const data = await res.json();
      setOrders(data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAssignTech = async (orderId: string, techId: string) => {
    try {
      const tech = availableUsers.find((u) => u.id === techId);
      await fetch(`/api/v1/work-orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: 'Assigned',
          assignedToId: techId,
          note: `Dispatched to ${tech?.name}`,
        }),
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const unassignedOrders = orders.filter((o) => !o.assignedToId && o.status === 'Open');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
            Dispatch Board & Technician Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance workload across teams, assign unassigned orders, and monitor real-time repair allocations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Active Shift: Morning (07:00 - 16:00)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Unassigned Work Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Unassigned Queue ({unassignedOrders.length})
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 font-bold rounded">
              Needs Dispatch
            </span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto">
            {unassignedOrders.map((wo) => (
              <div
                key={wo.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:border-orange-300 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{wo.number}</span>
                  <Badge status={wo.priority}>{wo.priority}</Badge>
                </div>
                <div className="font-semibold text-slate-800 line-clamp-1">{wo.title}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Est: {wo.estimatedHours} hrs · {wo.type}
                </div>

                {/* Quick Technician assignment selector */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Assign Technician
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAssignTech(wo.id, e.target.value);
                    }}
                    defaultValue=""
                    className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 bg-white focus:outline-orange-500"
                  >
                    <option value="" disabled>Select technician...</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {unassignedOrders.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                All current work orders have been assigned!
              </div>
            )}
          </div>
        </div>

        {/* Technician Lanes (Calendar view) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Technician Workload Lanes
              </h3>
              <p className="text-xs text-slate-500">Live assigned jobs and active status per field tech</p>
            </div>
            <span className="text-xs text-slate-500">
              {technicians.length} Technicians available
            </span>
          </div>

          <div className="space-y-4">
            {technicians.map((tech) => {
              const techOrders = orders.filter((o) => o.assignedToId === tech.id);
              const totalEstHours = techOrders.reduce((sum, o) => sum + o.estimatedHours, 0);

              return (
                <div
                  key={tech.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{tech.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {tech.role} · Skill: Power & HVAC · Branch: {tech.branchId.replace('br-', '').toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-600">
                        Assigned: <strong className="text-slate-900">{techOrders.length} jobs</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[11px]">
                        {totalEstHours.toFixed(1)} hrs allocated
                      </span>
                    </div>
                  </div>

                  {/* Jobs list inside lane */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {techOrders.map((wo) => (
                      <div
                        key={wo.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-900">{wo.number}</span>
                          <Badge status={wo.status}>{wo.status}</Badge>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {wo.title}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Est: {wo.estimatedHours} hrs</span>
                          <Badge status={wo.priority}>{wo.priority}</Badge>
                        </div>
                      </div>
                    ))}
                    {techOrders.length === 0 && (
                      <div className="col-span-2 py-3 text-center text-xs text-slate-400 italic bg-white/50 rounded-lg border border-dashed border-slate-200">
                        Technician is currently available for dispatch.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
