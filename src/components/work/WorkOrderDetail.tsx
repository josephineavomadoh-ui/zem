/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkOrder, Part, Store } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { SignaturePad } from '../common/SignaturePad.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CheckCircle2,
  Clock,
  Play,
  Square,
  Wrench,
  Package,
  MessageSquare,
  FileCheck,
  History,
  AlertCircle,
  Plus,
  Star,
  ShieldAlert,
} from 'lucide-react';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onUpdate: () => void;
  parts: Part[];
  stores: Store[];
}

export const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  workOrder,
  onUpdate,
  parts,
  stores,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'labor' | 'parts' | 'signature' | 'comments' | 'history'>('tasks');

  // Labor timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // New part modal state
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id || '');
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [partNotice, setPartNotice] = useState<string | null>(null);

  // Labor entry state
  const [laborHours, setLaborHours] = useState<number>(1.5);
  const [laborNotes, setLaborNotes] = useState<string>('');

  // Comment state
  const [commentBody, setCommentBody] = useState<string>('');
  const [isCustomerVisible, setIsCustomerVisible] = useState<boolean>(false);

  // Status transition state
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [holdReason, setHoldReason] = useState<string>('');

  // Toggle task item completion
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/work-orders/${workOrder.id}/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Labor Log
  const handleAddLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/work-orders/${workOrder.id}/labor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          hours: laborHours,
          rate: 45,
          notes: laborNotes,
        }),
      });
      if (res.ok) {
        setLaborNotes('');
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Issue Part against Work Order
  const handleIssuePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartNotice(null);
    try {
      const res = await fetch(`/api/v1/work-orders/${workOrder.id}/parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          partId: selectedPartId,
          quantity: partQuantity,
          storeId: selectedStoreId,
        }),
      });
      const data = await res.json();
      if (res.status === 202) {
        setPartNotice(`Dual-Control Required: ${data.message}`);
      } else if (res.ok) {
        setPartNotice(`Successfully issued ${partQuantity} unit(s) from inventory.`);
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    try {
      const res = await fetch(`/api/v1/work-orders/${workOrder.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          body: commentBody,
          isVisibleToCustomer: isCustomerVisible,
        }),
      });
      if (res.ok) {
        setCommentBody('');
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Customer Signature & Rating
  const [customerRating, setCustomerRating] = useState<number>(5);
  const handleSaveSignature = async (sigDataUrl: string) => {
    try {
      const res = await fetch(`/api/v1/work-orders/${workOrder.id}/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          customerSignature: sigDataUrl,
          customerRating,
        }),
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  // Status transition execution
  const executeStatusChange = async () => {
    try {
      const res = await fetch(`/api/v1/work-orders/${workOrder.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: targetStatus,
          note: statusNote,
          holdReason: targetStatus === 'OnHold' ? holdReason : undefined,
        }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        setStatusNote('');
        setHoldReason('');
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar with WO number, Status, and Action Controls */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl font-bold font-mono tracking-tight text-white">
                {workOrder.number}
              </span>
              <Badge status={workOrder.status}>{workOrder.status}</Badge>
              <Badge status={workOrder.priority}>{workOrder.priority} Priority</Badge>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {workOrder.type}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {workOrder.jobKind}
              </span>
            </div>
            <h1 className="text-base font-semibold text-slate-100">{workOrder.title}</h1>
            <p className="text-xs text-slate-400">{workOrder.description}</p>
          </div>

          {/* Quick status transition dropdown/buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {workOrder.status === 'Open' && (
              <button
                onClick={() => {
                  setTargetStatus('Assigned');
                  setShowStatusModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Assign Tech
              </button>
            )}
            {workOrder.status === 'Assigned' && (
              <button
                onClick={() => {
                  setTargetStatus('InProgress');
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Start Job
              </button>
            )}
            {workOrder.status === 'InProgress' && (
              <>
                <button
                  onClick={() => {
                    setTargetStatus('OnHold');
                    setShowStatusModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Hold Job
                </button>
                <button
                  onClick={() => {
                    setTargetStatus('Completed');
                    setShowStatusModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Complete Job
                </button>
              </>
            )}
            {workOrder.status === 'OnHold' && (
              <button
                onClick={() => {
                  setTargetStatus('InProgress');
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Resume Job
              </button>
            )}
            {workOrder.status === 'Completed' && (
              <button
                onClick={() => {
                  setTargetStatus('Verified');
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Verify Work
              </button>
            )}
            {workOrder.status === 'Verified' && (
              <button
                onClick={() => {
                  setTargetStatus('Closed');
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Close & Bill
              </button>
            )}
          </div>
        </div>

        {/* Info bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Technician</span>
            <span className="font-medium text-white">{workOrder.assignedToName || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Estimated vs Actual Cost</span>
            <span className="font-medium text-white">
              ${workOrder.estimatedCost} / ${workOrder.actualCost}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">SLA Response Clock</span>
            <span className="font-medium text-emerald-400">Within Target (100%)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Governance</span>
            <span className="font-medium text-orange-400">Maker-Checker Monitored</span>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
        {[
          { id: 'tasks', label: `Tasks & Checklist (${workOrder.tasks.length})`, icon: CheckCircle2 },
          { id: 'labor', label: `Labor & Timer (${workOrder.labor.length})`, icon: Clock },
          { id: 'parts', label: `Parts Issued (${workOrder.parts.length})`, icon: Package },
          { id: 'signature', label: 'Proof & Signature', icon: FileCheck },
          { id: 'comments', label: `Notes (${workOrder.comments.length})`, icon: MessageSquare },
          { id: 'history', label: 'Audit Timeline', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-orange-600 text-orange-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        {/* Tab 1: Checklist Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Required Job Checklists</h3>
                <p className="text-xs text-slate-500">Every required task must be verified before job closure</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {workOrder.tasks.map((task) => (
                <div key={task.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id, task.isCompleted)}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                        task.isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-orange-500 bg-white'
                      }`}
                    >
                      {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <div
                        className={`text-xs font-medium ${
                          task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {task.sequence}. {task.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Type: {task.type}
                        </span>
                        {task.expectedValue && <span>Target: {task.expectedValue}</span>}
                        {task.result && <span className="font-semibold text-emerald-600">Result: {task.result}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge status={task.isCompleted ? 'Completed' : 'Pending'}>
                    {task.isCompleted ? 'Pass' : 'Incomplete'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Labor & Timer */}
        {activeTab === 'labor' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Active Labor Timer</h4>
                  <p className="text-xs text-slate-500">Record technician on-site repair time in real time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-slate-900">
                  {timerRunning ? '01:24:10' : '00:00:00'}
                </span>
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    timerRunning
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {timerRunning ? (
                    <>
                      <Square className="w-3.5 h-3.5" /> Stop Timer
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Start Timer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Manual Labor Log Form */}
            <form onSubmit={handleAddLabor} className="p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Log Billable Technician Hours
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={laborHours}
                    onChange={(e) => setLaborHours(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Work Description</label>
                  <input
                    type="text"
                    value={laborNotes}
                    onChange={(e) => setLaborNotes(e.target.value)}
                    placeholder="e.g. Conducted vibration tests, replaced fan coil seals"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                + Record Labor Hours
              </button>
            </form>

            {/* Logged Labor Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Technician</th>
                    <th className="py-2.5 px-3 font-semibold">Hours</th>
                    <th className="py-2.5 px-3 font-semibold">Internal Rate</th>
                    <th className="py-2.5 px-3 font-semibold">Billable Rate</th>
                    <th className="py-2.5 px-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrder.labor.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{l.userName}</td>
                      <td className="py-2.5 px-3">{l.hours} hrs</td>
                      <td className="py-2.5 px-3">${l.rate}/hr</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-medium">${l.billableRate}/hr</td>
                      <td className="py-2.5 px-3 text-slate-500">{l.notes || '—'}</td>
                    </tr>
                  ))}
                  {workOrder.labor.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No labor recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Parts & Inventory Consumption with Dual Control limit */}
        {activeTab === 'parts' && (
          <div className="space-y-6">
            {partNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{partNotice}</span>
              </div>
            )}

            <form onSubmit={handleIssuePart} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Issue Part From Store to Order
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Auto-Approve limit: ${currentUser.approvalLimit || 250}.00
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Select Part</label>
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-orange-500"
                  >
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.standardCost} ea · {p.quantityOnHand} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Issuing Store</label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-orange-500"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Issue Part Against Work Order
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">SKU</th>
                    <th className="py-2.5 px-3 font-semibold">Part Name</th>
                    <th className="py-2.5 px-3 font-semibold">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold">Unit Cost</th>
                    <th className="py-2.5 px-3 font-semibold">Billable Price</th>
                    <th className="py-2.5 px-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrder.parts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.partSku}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{p.partName}</td>
                      <td className="py-2.5 px-3">{p.quantity}</td>
                      <td className="py-2.5 px-3">${p.unitCost.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-medium">
                        ${p.billablePrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        ${(p.quantity * p.unitCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {workOrder.parts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        No parts issued to this work order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Proof & Customer Digital Signature */}
        {activeTab === 'signature' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Customer Proof & Sign-Off</h3>
              <p className="text-xs text-slate-500">
                Collect client digital sign-off and satisfaction rating upon job completion
              </p>
            </div>

            {workOrder.customerSignature ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                  <span>Signed & Verified by Client</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (workOrder.customerRating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <img
                    src={workOrder.customerSignature}
                    alt="Customer Signature"
                    className="max-h-24 mx-auto object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Client Satisfaction Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCustomerRating(star)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          customerRating >= star
                            ? 'bg-amber-50 border-amber-300 text-amber-500'
                            : 'border-slate-200 text-slate-300'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-700 ml-2">
                      {customerRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Sign On Screen
                  </label>
                  <SignaturePad onSave={handleSaveSignature} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-6 max-w-2xl">
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add technician observation or site notes..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCustomerVisible}
                    onChange={(e) => setIsCustomerVisible(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Visible to customer in client portal</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Post Note
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {workOrder.comments.map((c) => (
                <div key={c.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {c.authorName} ({c.authorRole})
                    </span>
                    <span className="text-slate-400">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{c.body}</p>
                  {c.isVisibleToCustomer && (
                    <span className="text-[10px] text-sky-600 font-medium">Customer Visible</span>
                  )}
                </div>
              ))}
              {workOrder.comments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No notes recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Status & Audit Timeline */}
        {activeTab === 'history' && (
          <div className="space-y-4 max-w-xl">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Work Order Status Audit Trail
            </h4>
            <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-4">
              {workOrder.statusHistory.map((sh) => (
                <div key={sh.id} className="relative">
                  <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white ring-1 ring-slate-200" />
                  <div className="text-xs font-semibold text-slate-900">
                    {sh.from} &rarr; {sh.to}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    by {sh.changedByName} · {new Date(sh.at).toLocaleString()}
                  </div>
                  {sh.note && <p className="text-xs text-slate-600 mt-1 italic">"{sh.note}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Status Change to: <span className="text-orange-600">{targetStatus}</span>
            </h3>

            {targetStatus === 'OnHold' && (
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Hold Reason (Required to pause SLA clock)
                </label>
                <select
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Waiting Parts from Store">Waiting Parts from Store</option>
                  <option value="Awaiting Customer Site Access">Awaiting Customer Site Access (Pauses SLA)</option>
                  <option value="Awaiting Supervisor Authorization">Awaiting Supervisor Authorization</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Audit Transition Note
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Reason or operational update..."
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeStatusChange}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
