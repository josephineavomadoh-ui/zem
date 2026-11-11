/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Asset, Location, AssetCategory } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Layers,
  Search,
  Filter,
  Plus,
  QrCode,
  Activity,
  Gauge,
  History,
  AlertTriangle,
  Printer,
  Calendar,
  Building,
} from 'lucide-react';

export const AssetRegisterView: React.FC = () => {
  const { currentUser, currentBranchId } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');

  // Detail Modal & Meter Modal
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [meterValue, setMeterValue] = useState<number>(0);
  const [meterUnit, setMeterUnit] = useState<string>('Hours');

  // Print QR Sheet Modal
  const [showQrSheetModal, setShowQrSheetModal] = useState(false);

  // New Asset Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssetData, setNewAssetData] = useState({
    name: '',
    tag: '',
    categoryId: 'cat-power',
    criticality: 'Medium',
    make: '',
    model: '',
    serialNumber: '',
    purchaseCost: 0,
    expectedLifeMonths: 120,
  });

  const fetchData = async () => {
    try {
      const [astRes, metaRes] = await Promise.all([
        fetch('/api/v1/assets'),
        fetch('/api/v1/meta'),
      ]);
      const ast = await astRes.json();
      const meta = await metaRes.json();
      setAssets(ast || []);
      setCategories(meta.categories || []);
      setLocations(meta.locations || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      const res = await fetch(`/api/v1/assets/${selectedAsset.id}/meter-readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          value: meterValue,
          unit: meterUnit,
        }),
      });
      if (res.ok) {
        setShowMeterModal(false);
        fetchData();
        setSelectedAsset({
          ...selectedAsset,
          meterReading: meterValue,
          meterUnit,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          ...newAssetData,
          branchId: currentBranchId,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewAssetData({
          name: '',
          tag: '',
          categoryId: 'cat-power',
          criticality: 'Medium',
          make: '',
          model: '',
          serialNumber: '',
          purchaseCost: 0,
          expectedLifeMonths: 120,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      a.number.toLowerCase().includes(search.toLowerCase()) ||
      a.make.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || a.categoryId === categoryFilter;
    const matchCriticality = criticalityFilter === 'ALL' || a.criticality === criticalityFilter;
    return matchSearch && matchCategory && matchCriticality;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-600" />
            Asset Register & Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Equipment lifecycle records, meter counters, downtime logs, and printable QR label badges
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowQrSheetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print QR Labels
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Asset
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search asset name, tag, serial #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-orange-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-orange-500 text-xs"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span>Criticality:</span>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-orange-500 text-xs"
            >
              <option value="ALL">All Criticalities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => setSelectedAsset(asset)}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs hover:border-orange-300 cursor-pointer transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {asset.tag}
                </span>
                <Badge status={asset.status}>{asset.status}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{asset.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {asset.make} {asset.model} · SN: {asset.serialNumber}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Badge status={asset.criticality}>{asset.criticality} Criticality</Badge>
                <span className="text-[11px] text-slate-500">
                  Value: ${asset.purchaseCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Meter Reading Footer */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Gauge className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-mono font-semibold">
                  {asset.meterReading ? `${asset.meterReading} ${asset.meterUnit || ''}` : 'No meter'}
                </span>
              </div>
              <span className="text-orange-600 font-semibold text-[11px] hover:underline">
                View Asset &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <Modal
          isOpen={Boolean(selectedAsset)}
          onClose={() => setSelectedAsset(null)}
          title={`Asset: ${selectedAsset.name}`}
          subtitle={`Tag: ${selectedAsset.tag} · ${selectedAsset.number}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Make & Model</span>
                <strong className="text-slate-800">{selectedAsset.make} {selectedAsset.model}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Serial Number</span>
                <strong className="text-slate-800 font-mono">{selectedAsset.serialNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Purchase Cost</span>
                <strong className="text-slate-800">${selectedAsset.purchaseCost.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Warranty Valid To</span>
                <strong className="text-slate-800">{selectedAsset.warrantyExpiry}</strong>
              </div>
            </div>

            {/* Current Meter reading display & update */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">Meter Reading / Operating Counter</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  {selectedAsset.meterReading || 0} {selectedAsset.meterUnit || 'Units'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMeterValue(selectedAsset.meterReading || 0);
                  setMeterUnit(selectedAsset.meterUnit || 'Running Hours');
                  setShowMeterModal(true);
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Update Meter
              </button>
            </div>

            {/* Printable QR Code Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg border border-slate-300 p-1 flex items-center justify-center">
                  <QrCode className="w-9 h-9 text-slate-900" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{selectedAsset.tag}</div>
                  <div className="text-[11px] text-slate-500">QR Token: {selectedAsset.qrToken}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Scannable by phone for instant fault reporting</div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Meter Reading Update Modal */}
      {showMeterModal && selectedAsset && (
        <Modal
          isOpen={showMeterModal}
          onClose={() => setShowMeterModal(false)}
          title={`Update Meter: ${selectedAsset.name}`}
          subtitle={`Tag: ${selectedAsset.tag}`}
        >
          <form onSubmit={handleRecordMeter} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                New Meter Value
              </label>
              <input
                type="number"
                step="0.1"
                value={meterValue}
                onChange={(e) => setMeterValue(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={meterUnit}
                onChange={(e) => setMeterUnit(e.target.value)}
                placeholder="e.g. Running Hours, PSI, Kilowatt-Hours"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMeterModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Save Reading
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Register New Asset Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Register New Organization Asset"
          subtitle="Add asset to central CMMS register"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. York 50-Ton Rooftop Air Handler"
                  value={newAssetData.name}
                  onChange={(e) => setNewAssetData({ ...newAssetData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Asset Tag (Unique)</label>
                <input
                  type="text"
                  placeholder="e.g. AHU-ROOF-04"
                  value={newAssetData.tag}
                  onChange={(e) => setNewAssetData({ ...newAssetData, tag: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Category</label>
                <select
                  value={newAssetData.categoryId}
                  onChange={(e) => setNewAssetData({ ...newAssetData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Criticality</label>
                <select
                  value={newAssetData.criticality}
                  onChange={(e) => setNewAssetData({ ...newAssetData, criticality: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Purchase Cost ($)</label>
                <input
                  type="number"
                  value={newAssetData.purchaseCost}
                  onChange={(e) => setNewAssetData({ ...newAssetData, purchaseCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Manufacturer (Make)</label>
                <input
                  type="text"
                  placeholder="e.g. Carrier, Perkins, Otis"
                  value={newAssetData.make}
                  onChange={(e) => setNewAssetData({ ...newAssetData, make: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Model</label>
                <input
                  type="text"
                  placeholder="e.g. Model X-200"
                  value={newAssetData.model}
                  onChange={(e) => setNewAssetData({ ...newAssetData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-882914"
                  value={newAssetData.serialNumber}
                  onChange={(e) => setNewAssetData({ ...newAssetData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Register Asset
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Printable QR Label Sheet Preview */}
      {showQrSheetModal && (
        <Modal
          isOpen={showQrSheetModal}
          onClose={() => setShowQrSheetModal(false)}
          title="Printable QR Code Asset Label Sheet"
          subtitle="Avery 5163 / Standard Industrial Waterproof Label Grid (2x3)"
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Stickers to stick on physical generators, chillers, and breaker panels for 30-second fault reporting.
              </p>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Labels
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-4 rounded-lg border-2 border-slate-300 flex flex-col justify-between items-center text-center space-y-2 shadow-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <img
                      src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_02.54.45_c28fdec9.jpeg"
                      alt="ZemiFix"
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-bold text-xs text-slate-900">ZemiFix Asset Tag</span>
                  </div>

                  <div className="p-2 border border-slate-200 rounded-md bg-slate-50">
                    <QrCode className="w-20 h-20 text-slate-950" />
                  </div>

                  <div>
                    <div className="font-mono font-bold text-xs text-slate-900">{a.tag}</div>
                    <div className="text-[11px] font-medium text-slate-700 truncate max-w-[180px]">
                      {a.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Scan to Report Fault or Maintenance
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
