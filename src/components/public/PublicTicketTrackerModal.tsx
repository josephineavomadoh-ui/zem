/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Badge } from '../common/Badge.tsx';
import {
  Search,
  CheckCircle,
  Clock,
  Wrench,
  User,
  Star,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface PublicTicketTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
}

export const PublicTicketTrackerModal: React.FC<PublicTicketTrackerModalProps> = ({
  isOpen,
  onClose,
  initialToken = 'TRK-GEN-412',
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/track/${token.trim()}`);
      if (!res.ok) {
        setError('No record found for tracking token.');
        setTicketData(null);
      } else {
        const data = await res.json();
        setTicketData(data);
      }
      setLoading(false);
    } catch (e) {
      setError('Failed to reach tracking server.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken && isOpen) {
      setTokenInput(initialToken);
      fetchStatus(initialToken);
    }
  }, [initialToken, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Public Repair Progress Tracker"
      subtitle="Real-time transparency on fault resolution without logging in"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Token Search bar */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter tracking token (e.g. TRK-GEN-412)"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-mono font-semibold"
          />
          <button
            onClick={() => fetchStatus(tokenInput)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs"
          >
            Track
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {error}
          </div>
        )}

        {ticketData && (
          <div className="space-y-5 pt-2">
            {/* Header Fact card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {ticketData.request.number}
                </span>
                <Badge status={ticketData.request.status}>{ticketData.request.status}</Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{ticketData.request.title}</h3>
              <p className="text-slate-500 text-[11px]">{ticketData.request.description}</p>
            </div>

            {/* Stepper Progress */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Resolution Timeline
              </span>

              <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4">
                <div className="relative">
                  <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
                  <div className="font-semibold text-slate-900">1. Fault Request Received</div>
                  <div className="text-[10px] text-slate-500">
                    Logged via QR Scan · Reference {ticketData.request.number}
                  </div>
                </div>

                <div className="relative">
                  <span
                    className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      ticketData.request.status !== 'Submitted'
                        ? 'bg-emerald-500 ring-1 ring-emerald-200'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="font-semibold text-slate-900">2. Supervisor Triage & Review</div>
                  <div className="text-[10px] text-slate-500">
                    {ticketData.request.status !== 'Submitted' ? 'Triaged & Verified' : 'Under Review'}
                  </div>
                </div>

                <div className="relative">
                  <span
                    className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      ticketData.workOrder ? 'bg-emerald-500 ring-1 ring-emerald-200' : 'bg-slate-300'
                    }`}
                  />
                  <div className="font-semibold text-slate-900">3. Work Order Dispatched</div>
                  <div className="text-[10px] text-slate-500">
                    {ticketData.workOrder
                      ? `Assigned to: ${ticketData.workOrder.assignedToName || 'Power & HVAC Crew'}`
                      : 'Pending technician schedule'}
                  </div>
                </div>

                <div className="relative">
                  <span
                    className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      ticketData.workOrder?.status === 'Completed' || ticketData.workOrder?.status === 'Closed'
                        ? 'bg-emerald-500 ring-1 ring-emerald-200'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="font-semibold text-slate-900">4. Physical Repair & Verification</div>
                  <div className="text-[10px] text-slate-500">
                    {ticketData.workOrder?.status === 'Completed' || ticketData.workOrder?.status === 'Closed'
                      ? 'Completed & Verified on-site'
                      : 'In Progress'}
                  </div>
                </div>
              </div>
            </div>

            {/* Satisfaction Rating on Completion */}
            {ticketData.workOrder?.status === 'Completed' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                <span className="font-semibold text-emerald-800 text-xs">
                  Work has been completed on-site!
                </span>
                <p className="text-[11px] text-emerald-600">
                  Thank you for reporting this issue and keeping our facility safe and operational.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
