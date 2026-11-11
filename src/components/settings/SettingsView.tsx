/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Settings,
  Building2,
  Layers,
  ShieldCheck,
  Check,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  GitFork,
  Briefcase,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { company, branches, refreshMeta } = useAuth();

  const [facilityMode, setFacilityMode] = useState(company?.modes.facility ?? true);
  const [contractorMode, setContractorMode] = useState(company?.modes.contractor ?? true);
  const [stockIssueLimit, setStockIssueLimit] = useState(company?.autoApproveLimits.stockIssue ?? 250);
  const [workOrderCostLimit, setWorkOrderCostLimit] = useState(company?.autoApproveLimits.workOrderCost ?? 1000);
  const [currencySymbol, setCurrencySymbol] = useState(company?.currencySymbol ?? '$');
  const [baseCurrency, setBaseCurrency] = useState(company?.baseCurrency ?? 'USD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/company/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modes: {
            facility: facilityMode,
            contractor: contractorMode,
          },
          autoApproveLimits: {
            stockIssue: stockIssueLimit,
            workOrderCost: workOrderCostLimit,
          },
          currencySymbol,
          baseCurrency,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        refreshMeta();
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          System Configuration & Organization
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Single company deployment configuration, dual-control limits, and operating modes
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-xl flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600" />
          Company settings and dual-control thresholds successfully updated!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Operating Modes Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Operating Modes (Section 1.1)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn on one or both modes in settings. Every module is tailored to the active modes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Facility Mode (Priority 1)
                </span>
                <button
                  type="button"
                  onClick={() => setFacilityMode(!facilityMode)}
                  className="text-emerald-600"
                >
                  {facilityMode ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Hotels, clinics, hospitals, schools, factories. Registers company's own assets, schedules preventive maintenance, handles internal fault requests, tracks downtime and cost per asset.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Contractor Mode (Priority 2)
                </span>
                <button
                  type="button"
                  onClick={() => setContractorMode(!contractorMode)}
                  className="text-blue-600"
                >
                  {contractorMode ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Maintenance and repair companies working for clients. Adds customers, sites, contracts and SLAs, quotes, billable jobs, gapless invoices, statements, and customer self-service portal.
              </p>
            </div>
          </div>
        </div>

        {/* Dual Control Limits */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Dual-Control Ceilings & Auto-Approve Thresholds (Section 5.6)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transactions below the limit post immediately; items exceeding the limit enter the Approval Inbox for Maker-Checker review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Stock Issue Auto-Approve Limit ($)
              </label>
              <input
                type="number"
                value={stockIssueLimit}
                onChange={(e) => setStockIssueLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-mono font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Any technician part issue exceeding this value requires supervisor approval before decrementing inventory.
              </span>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Work Order Cost Limit ($)
              </label>
              <input
                type="number"
                value={workOrderCostLimit}
                onChange={(e) => setWorkOrderCostLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-mono font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Work orders with estimated cost above this ceiling require manager authorization to move from Draft to Open.
              </span>
            </div>
          </div>
        </div>

        {/* Branch Hierarchy Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-orange-600" />
              Organizational Branch Tree (Section 1.3)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Branches nest to any depth with localized invoice prefixes and independent stores
            </p>
          </div>

          <div className="space-y-2">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{b.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Code: {b.code} · Type: {b.type} · Path: {b.path}
                  </div>
                </div>
                <span className="font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                  Prefix: {b.invoicePrefix || 'STD'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            Save All Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
