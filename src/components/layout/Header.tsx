/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bell,
  Search,
  Plus,
  ShieldCheck,
  Building2,
  QrCode,
  Smartphone,
  ExternalLink,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickCreate: () => void;
  onOpenQrScanner: () => void;
  onOpenTicketTracker: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickCreate,
  onOpenQrScanner,
  onOpenTicketTracker,
  setActiveTab,
  pendingApprovalsCount,
}) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    branches,
    currentBranchId,
    setCurrentBranchId,
    company,
  } = useAuth();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 select-none">
      {/* Brand logo & Branch selector */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_02.54.45_c28fdec9.jpeg"
            alt="ZemiFix Logo"
            className="w-9 h-9 rounded-lg object-cover shadow-xs border border-slate-700 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-lg font-bold tracking-tight text-white">Zemi</span>
              <span className="text-lg font-bold tracking-tight text-orange-500">Fix</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 ml-1">
                CMMS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 tracking-tight font-medium mt-0.5">
              Enterprise Maintenance
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Branch Scope selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setShowBranchDropdown(!showBranchDropdown);
              setShowUserDropdown(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-medium truncate max-w-[150px]">
              {currentBranch?.name || 'Head Office'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showBranchDropdown && (
            <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-800">
                Operating Branch
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setCurrentBranchId(b.id);
                    setShowBranchDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${
                    b.id === currentBranchId ? 'text-orange-400 font-semibold bg-slate-800/50' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div>{b.name}</div>
                    <div className="text-[10px] text-slate-500">{b.code} · {b.type}</div>
                  </div>
                  {b.id === currentBranchId && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active mode indicators */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px]">
          {company?.modes.facility && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Facility
            </span>
          )}
          <span className="text-slate-500">+</span>
          {company?.modes.contractor && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Contractor
            </span>
          )}
        </div>
      </div>

      {/* Prominent Search Bar from Laptop Screen */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search branches, departments, staff..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 placeholder-slate-400 focus:outline-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* Global Actions, Search, Persona Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Quick Public QR Scan & Track shortcuts */}
        <button
          onClick={onOpenQrScanner}
          title="Scan QR Code to Report Fault"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">QR Scan</span>
        </button>

        <button
          onClick={onOpenTicketTracker}
          title="Track Work Request Status"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Track Ticket</span>
        </button>

        {/* PWA Mobile Mode toggle */}
        <button
          onClick={() => setActiveTab('technician-pwa')}
          title="Technician Offline-Ready Mobile View"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Tech PWA</span>
        </button>

        {/* Dual-Control Approval Inbox Button */}
        <button
          onClick={() => setActiveTab('approvals')}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Quick Create Button */}
        <button
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Work</span>
        </button>

        {/* Persona Switcher Dropdown (Crucial for dual control testing!) */}
        <div className="relative ml-1">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowBranchDropdown(false);
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-[11px] text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-medium leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-orange-400 leading-none mt-0.5">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-300">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    Role: {currentUser.role}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    Scope: {currentUser.accessScope}
                  </span>
                </div>
              </div>

              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider bg-slate-950/40">
                Switch Role / Dual-Control Persona
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${
                      u.id === currentUser.id ? 'bg-slate-800/80 text-orange-400 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.role} · {u.branchId.replace('br-', '').toUpperCase()}</div>
                    </div>
                    {u.id === currentUser.id ? (
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                    ) : (
                      <span className="text-[10px] text-slate-500">Switch</span>
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
                  className="w-full text-left px-3 py-2 text-xs text-sky-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View as Customer Portal Contact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
