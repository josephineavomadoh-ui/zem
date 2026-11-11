/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkRequest, WorkOrder, Invoice, Quote } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  Building2,
  FileText,
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Star,
} from 'lucide-react';

export const CustomerPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'invoices' | 'quotes'>('overview');
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Form
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Medium');

  const fetchClientData = async () => {
    try {
      const [reqRes, woRes, invRes, quoRes] = await Promise.all([
        fetch('/api/v1/work-requests'),
        fetch('/api/v1/work-orders'),
        fetch('/api/v1/invoices'),
        fetch('/api/v1/quotes'),
      ]);
      const r = await reqRes.json();
      const w = await woRes.json();
      const i = await invRes.json();
      const q = await quoRes.json();

      setRequests(r || []);
      setOrders(w || []);
      setInvoices(i.invoices || []);
      setQuotes(q || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const handleCreateClientRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/work-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-kwame-boateng',
        },
        body: JSON.stringify({
          source: 'Portal',
          title,
          description: desc,
          priority,
          customerId: 'cust-ridge-hotel',
          requesterName: 'Michael Taylor',
          requesterEmail: 'mtaylor@ridgegrandhotel.com',
          requesterPhone: '+233 20 811 2233',
        }),
      });
      if (res.ok) {
        setShowNewRequest(false);
        setTitle('');
        setDesc('');
        fetchClientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Portal Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-lg text-white">
            RH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">The Ridge Grand Hotel & Suites</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Active Client Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Contact: Michael Taylor (Director of Engineering) · Contract: SLA-2026-081
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewRequest(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Report Site Issue
        </button>
      </div>

      {/* Portal Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Dashboard & Active Jobs' },
          { id: 'requests', label: `My Service Requests (${requests.length})` },
          { id: 'invoices', label: `Invoices & Statements (${invoices.length})` },
          { id: 'quotes', label: `Quotes for Approval (${quotes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Active Work Requests</span>
              <div className="text-2xl font-bold text-slate-900">{requests.length}</div>
              <span className="text-[11px] text-emerald-600">SLA 100% On-Track</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Service Contract Type</span>
              <div className="text-lg font-bold text-slate-900">Comprehensive PM</div>
              <span className="text-[11px] text-slate-500">Covers Chiller & Power Plant</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500">Current Outstanding Balance</span>
              <div className="text-2xl font-bold text-slate-900">$4,250.00</div>
              <span className="text-[11px] text-amber-600 font-medium">Due in 20 days</span>
            </div>
          </div>

          {/* Active Job Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Live Maintenance Jobs On-Site
            </h3>

            <div className="divide-y divide-slate-100">
              {orders.map((wo) => (
                <div key={wo.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">{wo.number}</span>
                    <Badge status={wo.status}>{wo.status}</Badge>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs">{wo.title}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Assigned: <strong>{wo.assignedToName || 'Technician Assigned'}</strong></span>
                    <span>Target: Today</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Submitted Maintenance Requests</h3>
            <button
              onClick={() => setShowNewRequest(true)}
              className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg"
            >
              + New Request
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{r.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {r.number} · Tracking Token: <span className="font-mono font-semibold text-sky-600">{r.trackingToken}</span>
                  </div>
                </div>
                <Badge status={r.status}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Contractor Billing Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Due</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.number}</td>
                    <td className="py-2.5 px-3">{inv.issueDate}</td>
                    <td className="py-2.5 px-3">{inv.dueDate}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">${inv.total.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <Badge status={inv.status}>{inv.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => alert(`Opening secure checkout payment link for Invoice ${inv.number}...`)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs"
                      >
                        Pay Online
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Quotes */}
      {activeTab === 'quotes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Estimates & Quotes for Approval</h3>
          <div className="divide-y divide-slate-100">
            {quotes.map((q) => (
              <div key={q.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{q.number}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Total: ${q.total.toFixed(2)} · Valid until {q.validUntil}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Quote ${q.number} accepted and approved! Work order will be issued.`)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
                  >
                    Approve Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <Modal
          isOpen={showNewRequest}
          onClose={() => setShowNewRequest(false)}
          title="Submit New Site Maintenance Request"
          subtitle="Ridge Grand Hotel Facility Services"
        >
          <form onSubmit={handleCreateClientRequest} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Issue Headline</label>
              <input
                type="text"
                placeholder="e.g. Banquet hall cold room temperature rising"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Detailed Description</label>
              <textarea
                placeholder="Describe what occurred, location details, symptoms..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
              >
                <option value="Low">Low - Routine</option>
                <option value="Medium">Medium - Standard (24hr SLA)</option>
                <option value="High">High - Urgent Guest Impact (4hr SLA)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRequest(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
