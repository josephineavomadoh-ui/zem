/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkRequest } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  XCircle,
  QrCode,
  Smartphone,
  PhoneCall,
  Globe,
} from 'lucide-react';

interface WorkRequestsViewProps {
  onOpenCreate: () => void;
  onOpenTracker: (token: string) => void;
}

export const WorkRequestsView: React.FC<WorkRequestsViewProps> = ({
  onOpenCreate,
  onOpenTracker,
}) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reject modal
  const [selectedForReject, setSelectedForReject] = useState<WorkRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/v1/work-requests');
      const data = await res.json();
      setRequests(data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConvert = async (req: WorkRequest) => {
    if (!confirm(`Authorize and convert Request ${req.number} into a full Work Order?`)) return;
    try {
      const res = await fetch(`/api/v1/work-requests/${req.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!selectedForReject) return;
    try {
      const res = await fetch(`/api/v1/work-requests/${selectedForReject.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          status: 'Rejected',
          rejectionReason,
        }),
      });
      if (res.ok) {
        setSelectedForReject(null);
        setRejectionReason('');
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.number.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'QR':
        return <QrCode className="w-3.5 h-3.5 text-orange-600" />;
      case 'Portal':
        return <Globe className="w-3.5 h-3.5 text-sky-600" />;
      case 'WhatsApp':
      case 'Phone':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Smartphone className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-600" />
            Work Requests & Intake
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture fault reports from QR stickers, mobile web, and client portal without committing resources
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Submit Fault Report
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search request #, title, requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-orange-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted (New)</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Converted">Converted to WO</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Intake Source</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Public Tracking</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {req.number}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {getSourceIcon(req.source)}
                      {req.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-slate-800">{req.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{req.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={req.priority}>{req.priority}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{req.requesterName}</div>
                    <div className="text-[11px] text-slate-500">{req.requesterPhone || req.requesterEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={req.status}>{req.status}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenTracker(req.trackingToken)}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-800 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {req.trackingToken}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {req.status !== 'Converted' && req.status !== 'Rejected' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleConvert(req)}
                          title="Convert to Work Order"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-2xs flex items-center gap-1 transition-colors"
                        >
                          Convert to WO <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setSelectedForReject(req)}
                          title="Reject Request"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {req.status === 'Converted' ? 'Work Order Issued' : 'Closed (Rejected)'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No requests found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedForReject && (
        <Modal
          isOpen={Boolean(selectedForReject)}
          onClose={() => setSelectedForReject(null)}
          title={`Reject Work Request: ${selectedForReject.number}`}
          subtitle={selectedForReject.title}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Rejection Reason (Will be sent to requester)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Duplicate report, equipment out of warranty, or user error resolved."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForReject(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
