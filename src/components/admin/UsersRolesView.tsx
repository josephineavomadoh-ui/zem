/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Users2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Building2,
  DollarSign,
  KeyRound,
  Check,
  X,
  Database,
} from 'lucide-react';
import { User, UserRole, Branch, Department } from '../../types/index.ts';

export const UsersRolesView: React.FC = () => {
  const { users, branches, departments, teams, refreshMeta, currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'matrix' | 'policies'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Technician' as UserRole,
    branchId: branches[0]?.id || 'br-accra-hq',
    departmentId: departments[0]?.id || 'dept-engineering',
    accessScope: 'Branch' as User['accessScope'],
    approvalLimit: 500,
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        showToast(`User "${newUser.name}" successfully provisioned and written to PostgreSQL!`);
        setShowAddUserModal(false);
        setNewUser({
          name: '',
          email: '',
          phone: '',
          role: 'Technician',
          branchId: branches[0]?.id || 'br-accra-hq',
          departmentId: departments[0]?.id || 'dept-engineering',
          accessScope: 'Branch',
          approvalLimit: 500,
        });
        refreshMeta();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Could not create user'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const filteredUsers = users.filter((u: User) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesBranch = branchFilter === 'ALL' || u.branchId === branchFilter;
    return matchesSearch && matchesRole && matchesBranch;
  });

  const allRoles: UserRole[] = [
    'Admin',
    'Manager',
    'Supervisor',
    'Planner',
    'Technician',
    'Storekeeper',
    'Finance',
    'Auditor',
    'Cashier',
  ];

  const permissionMatrix = [
    { module: 'Work Requests', admin: 'Full', manager: 'Full', dispatcher: 'Triage/Assign', lead: 'View/Create', tech: 'Create', clerk: 'View', finance: 'View', req: 'Create/Track', auditor: 'Read-Only' },
    { module: 'Work Orders', admin: 'Full', manager: 'Full', dispatcher: 'Assign/Schedule', lead: 'Execute/Approve', tech: 'Execute/Clock', clerk: 'Issue Parts', finance: 'View Cost', req: 'None', auditor: 'Read-Only' },
    { module: 'Asset Register', admin: 'Full', manager: 'Full', dispatcher: 'View', lead: 'Update/Meters', tech: 'Scan/Read', clerk: 'View', finance: 'Asset Costs', req: 'View Public', auditor: 'Read-Only' },
    { module: 'Preventive Maint.', admin: 'Full', manager: 'Full', dispatcher: 'Schedule', lead: 'Execute', tech: 'Execute', clerk: 'Kit Parts', finance: 'None', req: 'None', auditor: 'Read-Only' },
    { module: 'Inventory & Stock', admin: 'Full', manager: 'Adjust/Transfer', dispatcher: 'View Stock', lead: 'Request', tech: 'Consume', clerk: 'Full Stores', finance: 'Valuation', req: 'None', auditor: 'Read-Only' },
    { module: 'Quotes & Invoices', admin: 'Full', manager: 'Review/Issue', dispatcher: 'None', lead: 'None', tech: 'None', clerk: 'None', finance: 'Full Ledger', req: 'View Billed', auditor: 'Read-Only' },
    { module: 'Dual-Control Approvals', admin: 'Super-Checker', manager: 'Checker (≤$25k)', dispatcher: 'None', lead: 'Maker', tech: 'Maker (≤$500)', clerk: 'Maker/Checker', finance: 'Checker (Invoices)', req: 'None', auditor: 'Log Audit' },
    { module: 'Tamper-Evident Audit', admin: 'Verify Chain', manager: 'View Logs', dispatcher: 'None', lead: 'None', tech: 'None', clerk: 'None', finance: 'View Financial', req: 'None', auditor: 'Full Verify' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Users2 className="w-4 h-4 text-orange-600" />
            Administration · Section 1.4 & Section 2
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            Users, Roles & Security Access
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC), Maker-Checker dual control assignments, and access scope boundaries.
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Registered Users</span>
            <Users2 className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active enterprise accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Configured Roles</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">{allRoles.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Granular RBAC profiles</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Dual-Control Enforced</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1 font-mono">
            <Check className="w-4 h-4" />
            Maker ≠ Checker
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zero self-approvals permitted</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>PostgreSQL Synchronized</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-indigo-600 mt-2 flex items-center gap-1 font-mono">
            <Check className="w-4 h-4" />
            table: users
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Optimistic concurrency versioning</div>
        </div>
      </div>

      {/* Subtab Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            RBAC Permission Matrix
          </button>
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubTab === 'policies'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security & Maker-Checker Policies
          </button>
        </div>

        {activeSubTab === 'users' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, email, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-orange-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-orange-500 font-medium"
            >
              <option value="ALL">All Roles</option>
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-orange-500 font-medium"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SUBTAB: USERS */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enterprise User Directory</h3>
              <p className="text-xs text-slate-500">Staff profiles, assigned branches, access scopes, and approval ceilings</p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredUsers.length} of {users.length} staff
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Branch & Scope</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Approval Ceiling</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u: User) => {
                  const branch = branches.find((b: Branch) => b.id === u.branchId);
                  const dept = departments.find((d: Department) => d.id === u.departmentId);
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded font-bold">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                            u.role === 'Admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'Manager' || u.role === 'Supervisor'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : u.role === 'Technician' || u.role === 'Planner'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : u.role === 'Storekeeper'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : u.role === 'Finance' || u.role === 'Cashier'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{branch?.name || 'All Branches'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Scope: <span className="text-slate-600 font-semibold">{u.accessScope}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700">{dept?.name || 'General Operations'}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {u.approvalLimit && u.approvalLimit > 0
                          ? `$${u.approvalLimit.toLocaleString()}`
                          : '$0 (No approval authority)'}
                      </td>

                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Inactive</span>
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

      {/* SUBTAB: PERMISSION MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">RBAC Granular Permission Matrix (Section 2.1)</h3>
            <p className="text-xs text-slate-500">Operational privileges per functional role across maintenance modules</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-900 text-white font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-800">Module</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Sys Admin</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Maint Manager</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Dispatcher</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Lead Tech</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Field Tech</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Inv Clerk</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Finance</th>
                  <th className="py-2.5 px-3">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {permissionMatrix.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{row.module}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold text-purple-700">{row.admin}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-blue-700 font-medium">{row.manager}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{row.dispatcher}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{row.lead}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{row.tech}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-emerald-700 font-medium">{row.clerk}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-cyan-700 font-medium">{row.finance}</td>
                    <td className="py-2 px-3 text-slate-500 font-medium">{row.auditor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: POLICIES */}
      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-orange-600" />
              Maker-Checker Dual Control Rule (Section 5.6)
            </div>
            <p className="text-xs text-slate-600">
              To prevent financial leakage and unauthorized asset modifications, ZemiFix strictly enforces the separation of duties:
            </p>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>
                <strong>Checker ID cannot match Maker ID:</strong> An author who drafts an invoice or submits a stock requisition above their threshold cannot self-approve.
              </li>
              <li>
                <strong>High-Value Step-Up OTP:</strong> Actions exceeding company ceilings require time-based OTP confirmation before release.
              </li>
              <li>
                <strong>Collusion Detection:</strong> The audit trail checks for pairs of users who repeatedly cross-approve reciprocal requests.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              Session & Password Policies (Section 2.3)
            </div>
            <p className="text-xs text-slate-600">
              Enterprise security safeguards active across mobile PWA and desktop web portals:
            </p>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>
                <strong>Max Session Duration:</strong> 8 hours active session duration before re-authentication is required.
              </li>
              <li>
                <strong>Idle Inactivity Timeout:</strong> Automatic screen lock after 120 minutes of inactivity.
              </li>
              <li>
                <strong>Cryptographic Audit Hashing:</strong> Every security event is chained with SHA-256 hash validation.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users2 className="w-5 h-5 text-orange-600" />
                Provision New Staff Member
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emmanuel Quaye"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.quaye@zemifix.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Functional Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-medium"
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Access Scope</label>
                  <select
                    value={newUser.accessScope}
                    onChange={(e) => setNewUser({ ...newUser, accessScope: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-medium"
                  >
                    <option value="Company">Company (All Branches)</option>
                    <option value="Branch">Branch (Assigned Branch)</option>
                    <option value="Team">Team (Assigned Crew)</option>
                    <option value="Self">Self (Only Own Tasks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Branch</label>
                  <select
                    value={newUser.branchId}
                    onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-medium"
                  >
                    {branches.map((b: Branch) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newUser.departmentId}
                    onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-medium"
                  >
                    {departments.map((d: Department) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Approval Ceiling ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={newUser.approvalLimit}
                  onChange={(e) => setNewUser({ ...newUser, approvalLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Transactions above this ceiling trigger dual-control Maker-Checker escalation.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Create & Persist to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
