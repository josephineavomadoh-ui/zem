/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PmPlan, ChecklistTemplate } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CalendarCheck,
  Play,
  Plus,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const PreventiveMaintenanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<PmPlan[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  const fetchPM = async () => {
    try {
      const res = await fetch('/api/v1/pm-plans');
      const data = await res.json();
      setPlans(data.plans || []);
      setTemplates(data.templates || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPM();
  }, []);

  const handleRunGeneration = async () => {
    try {
      setGenerationResult('Running idempotent PM generation engine...');
      const res = await fetch('/api/v1/pm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setGenerationResult(
          `Success: Generated ${data.count} preventive work orders idempotently with checklists & parts kit!`
        );
        fetchPM();
      }
    } catch (e) {
      setGenerationResult('Failed to run generation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-purple-600" />
            Preventive Maintenance (PM) Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Idempotent generation, time & meter based triggers, and standardized checklist templates
          </p>
        </div>

        <button
          onClick={handleRunGeneration}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Run PM Generation Batch
        </button>
      </div>

      {generationResult && (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-medium text-purple-900 flex items-center justify-between shadow-2xs">
          <span>{generationResult}</span>
          <button
            onClick={() => setGenerationResult(null)}
            className="text-purple-700 hover:text-purple-900 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Plans List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Active Maintenance Schedules
        </h3>

        <div className="divide-y divide-slate-100">
          {plans.map((p) => {
            const template = templates.find((t) => t.id === p.checklistTemplateId);
            return (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    <Badge status="Active">Active</Badge>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      Trigger: Every {p.intervalValue} {p.intervalUnit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Template: <strong className="text-slate-700">{template?.name || 'Standard Service'}</strong> · Next Due Date:{' '}
                    <span className="font-semibold text-slate-800">{p.nextDueDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Lead time: {p.leadTimeDays} days
                  </span>
                  <button
                    onClick={handleRunGeneration}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    Generate Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist Templates Library */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Checklist Templates Library
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">{tmpl.name}</h4>
                <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Est: {tmpl.estimatedHours} hrs
                </span>
              </div>
              <p className="text-xs text-slate-500">{tmpl.description}</p>
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tasks Checklist</span>
                {tmpl.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-xs text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.description}</span>
                  </div>
                ))}
                {tmpl.items.length > 3 && (
                  <span className="text-[11px] text-slate-400 italic">
                    +{tmpl.items.length - 3} more inspection items
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
