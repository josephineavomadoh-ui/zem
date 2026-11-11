/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ClipboardList,
  Wrench,
  Layers,
  Package,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentBranchId } = useAuth();
  const [createType, setCreateType] = useState<'request' | 'order' | 'quote'>('order');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [type, setType] = useState('Corrective');
  const [estimatedCost, setEstimatedCost] = useState(150);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (createType === 'order') {
        await fetch('/api/v1/work-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({
            title,
            description,
            priority,
            type,
            estimatedCost,
            estimatedHours,
            branchId: currentBranchId,
            tasks: [
              { sequence: 1, description: 'Perform initial safety assessment and lock-out', type: 'Check' },
              { sequence: 2, description: 'Execute repair or servicing according to manual', type: 'Check' },
              { sequence: 3, description: 'Verify operational readings and upload completion photo', type: 'Photo' },
            ],
          }),
        });
      } else if (createType === 'request') {
        await fetch('/api/v1/work-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({
            source: 'Web',
            title,
            description,
            priority,
            branchId: currentBranchId,
          }),
        });
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Maintenance Record"
      subtitle="Quick initiation for work orders and requests"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setCreateType('order')}
            className={`py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
              createType === 'order'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-orange-600" />
            Work Order
          </button>
          <button
            type="button"
            onClick={() => setCreateType('request')}
            className={`py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
              createType === 'request'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-orange-600" />
            Work Request
          </button>
        </div>

        <div>
          <label className="font-medium text-slate-700 block mb-1">Title / Summary</label>
          <input
            type="text"
            placeholder={
              createType === 'order'
                ? 'e.g. Emergency Overhaul on Standby Generator ATS'
                : 'e.g. Water dripping from ceiling in Room 204'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
            required
          />
        </div>

        <div>
          <label className="font-medium text-slate-700 block mb-1">Description</label>
          <textarea
            placeholder="Detailed scope, location, symptoms, or maintenance steps..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {createType === 'order' ? (
            <div>
              <label className="font-medium text-slate-700 block mb-1">Order Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
              >
                <option value="Corrective">Corrective</option>
                <option value="Preventive">Preventive</option>
                <option value="Inspection">Inspection</option>
                <option value="Emergency">Emergency</option>
                <option value="Installation">Installation</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="font-medium text-slate-700 block mb-1">Origin Source</label>
              <input
                type="text"
                value="Internal Staff Web"
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
          )}
        </div>

        {createType === 'order' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Costs &gt; $1,000 enter Dual-Control
              </span>
            </div>
            <div>
              <label className="font-medium text-slate-700 block mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            {loading ? 'Creating...' : `Create ${createType === 'order' ? 'Work Order' : 'Request'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
