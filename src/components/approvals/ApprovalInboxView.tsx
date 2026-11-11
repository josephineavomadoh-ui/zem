/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ApprovalRequest } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Lock,
  Filter,
} from 'lucide-react';

export const ApprovalInboxView: React.FC = () => {
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'ALL'>('Pending');

  // Decision Modal
  const [selectedAppr, setSelectedAppr] = useState<ApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [decisionNote, setDecisionNote] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/v1/approvals');
      const data = await res.json();
      setApprovals(data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleOpenDecision = (appr: ApprovalRequest, type: 'Approved' | 'Rejected') => {
    setSelectedAppr(appr);
    setDecisionType(type);
    setDecisionNote('');
    setOtpCode('');
    setErrorMessage(null);
  };

  const handleConfirmDecision = async () => {
    if (!selectedAppr) return;
    setErrorMessage(null);

    // Rule: High-value approvals (> $1000) require step-up OTP
    if (selectedAppr.amount > 1000 && decisionType === 'Approved' && (!otpCode || otpCode.length < 4)) {
      setErrorMessage('High-value approval requires 4-digit Step-Up OTP verification.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/approvals/${selectedAppr.id}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          decision: decisionType,
          note: decisionNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Dual Control verification failed.');
        return;
      }

      setSelectedAppr(null);
      fetchApprovals();
    } catch (e) {
      setErrorMessage('Network request error.');
    }
  };

  const filteredApprovals = approvals.filter((a) =>
    statusFilter === 'ALL' ? true : a.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            Dual-Control Approval Inbox (Maker-Checker)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict separation of duties: no money or stock moves until authorized by an independent second checker
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter:</span>
          {(['Pending', 'Approved', 'Rejected', 'ALL'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Governance Explainer Card */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 shadow-md flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-2">
            Maker-Checker Invariant Enforced by Database Layer
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Rule 1: Maker cannot approve. If you keyed the transaction, the approval action is strictly blocked by the service.
            Rule 2: Transactions above limit remain in <code>PendingApproval</code> and do not affect stock or balances until approved.
          </p>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Entity Type & Number</th>
                <th className="py-3 px-4">Transaction Summary</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Maker (Originator)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4 text-right">Checker Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApprovals.map((appr) => {
                const isMaker = appr.makerId === currentUser.id;
                return (
                  <tr key={appr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <div>{appr.entityNumber}</div>
                      <span className="text-[10px] font-normal text-slate-500 font-sans">
                        {appr.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-800">{appr.summary}</div>
                      <div className="text-[10px] font-mono text-slate-400">Hash: {appr.payloadHash}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      ${appr.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{appr.makerName}</div>
                      <div className="text-[10px] text-slate-500">{appr.makerRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={appr.status}>{appr.status}</Badge>
                      {appr.checkerName && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          by {appr.checkerName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(appr.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {appr.status === 'Pending' ? (
                        isMaker ? (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-medium">
                              You are the Maker
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Switch user to Checker
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDecision(appr, 'Approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-2xs flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenDecision(appr, 'Rejected')}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded font-medium border border-slate-200 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          Decided ({appr.status})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredApprovals.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No approval requests found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedAppr && (
        <Modal
          isOpen={Boolean(selectedAppr)}
          onClose={() => setSelectedAppr(null)}
          title={`Dual Control Decision: ${selectedAppr.entityNumber}`}
          subtitle={`Acting Checker: ${currentUser.name} (${currentUser.role})`}
        >
          <div className="space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-800">{selectedAppr.summary}</div>
              <div className="text-slate-600">
                Amount: <strong className="text-slate-900">${selectedAppr.amount.toFixed(2)}</strong> · Maker: {selectedAppr.makerName}
              </div>
            </div>

            {/* Step-Up OTP if high value */}
            {selectedAppr.amount > 1000 && decisionType === 'Approved' && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  High-Value Step-Up Security OTP Required
                </div>
                <p className="text-[11px] text-amber-700">
                  Transactions above $1,000.00 require a 4-digit verification code. (Simulated code: <strong>8842</strong>)
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 4-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-36 text-center font-mono font-bold tracking-widest text-sm px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-orange-500"
                />
              </div>
            )}

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Checker Approval / Rejection Note
              </label>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Audit explanation for this decision..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAppr(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className={`px-4 py-1.5 font-semibold text-white rounded-lg shadow-xs ${
                  decisionType === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {decisionType}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
