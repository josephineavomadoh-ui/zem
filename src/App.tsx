/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard.tsx';
import { WorkOrdersView } from './components/work/WorkOrdersView.tsx';
import { WorkRequestsView } from './components/work/WorkRequestsView.tsx';
import { DispatchBoard } from './components/work/DispatchBoard.tsx';
import { TechnicianPwaView } from './components/technician/TechnicianPwaView.tsx';
import { AssetRegisterView } from './components/assets/AssetRegisterView.tsx';
import { PreventiveMaintenanceView } from './components/pm/PreventiveMaintenanceView.tsx';
import { InventoryView } from './components/inventory/InventoryView.tsx';
import { ContractorBillingView } from './components/contractor/ContractorBillingView.tsx';
import { ApprovalInboxView } from './components/approvals/ApprovalInboxView.tsx';
import { CustomerPortalView } from './components/portal/CustomerPortalView.tsx';
import { AuditTrailView } from './components/audit/AuditTrailView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { OrganizationView } from './components/admin/OrganizationView.tsx';
import { UsersRolesView } from './components/admin/UsersRolesView.tsx';
import { PostgresInspectorView } from './components/database/PostgresInspectorView.tsx';
import { QuickCreateModal } from './components/common/QuickCreateModal.tsx';
import { PublicQrReportModal } from './components/public/PublicQrReportModal.tsx';
import { PublicTicketTrackerModal } from './components/public/PublicTicketTrackerModal.tsx';
import {
  Search,
  Building2,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Plus,
  Database,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { Branch } from './types/index.ts';

function MainApp() {
  const {
    currentUser,
    branches,
    currentBranchId,
    setCurrentBranchId,
    company,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(2);

  // Modals state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showTicketTracker, setShowTicketTracker] = useState(false);
  const [trackedToken, setTrackedToken] = useState<string>('TRK-GEN-412');
  const [searchQuery, setSearchQuery] = useState('');

  const currentBranch = branches.find((b: Branch) => b.id === currentBranchId) || branches[0];

  const fetchApprovalsCount = async () => {
    try {
      const res = await fetch('/api/v1/approvals');
      if (res.ok) {
        const data = await res.json();
        const pending = (data || []).filter((a: any) => a.status === 'Pending').length;
        setPendingApprovalsCount(pending);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchApprovalsCount();
    const interval = setInterval(fetchApprovalsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenTrackerWithToken = (token: string) => {
    setTrackedToken(token);
    setShowTicketTracker(true);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Maintenance Dashboard';
      case 'work-orders':
        return 'Work Orders & Lifecycle Dispatch';
      case 'work-requests':
        return 'Work Requests & Fault Triage';
      case 'assets':
        return 'Assets & Equipment Register';
      case 'pm-plans':
        return 'Preventive Maintenance Schedules';
      case 'inventory':
        return 'Inventory & Stock Management';
      case 'purchasing':
        return 'Procurement & Purchase Orders';
      case 'invoices':
        return 'Finance & Billing Runs';
      case 'reports':
        return 'Reports & Operational Analytics';
      case 'organization':
        return 'Organization & Multi-Branch Hierarchy';
      case 'users-roles':
        return 'Users, Roles & Security Permissions';
      case 'settings':
        return 'System Configuration & Dual-Control Limits';
      case 'database':
        return 'PostgreSQL 16 Database Inspector';
      case 'dispatch-board':
        return 'Dispatch Calendar & Team Scheduling';
      case 'technician-pwa':
        return 'Technician Mobile PWA View';
      case 'approvals':
        return 'Maker-Checker Approval Inbox';
      case 'audit-trail':
        return 'Tamper-Evident SHA-256 Audit Trail';
      default:
        return 'CMMS Command Center';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Left Navigation Sidebar (Full Height, Vertical) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenQuickCreate={() => setShowQuickCreate(true)}
        onOpenQrScanner={() => setShowQrScanner(true)}
        onOpenTicketTracker={() => setShowTicketTracker(true)}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sleek Contextual Command Bar (Replaces bulky horizontal header) */}
        <header className="h-14 bg-white border-b border-slate-200/90 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0 select-none shadow-2xs z-20">
          {/* Breadcrumbs & Active Location context */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
              ZemiFix
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {getTabTitle(activeTab)}
            </h1>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded hidden md:inline">
              {currentBranch?.code || 'ACC-HQ'}
            </span>
          </div>

          {/* Quick Universal CMMS Search */}
          <div className="flex-1 max-w-sm mx-2 hidden md:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets, work orders, parts..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* System Telemetry & Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live PostgreSQL Database Health Indicator */}
            <button
              onClick={() => setActiveTab('database')}
              title="PostgreSQL 16 Embedded Relational Storage"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">PostgreSQL 16 Active</span>
            </button>

            {/* Quick QR Scanner */}
            <button
              onClick={() => setShowQrScanner(true)}
              title="Scan QR Code to Report Fault"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">QR Intake</span>
            </button>

            {/* Track Ticket shortcut */}
            <button
              onClick={() => setShowTicketTracker(true)}
              title="Track Work Request Status"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Track</span>
            </button>

            {/* Dual-Control Approval Quick Launcher */}
            <button
              onClick={() => setActiveTab('approvals')}
              title="Maker-Checker Approval Inbox"
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* + New Work Order CTA */}
            <button
              onClick={() => setShowQuickCreate(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Work</span>
            </button>
          </div>
        </header>

        {/* View Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/70">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              onNavigate={setActiveTab}
              onOpenQuickCreate={() => setShowQuickCreate(true)}
              onOpenQrScanner={() => setShowQrScanner(true)}
            />
          )}

          {activeTab === 'work-requests' && (
            <WorkRequestsView
              onOpenCreate={() => setShowQuickCreate(true)}
              onOpenTracker={handleOpenTrackerWithToken}
            />
          )}

          {activeTab === 'work-orders' && (
            <WorkOrdersView onOpenCreate={() => setShowQuickCreate(true)} />
          )}

          {activeTab === 'dispatch-board' && <DispatchBoard />}

          {activeTab === 'technician-pwa' && <TechnicianPwaView />}

          {(activeTab === 'assets' || activeTab === 'locations' || activeTab === 'qr-labels') && (
            <AssetRegisterView />
          )}

          {activeTab === 'pm-plans' && <PreventiveMaintenanceView />}

          {activeTab === 'inventory' && <InventoryView initialTab="parts" />}

          {activeTab === 'stock-ledger' && <InventoryView initialTab="ledger" />}

          {activeTab === 'purchasing' && <InventoryView initialTab="parts" />}

          {activeTab === 'customers' && <ContractorBillingView initialSubTab="customers" />}

          {activeTab === 'quotes' && <ContractorBillingView initialSubTab="quotes" />}

          {activeTab === 'invoices' && <ContractorBillingView initialSubTab="invoices" />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'organization' && <OrganizationView />}

          {activeTab === 'users-roles' && <UsersRolesView />}

          {activeTab === 'customer-portal' && <CustomerPortalView />}

          {activeTab === 'approvals' && <ApprovalInboxView />}

          {activeTab === 'database' && <PostgresInspectorView />}

          {activeTab === 'audit-trail' && <AuditTrailView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={() => {
          fetchApprovalsCount();
        }}
      />

      <PublicQrReportModal
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onOpenTracker={handleOpenTrackerWithToken}
      />

      <PublicTicketTrackerModal
        isOpen={showTicketTracker}
        onClose={() => setShowTicketTracker(false)}
        initialToken={trackedToken}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
