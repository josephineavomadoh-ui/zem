/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Terminal,
  Play,
  HardDrive,
  Table,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';

interface TableStat {
  table: string;
  count: number;
}

interface DbStatus {
  engine: string;
  storage: string;
  status: string;
  tables: TableStat[];
  totalTables: number;
  totalRows: number;
}

export const PostgresInspectorView: React.FC = () => {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sql, setSql] = useState('SELECT id, number, title, status, priority, estimated_cost FROM work_orders LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/database/status');
      const data = await res.json();
      setStatus(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const runQuery = async (queryToRun?: string) => {
    const q = queryToRun || sql;
    setExecuting(true);
    setQueryError(null);
    try {
      const res = await fetch('/api/v1/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error || 'SQL Query failed');
        setQueryResult(null);
      } else {
        setQueryResult(data);
      }
      setExecuting(false);
    } catch (e: any) {
      setQueryError(e.message || 'Network error');
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    runQuery();
  }, []);

  const sampleQueries = [
    { label: 'Work Orders', query: 'SELECT id, number, title, status, priority, actual_cost FROM work_orders;' },
    { label: 'Assets', query: 'SELECT id, name, tag, status, criticality, purchase_cost FROM assets;' },
    { label: 'Users & Roles', query: 'SELECT id, name, email, role, access_scope, approval_limit FROM users;' },
    { label: 'Dual-Control Approvals', query: 'SELECT id, entity_type, summary, amount, status FROM approvals;' },
    { label: 'Cryptographic Audit Trail', query: 'SELECT id, at, actor_name, action, entity_type, hash FROM audit_log ORDER BY at DESC;' },
    { label: 'Stock Transactions', query: 'SELECT id, type, quantity, unit_cost, reference FROM stock_transactions;' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            PostgreSQL Database & Schema Inspector
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real embedded PostgreSQL 16 relational database engine with persistent disk storage
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Engine Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Database className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">Database Engine</span>
          </div>
          <div className="text-sm font-bold text-slate-900">PostgreSQL 16</div>
          <span className="text-[11px] text-emerald-600 font-medium">PGlite (Embedded WASM)</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HardDrive className="w-4 h-4 text-slate-600" />
            <span className="font-medium">Disk Persistence</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-900">data/postgres</div>
          <span className="text-[11px] text-slate-500">Persistent file storage</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Table className="w-4 h-4 text-orange-600" />
            <span className="font-medium">Total Tables</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{status?.totalTables || 15} Tables</div>
          <span className="text-[11px] text-slate-500">Full relational schema</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Total Rows</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{status?.totalRows || 0} Records</div>
          <span className="text-[11px] text-emerald-600 font-medium">Database Active</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Table className="w-4 h-4 text-slate-500" />
          PostgreSQL Tables & Live Record Counts
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {status?.tables.map((t) => (
            <button
              key={t.table}
              onClick={() => {
                const query = `SELECT * FROM ${t.table} LIMIT 25;`;
                setSql(query);
                runQuery(query);
              }}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-indigo-300 text-left transition-all"
            >
              <div className="font-mono text-xs font-bold text-slate-900 truncate">{t.table}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{t.count} rows</div>
            </button>
          ))}
        </div>
      </div>

      {/* SQL Query Console */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Interactive SQL Console</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Execute standard PostgreSQL SQL against the database
          </span>
        </div>

        {/* Quick query presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium text-[11px] shrink-0">Sample Queries:</span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setSql(sq.query);
                runQuery(sq.query);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap text-[11px] font-medium border border-slate-200"
            >
              {sq.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={3}
            className="w-full font-mono text-xs p-3 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 focus:outline-indigo-500"
            placeholder="SELECT * FROM work_orders;"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Target: <strong>PostgreSQL 16</strong>
          </span>
          <button
            onClick={() => runQuery()}
            disabled={executing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {executing ? 'Executing...' : 'Run SQL Query'}
          </button>
        </div>

        {/* Query Error */}
        {queryError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-mono">{queryError}</span>
          </div>
        )}

        {/* Query Results Table */}
        {queryResult && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Returned <strong className="text-slate-800">{queryResult.rowCount}</strong> row(s) in PostgreSQL
              </span>
              <span className="font-mono text-[10px] text-slate-400">{queryResult.command}</span>
            </div>

            <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-mono text-[11px] font-semibold sticky top-0">
                  <tr>
                    {queryResult.fields.map((f: string) => (
                      <th key={f} className="py-2.5 px-3 whitespace-nowrap">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {queryResult.rows.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80">
                      {queryResult.fields.map((f: string) => (
                        <td key={f} className="py-2 px-3 whitespace-nowrap text-slate-800 max-w-xs truncate">
                          {typeof row[f] === 'object' && row[f] !== null
                            ? JSON.stringify(row[f])
                            : String(row[f] ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {queryResult.rows.length === 0 && (
                    <tr>
                      <td colSpan={queryResult.fields.length || 1} className="py-6 text-center text-slate-400">
                        Query returned 0 rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
