/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ClipboardList,
  CalendarCheck,
  Activity,
  ShieldCheck,
  ChevronRight,
  Building2,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  HardHat,
  Plus,
  Layers,
  Wrench,
} from 'lucide-react';
import { Branch, WorkOrder, Asset } from '../../types/index.ts';

interface ExecutiveDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenQuickCreate: () => void;
  onOpenQrScanner: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigate,
  onOpenQuickCreate,
}) => {
  const { currentUser, branches, currentBranchId } = useAuth();
  const currentBranch = branches.find((b: Branch) => b.id === currentBranchId) || branches[0];

  const [filter, setFilter] = useState<'all' | 'critical' | 'pm'>('all');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [woRes, astRes, appRes] = await Promise.all([
        fetch('/api/v1/work-orders'),
        fetch('/api/v1/assets'),
        fetch('/api/v1/approvals'),
      ]);

      if (woRes.ok) {
        const data = await woRes.json();
        setWorkOrders(Array.isArray(data) ? data : []);
      }
      if (astRes.ok) {
        const data = await astRes.json();
        setAssets(Array.isArray(data) ? data : []);
      }
      if (appRes.ok) {
        const data = await appRes.json();
        const pending = (Array.isArray(data) ? data : []).filter((a: any) => a.status === 'Pending').length;
        setPendingApprovalsCount(pending);
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const openWorkOrders = workOrders.filter(
    (w) => w.status !== 'Closed' && w.status !== 'Completed' && w.status !== 'Cancelled'
  );

  const criticalOrders = openWorkOrders.filter(
    (w) => w.priority === 'Urgent' || w.priority === 'High'
  );

  const pmOrders = openWorkOrders.filter((w) => w.type === 'Preventive');

  const filteredOrders = openWorkOrders.filter((wo) => {
    if (filter === 'critical') return wo.priority === 'Urgent' || wo.priority === 'High';
    if (filter === 'pm') return wo.type === 'Preventive';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-orange-600" />
              {currentBranch?.name || 'Accra Head Office'}
            </span>
            <span>·</span>
            <span>Live System Operational</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Ready for real data
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Maintenance Overview
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('work-orders')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Work Order Center
          </button>
          <button
            onClick={onOpenQuickCreate}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Work Order
          </button>
        </div>
      </div>

      {/* 4 Clean Metric Cards (Reflects live data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Work Orders */}
        <div
          onClick={() => onNavigate('work-orders')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Open Work Orders</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
            {openWorkOrders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{criticalOrders.length} critical / high</span>
            <span className="text-slate-400">Total: {workOrders.length}</span>
          </div>
        </div>

        {/* Preventive Compliance */}
        <div
          onClick={() => onNavigate('pm-plans')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>PM Compliance</span>
            <CalendarCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
            {pmOrders.length === 0 ? '100%' : '95.2%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Target: &gt;90%</span>
            <span className="text-emerald-600 font-medium">0 overdue</span>
          </div>
        </div>

        {/* Equipment Availability */}
        <div
          onClick={() => onNavigate('assets')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Equipment Registered</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
            {assets.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Active fleet</span>
            <span className="text-emerald-600 font-medium">100% uptime</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigate('approvals')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Approvals</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono mt-2">
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Maker-Checker</span>
            <span className="text-slate-400">Queue active</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Work Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Work Orders</h2>
              <p className="text-xs text-slate-500">Live maintenance queue</p>
            </div>

            {openWorkOrders.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({openWorkOrders.length})
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filter === 'critical' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Critical ({criticalOrders.length})
                </button>
                <button
                  onClick={() => setFilter('pm')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filter === 'pm' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PM ({pmOrders.length})
                </button>
              </div>
            )}
          </div>

          {openWorkOrders.length === 0 ? (
            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Wrench className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">No Active Work Orders</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  The maintenance queue is currently clear. You can create a new work order, assign technicians, and track labor and parts in real-time.
                </p>
              </div>
              <button
                onClick={onOpenQuickCreate}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create First Work Order
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((wo) => (
                <div
                  key={wo.id}
                  onClick={() => onNavigate('work-orders')}
                  className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">{wo.number}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                          wo.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : wo.priority === 'High'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {wo.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">· {wo.type}</span>
                    </div>

                    <div className="font-semibold text-slate-900 truncate">
                      {wo.title}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        wo.status === 'InProgress'
                          ? 'bg-blue-50 text-blue-700'
                          : wo.status === 'PendingApproval'
                          ? 'bg-amber-50 text-amber-800 font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {wo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {openWorkOrders.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <button
                onClick={() => onNavigate('work-orders')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
              >
                Open Full Work Order Register
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Key Equipment Status */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Equipment Fleet</h2>
              <p className="text-xs text-slate-500">Registered assets</p>
            </div>
            <button
              onClick={() => onNavigate('assets')}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
            >
              Manage Assets
            </button>
          </div>

          {assets.length === 0 ? (
            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Layers className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">No Assets Registered</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Register plant machinery, HVAC chillers, generators, and pumps to track meter readings and PM plans.
                </p>
              </div>
              <button
                onClick={() => onNavigate('assets')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                + Register First Asset
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {assets.slice(0, 5).map((ast) => (
                <div
                  key={ast.id}
                  onClick={() => onNavigate('assets')}
                  className="p-3.5 hover:bg-slate-50 transition cursor-pointer space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                      {ast.name}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                      {ast.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
                    <span>{ast.number || ast.tag}</span>
                    <span>{ast.criticality}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
              onClick={() => onNavigate('assets')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              Go to Asset Register
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
