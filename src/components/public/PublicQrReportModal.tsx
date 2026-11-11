/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { QrCode, CheckCircle, Camera, ExternalLink, ArrowRight } from 'lucide-react';

interface PublicQrReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTracker: (token: string) => void;
}

export const PublicQrReportModal: React.FC<PublicQrReportModalProps> = ({
  isOpen,
  onClose,
  onOpenTracker,
}) => {
  const [assetTag, setAssetTag] = useState('GEN-250-PERK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');

  const [submittedToken, setSubmittedToken] = useState<string | null>(null);
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/public/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetTag,
          title,
          description,
          priority,
          requesterName,
          requesterPhone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedToken(data.trackingToken);
        setSubmittedNumber(data.number);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setSubmittedToken(null);
    setSubmittedNumber(null);
    setTitle('');
    setDescription('');
    setRequesterName('');
    setRequesterPhone('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Scan-to-Report Fault (No Login Required)"
      subtitle="Public fault intake triggered by scanning QR code on equipment or doors"
      maxWidth="md"
    >
      {submittedToken ? (
        <div className="text-center py-6 space-y-4 text-xs">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Fault Report Successfully Logged!
            </h3>
            <p className="text-slate-500 mt-1">
              Your report has been assigned reference number <strong className="text-slate-800">{submittedNumber}</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Public Tracking Token</span>
            <div className="font-mono text-base font-bold text-sky-600">{submittedToken}</div>
            <p className="text-[11px] text-slate-500">
              Bookmark or copy this token to check real-time technician progress and ETA without logging in.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                const tok = submittedToken;
                handleReset();
                onOpenTracker(tok);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Ticket Progress
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Scanned Tag Header */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-5 h-5 text-orange-600" />
              <div>
                <span className="text-[10px] font-semibold text-orange-700 uppercase">Scanned Equipment Tag</span>
                <div className="font-mono font-bold text-slate-900">{assetTag}</div>
              </div>
            </div>
            <span className="text-[10px] text-orange-600 font-medium">Verified Location</span>
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">What is the problem?</label>
            <input
              type="text"
              placeholder="e.g. Unusual grinding noise, cooling water leak, or tripping circuit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
              required
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">More Details</label>
            <textarea
              placeholder="Provide any additional observations, room numbers, or symptoms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Kwame Mensah"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>
            <div>
              <label className="font-medium text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +233 24 123 4567"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Submit 30-Second Report
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
