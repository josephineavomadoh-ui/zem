/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Part, StockTransaction, Store } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Package,
  History,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  AlertTriangle,
  Building,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface InventoryViewProps {
  initialTab?: 'parts' | 'ledger';
}

export const InventoryView: React.FC<InventoryViewProps> = ({ initialTab = 'parts' }) => {
  const { currentUser, currentBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState<'parts' | 'ledger'>(initialTab);
  const [parts, setParts] = useState<Part[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState(10);
  const [receiveStoreId, setReceiveStoreId] = useState('');
  const [receiveRef, setReceiveRef] = useState('');

  const fetchData = async () => {
    try {
      const [partsRes, stxRes, metaRes] = await Promise.all([
        fetch('/api/v1/parts'),
        fetch('/api/v1/stock-transactions'),
        fetch('/api/v1/meta'),
      ]);
      const prts = await partsRes.json();
      const stx = await stxRes.json();
      const meta = await metaRes.json();
      setParts(prts || []);
      setTransactions(stx || []);
      setStores(meta.stores || []);
      if (prts && prts[0]) setSelectedPartId(prts[0].id);
      if (meta.stores && meta.stores[0]) setReceiveStoreId(meta.stores[0].id);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/stock/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          partId: selectedPartId,
          quantity: receiveQuantity,
          storeId: receiveStoreId,
          reference: receiveRef || 'Direct Stock Replenishment',
        }),
      });
      if (res.ok) {
        setShowReceiveModal(false);
        setReceiveRef('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Inventory & Multi-Store Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only stock transaction ledger with strict Maker-Checker thresholds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setActiveTab('parts')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'parts'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Parts & Stock Levels
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Append-Only Ledger ({transactions.length})
            </button>
          </div>

          <button
            onClick={() => setShowReceiveModal(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Receive Stock
          </button>
        </div>
      </div>

      {/* Low Stock Reorder Notice */}
      {parts.some((p) => p.quantityOnHand <= p.reorderPoint) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Low Stock Alert: Several critical parts have breached their reorder thresholds and require replenishment.
            </span>
          </div>
          <button
            onClick={() => setShowReceiveModal(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs"
          >
            Replenish
          </button>
        </div>
      )}

      {/* Parts Table */}
      {activeTab === 'parts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search part name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-orange-500 bg-slate-50/50"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Part Name & Specs</th>
                  <th className="py-3 px-4">Unit of Measure</th>
                  <th className="py-3 px-4">On Hand / Reserved</th>
                  <th className="py-3 px-4">Reorder Point</th>
                  <th className="py-3 px-4">Standard Cost</th>
                  <th className="py-3 px-4">Billable Price</th>
                  <th className="py-3 px-4">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.map((p) => {
                  const isLow = p.quantityOnHand <= p.reorderPoint;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{p.description}</div>
                      </td>
                      <td className="py-3 px-4">{p.unitOfMeasure}</td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={isLow ? 'text-rose-600' : 'text-slate-900'}>
                          {p.quantityOnHand}
                        </span>{' '}
                        <span className="text-slate-400 font-normal">({p.quantityReserved} res)</span>
                      </td>
                      <td className="py-3 px-4">{p.reorderPoint} min</td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        ${p.standardCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-medium text-emerald-600">
                        ${p.billablePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Reorder Now
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Append-Only Ledger Table */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Immutable Stock Ledger
              </h3>
              <p className="text-[11px] text-slate-500">
                Every stock addition, issue, or transfer is an append-only audit truth
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {transactions.length} Ledger entries recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Part SKU & Name</th>
                  <th className="py-3 px-4">Store Location</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Quantity (Signed)</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isPositive = tx.quantity > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(tx.at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.partName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{tx.partSku}</div>
                      </td>
                      <td className="py-3 px-4">{tx.storeName}</td>
                      <td className="py-3 px-4">
                        <Badge status={tx.type}>{tx.type}</Badge>
                      </td>
                      <td
                        className={`py-3 px-4 font-mono font-bold ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        ${tx.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{tx.reference}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{tx.performedByName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Replenishment Modal */}
      {showReceiveModal && (
        <Modal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          title="Receive Stock Into Store"
          subtitle="Record goods arrival into inventory"
        >
          <form onSubmit={handleReceiveStock} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Select Part</label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
                required
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Quantity Received</label>
                <input
                  type="number"
                  min="1"
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Destination Store</label>
                <select
                  value={receiveStoreId}
                  onChange={(e) => setReceiveStoreId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
                  required
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Delivery Note / PO Reference
              </label>
              <input
                type="text"
                placeholder="e.g. GRN-2026-081 (PO-00041 Mantrac)"
                value={receiveRef}
                onChange={(e) => setReceiveRef(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Confirm Receipt & Append to Ledger
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
