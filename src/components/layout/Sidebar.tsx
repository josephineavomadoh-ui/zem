/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Layers,
  CalendarCheck,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  Building2,
  Users2,
  Settings,
  Database,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  Plus,
  QrCode,
  ExternalLink,
  Search,
  Check,
} from 'lucide-react';
import { User, Branch } from '../../types/index.ts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: 'gray' | 'red' | 'orange' | 'amber';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  onOpenQuickCreate?: () => void;
  onOpenQrScanner?: () => void;
  onOpenTicketTracker?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  onOpenQuickCreate,
  onOpenQrScanner,
  onOpenTicketTracker,
}) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    company,
    branches,
    currentBranchId,
    setCurrentBranchId,
  } = useAuth();

  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentBranch = branches.find((b: Branch) => b.id === currentBranchId) || branches[0];

  const [counts, setCounts] = useState({ workOrders: 0, workRequests: 0, pmPlans: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [woRes, reqRes] = await Promise.all([
          fetch('/api/v1/work-orders'),
          fetch('/api/v1/work-requests'),
        ]);
        if (woRes.ok && reqRes.ok) {
          const wos = await woRes.json();
          const reqs = await reqRes.json();
          setCounts({
            workOrders: Array.isArray(wos) ? wos.length : 0,
            workRequests: Array.isArray(reqs) ? reqs.length : 0,
            pmPlans: 0,
          });
        }
      } catch (e) {}
    };
    fetchCounts();
  }, [activeTab]);

  const navSections: NavSection[] = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'work-orders',
          label: 'Work Orders',
          icon: Wrench,
          badge: counts.workOrders > 0 ? counts.workOrders : undefined,
          badgeColor: 'gray',
        },
        {
          id: 'work-requests',
          label: 'Requests',
          icon: ClipboardList,
          badge: counts.workRequests > 0 ? counts.workRequests : undefined,
          badgeColor: 'gray',
        },
        { id: 'assets', label: 'Assets & Equipment', icon: Layers },
        {
          id: 'pm-plans',
          label: 'Preventive Maint.',
          icon: CalendarCheck,
          badge: counts.pmPlans > 0 ? counts.pmPlans : undefined,
          badgeColor: 'red',
        },
      ],
    },
    {
      title: 'SUPPLY & FINANCE',
      items: [
        { id: 'inventory', label: 'Inventory & Stock', icon: Package },
        { id: 'purchasing', label: 'Procurement', icon: Truck },
        { id: 'invoices', label: 'Finance & Billing', icon: CreditCard },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'organization', label: 'Organization', icon: Building2 },
        { id: 'users-roles', label: 'Users & Roles', icon: Users2 },
        { id: 'settings', label: 'System Settings', icon: Settings },
        { id: 'database', label: 'PostgreSQL Database', icon: Database },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0A1322] border-r border-slate-800 flex flex-col shrink-0 select-none text-slate-300 h-screen sticky top-0 z-30">
      {/* Brand & Organization Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-[#070D18]">
        {/* Brand identity */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_02.54.45_c28fdec9.jpeg"
            alt="ZemiFix Logo"
            className="w-8 h-8 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center text-lg font-bold tracking-tight">
              <span className="text-white">Zemi</span>
              <span className="text-orange-500 ml-0.5">Fix</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 ml-1.5">
                CMMS
              </span>
            </div>
          </div>
        </div>

        {/* Operating Branch Dropdown Selector */}
        <div className="relative mt-3">
          <button
            onClick={() => {
              setShowBranchDropdown(!showBranchDropdown);
              setShowUserDropdown(false);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <div className="truncate text-left">
                <span className="block font-medium truncate text-[11px] leading-tight">
                  {currentBranch?.name || 'Accra Head Office'}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {currentBranch?.code || 'ACC-HQ'} · Multi-Branch
                </span>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
          </button>

          {showBranchDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-[#0F172A] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-800">
                Switch Operating Branch
              </div>
              {branches.map((b: Branch) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setCurrentBranchId(b.id);
                    setShowBranchDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${
                    b.id === currentBranchId ? 'text-orange-400 font-semibold bg-slate-800/60' : 'text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{b.name}</div>
                    <div className="text-[10px] text-slate-400">{b.code} · {b.type}</div>
                  </div>
                  {b.id === currentBranchId && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mode Indicators */}
        <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-slate-800/60">
          <span className="text-slate-400 font-medium">Modes Active:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Facility + Contractor
          </span>
        </div>
      </div>


      {/* Nav Sections Scrollable */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor === 'red'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Specialized Fast Links */}
        <div className="space-y-0.5 pt-2 border-t border-slate-800/60">
          <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            RAPID WORKFLOWS
          </div>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'approvals'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-300/90 hover:text-white hover:bg-amber-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Approval Inbox</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('technician-pwa')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'technician-pwa'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-indigo-300/90 hover:text-white hover:bg-indigo-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Technician PWA</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Offline
            </span>
          </button>
        </div>
      </div>

      {/* Current User Persona Profile & Persona Switcher */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070D18] relative">
        <button
          onClick={() => {
            setShowUserDropdown(!showUserDropdown);
            setShowBranchDropdown(false);
          }}
          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-orange-400 truncate font-medium">
                {currentUser.role} · Ceiling: ${currentUser.approvalLimit?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>

        {showUserDropdown && (
          <div className="absolute left-2 right-2 bottom-full mb-1 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 border-b border-slate-800">
              <div className="text-xs font-bold text-white">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400">{currentUser.email}</div>
              <div className="text-[9px] text-emerald-400 font-mono mt-0.5">
                Scope: {currentUser.accessScope} · Limit: ${currentUser.approvalLimit?.toLocaleString() || '0'}
              </div>
            </div>

            <div className="px-3 py-1 text-[9px] font-bold uppercase text-slate-400 tracking-wider bg-slate-900/60">
              Switch Maker-Checker Persona
            </div>

            <div className="py-1">
              {availableUsers.map((u: User) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setShowUserDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 ${
                    u.id === currentUser.id ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.role}</div>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-1">
              <button
                onClick={() => {
                  setActiveTab('customer-portal');
                  setShowUserDropdown(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-sky-400 hover:bg-slate-800 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Customer Portal Mode
              </button>
            </div>
          </div>
        )}

        {/* Deployment status footer tag */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-800/50">
          <span>ZemiFix CMMS v1.0-RC</span>
          <span className="font-mono text-emerald-400 font-bold">PostgreSQL 16</span>
        </div>
      </div>
    </aside>
  );
};
