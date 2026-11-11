/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkOrder, Part, Store } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { WorkOrderDetail } from './WorkOrderDetail.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Clock,
  User,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface WorkOrdersViewProps {
  onOpenCreate: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({ onOpenCreate }) => {
  const { currentBranchId } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const fetchData = async () => {
    try {
      const [woRes, partsRes, metaRes] = await Promise.all([
        fetch('/api/v1/work-orders'),
        fetch('/api/v1/parts'),
        fetch('/api/v1/meta'),
      ]);
      const wos = await woRes.json();
      const prts = await partsRes.json();
      const meta = await metaRes.json();
      setWorkOrders(wos || []);
      setParts(prts || []);
      setStores(meta.stores || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || wo.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const kanbanStatuses = ['Open', 'Assigned', 'InProgress', 'OnHold', 'Completed', 'Closed'];

  return (
    <div className="space-y-5">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Work Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle maintenance tracking with SLA clocks and dual-control cost ceilings
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Work Order
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, title, asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-orange-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="InProgress">In Progress</option>
              <option value="OnHold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-orange-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* List / Table Mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Tasks</th>
                  <th className="py-3 px-4">Cost Est / Act</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((wo) => {
                  const completedTasks = wo.tasks.filter((t) => t.isCompleted).length;
                  return (
                    <tr
                      key={wo.id}
                      onClick={() => setSelectedOrder(wo)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {wo.number}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">{wo.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{wo.type} · {wo.jobKind}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={wo.priority}>{wo.priority}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={wo.status}>{wo.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {wo.assignedToName ? (
                          <span className="font-medium">{wo.assignedToName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-medium">
                          {completedTasks} / {wo.tasks.length}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        ${wo.estimatedCost} / <span className="text-emerald-700">${wo.actualCost}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(wo);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Open &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No matching work orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban Board Mode */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-start overflow-x-auto pb-4">
          {kanbanStatuses.map((status) => {
            const statusOrders = filteredOrders.filter((wo) => wo.status === status);
            return (
              <div
                key={status}
                className="bg-slate-50/80 rounded-xl border border-slate-200 p-2.5 space-y-2.5 min-w-[220px]"
              >
                <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-700">
                  <span>{status}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                    {statusOrders.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {statusOrders.map((wo) => (
                    <div
                      key={wo.id}
                      onClick={() => setSelectedOrder(wo)}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs hover:border-orange-300 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-slate-900">{wo.number}</span>
                        <Badge status={wo.priority}>{wo.priority}</Badge>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                        {wo.title}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="truncate max-w-[100px]">
                          {wo.assignedToName || 'Unassigned'}
                        </span>
                        <span className="font-medium text-slate-700">${wo.actualCost}</span>
                      </div>
                    </div>
                  ))}
                  {statusOrders.length === 0 && (
                    <div className="py-6 text-center text-[11px] text-slate-400 italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Work Order Detail: ${selectedOrder.number}`}
          subtitle={selectedOrder.title}
          maxWidth="4xl"
        >
          <WorkOrderDetail
            workOrder={selectedOrder}
            parts={parts}
            stores={stores}
            onUpdate={() => {
              fetchData();
              // update local selected
              fetch(`/api/v1/work-orders/${selectedOrder.id}`)
                .then((r) => r.json())
                .then((updated) => setSelectedOrder(updated));
            }}
          />
        </Modal>
      )}
    </div>
  );
};
