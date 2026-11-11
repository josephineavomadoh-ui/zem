/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkOrder, Part, Store } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { SignaturePad } from '../common/SignaturePad.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Smartphone,
  CheckCircle,
  Clock,
  Play,
  Square,
  Package,
  FileCheck,
  AlertTriangle,
  Wifi,
  WifiOff,
  RotateCw,
  MapPin,
  Phone,
  Camera,
  ChevronLeft,
} from 'lucide-react';

export const TechnicianPwaView: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);

  // Active timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(3840); // 1h 4m

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/v1/work-orders');
      const data = await res.json();
      // Filter today's jobs or assigned
      setOrders(data || []);
      if (!selectedOrder && data && data.length > 0) {
        setSelectedOrder(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!selectedOrder) return;
    if (isOffline) {
      // Offline outbox queue simulation
      setOutboxCount((prev) => prev + 1);
      selectedOrder.tasks = selectedOrder.tasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !isCompleted } : t
      );
      setSelectedOrder({ ...selectedOrder });
      return;
    }

    try {
      await fetch(`/api/v1/work-orders/${selectedOrder.id}/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartJob = async () => {
    if (!selectedOrder) return;
    setTimerRunning(true);
    if (!isOffline) {
      await fetch(`/api/v1/work-orders/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ status: 'InProgress', note: 'Technician started work via PWA' }),
      });
      fetchJobs();
    } else {
      setOutboxCount((c) => c + 1);
      selectedOrder.status = 'InProgress';
      setSelectedOrder({ ...selectedOrder });
    }
  };

  const handleCompleteJob = async () => {
    if (!selectedOrder) return;
    setTimerRunning(false);
    if (!isOffline) {
      await fetch(`/api/v1/work-orders/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ status: 'Completed', note: 'Job completed by technician via PWA' }),
      });
      fetchJobs();
    } else {
      setOutboxCount((c) => c + 1);
      selectedOrder.status = 'Completed';
      setSelectedOrder({ ...selectedOrder });
    }
  };

  const handleSyncOutbox = () => {
    setOutboxCount(0);
    setIsOffline(false);
    fetchJobs();
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col min-h-[640px]">
      {/* PWA Mobile Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_02.54.45_c28fdec9.jpeg"
            alt="ZemiFix"
            className="w-7 h-7 rounded-md"
          />
          <div>
            <div className="text-xs font-bold leading-none">ZemiFix Mobile PWA</div>
            <div className="text-[10px] text-orange-400 mt-0.5">
              Technician: {currentUser.name}
            </div>
          </div>
        </div>

        {/* Offline / Online toggle simulation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
              isOffline
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {isOffline ? 'Offline' : 'Online'}
          </button>

          {outboxCount > 0 && (
            <button
              onClick={handleSyncOutbox}
              className="px-2 py-1 bg-orange-600 hover:bg-orange-500 rounded text-[10px] font-bold text-white flex items-center gap-1 animate-pulse"
              title="Sync cached actions"
            >
              <RotateCw className="w-3 h-3" /> {outboxCount} sync
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900">
        {selectedOrder ? (
          <div className="space-y-4">
            {/* Top Job Banner */}
            <div className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-orange-400">
                  {selectedOrder.number}
                </span>
                <Badge status={selectedOrder.status}>{selectedOrder.status}</Badge>
              </div>

              <h3 className="text-sm font-bold text-white leading-tight">
                {selectedOrder.title}
              </h3>

              <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-400" />
                  Plant Room B1
                </span>
                <a
                  href="tel:+233245551234"
                  className="flex items-center gap-1 text-sky-400 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  Call Contact
                </a>
              </div>
            </div>

            {/* Quick Large Mobile Actions (Single-Hand optimized) */}
            <div className="grid grid-cols-2 gap-2.5">
              {selectedOrder.status !== 'InProgress' && selectedOrder.status !== 'Completed' ? (
                <button
                  type="button"
                  onClick={handleStartJob}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" /> START JOB
                </button>
              ) : selectedOrder.status === 'InProgress' ? (
                <button
                  type="button"
                  onClick={handleCompleteJob}
                  className="py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> FINISH JOB
                </button>
              ) : (
                <div className="py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center">
                  Job Completed
                </div>
              )}

              <div className="bg-slate-800 rounded-xl p-2.5 border border-slate-700 flex items-center justify-between px-3">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Timer</div>
                <div className="font-mono text-sm font-bold text-white">
                  {timerRunning ? '01:04:20' : '00:00'}
                </div>
              </div>
            </div>

            {/* Tasks Mobile Checklist */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Pass/Fail Checklist</span>
                <span className="text-[11px] text-orange-400 font-mono">
                  {selectedOrder.tasks.filter((t) => t.isCompleted).length} / {selectedOrder.tasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {selectedOrder.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleToggleTask(task.id, task.isCompleted)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      task.isCompleted
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate pr-2">{task.description}</span>
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-xs font-bold ${
                        task.isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {task.isCompleted ? '✓' : '○'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Photo Upload Simulation */}
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Camera className="w-4 h-4 text-orange-400" />
                <span>Snap Work Verification Photo</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Photo captured and compressed for low-bandwidth upload!')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
              >
                Capture
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No active jobs found for today.
          </div>
        )}
      </div>

      {/* Today's Jobs Switcher Drawer (bottom) */}
      <div className="bg-slate-950 p-3 border-t border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
          Today's Assigned Jobs ({orders.length})
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {orders.map((wo) => (
            <button
              key={wo.id}
              onClick={() => setSelectedOrder(wo)}
              className={`p-2 rounded-lg text-left text-xs shrink-0 w-36 border transition-all ${
                selectedOrder?.id === wo.id
                  ? 'bg-orange-600 border-orange-500 text-white font-semibold'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-mono text-[10px] truncate">{wo.number}</div>
              <div className="text-[11px] truncate leading-tight mt-0.5">{wo.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
