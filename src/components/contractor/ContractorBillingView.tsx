/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Invoice, Quote, Payment } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CreditCard,
  Users,
  FileCheck2,
  DollarSign,
  Plus,
  Play,
  ArrowUpRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

interface ContractorBillingViewProps {
  initialSubTab?: 'invoices' | 'quotes' | 'customers';
}

export const ContractorBillingView: React.FC<ContractorBillingViewProps> = ({
  initialSubTab = 'invoices',
}) => {
  const { currentUser } = useAuth();
  const [subTab, setSubTab] = useState<'invoices' | 'quotes' | 'customers'>(initialSubTab);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Billing run modal
  const [showBillingRunModal, setShowBillingRunModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [billingRunMessage, setBillingRunMessage] = useState<string | null>(null);

  // Record Payment Modal
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'BankTransfer' | 'MobileMoney' | 'Card' | 'Cash'>('BankTransfer');

  const fetchData = async () => {
    try {
      const [invRes, quoRes, custRes] = await Promise.all([
        fetch('/api/v1/invoices'),
        fetch('/api/v1/quotes'),
        fetch('/api/v1/customers'),
      ]);
      const invData = await invRes.json();
      const quoData = await quoRes.json();
      const custData = await custRes.json();

      setInvoices(invData.invoices || []);
      setPayments(invData.payments || []);
      setQuotes(quoData || []);
      setCustomers(custData.customers || []);
      if (custData.customers && custData.customers[0]) {
        setSelectedCustomerId(custData.customers[0].id);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteBillingRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/invoices/billing-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          workOrderIds: ['wo-00101', 'wo-00102'],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBillingRunModal(false);
        setBillingRunMessage(
          `Success: Generated Gapless Invoice ${data.number} ($${data.total.toFixed(2)})! Sent to Approval Inbox.`
        );
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    try {
      const res = await fetch(`/api/v1/invoices/${selectedInvoiceForPay.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          amount: payAmount,
          method: payMethod,
        }),
      });
      if (res.ok) {
        setSelectedInvoiceForPay(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            Contractor Job-to-Cash & Billing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn completed jobs into gapless invoices with maker-checker controls and payment reconciliations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setSubTab('invoices')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                subTab === 'invoices' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices & Payments
            </button>
            <button
              onClick={() => setSubTab('quotes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                subTab === 'quotes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotes ({quotes.length})
            </button>
            <button
              onClick={() => setSubTab('customers')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                subTab === 'customers' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customers ({customers.length})
            </button>
          </div>

          <button
            onClick={() => setShowBillingRunModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Batch Billing Run
          </button>
        </div>
      </div>

      {billingRunMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
          <span>{billingRunMessage}</span>
          <button onClick={() => setBillingRunMessage(null)} className="font-bold text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Subtab 1: Invoices */}
      {subTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Gapless Customer Invoices
              </h3>
              <p className="text-[11px] text-slate-500">
                Sequenced strictly by branch; drafts do not advance gapless numbering until checked
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client Customer</th>
                  <th className="py-3 px-4">Issue / Due Date</th>
                  <th className="py-3 px-4">Subtotal / Tax</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Amount Paid / Balance</th>
                  <th className="py-3 px-4">Approval & Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inv.issueDate} · Due {inv.dueDate}
                    </td>
                    <td className="py-3 px-4">
                      ${inv.subtotal.toFixed(2)} + ${inv.taxTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      ${inv.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-600 font-medium">${inv.amountPaid.toFixed(2)}</span> /{' '}
                      <span className="text-slate-900 font-bold">${inv.balance.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={inv.status}>{inv.status}</Badge>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Maker: {inv.makerName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.balance > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForPay(inv);
                            setPayAmount(inv.balance);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-2xs"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-emerald-700 text-xs font-semibold flex items-center justify-end gap-1">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Quotes */}
      {subTab === 'quotes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Maintenance Quotes & Estimates
              </h3>
              <p className="text-[11px] text-slate-500">
                Priced with rate cards and parts markups; converts into authorized work order on acceptance
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {quotes.map((q) => (
              <div key={q.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{q.number}</span>
                    <Badge status={q.status}>{q.status}</Badge>
                    <span className="font-semibold text-slate-800">{q.customerName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Valid Until: {q.validUntil} · {q.lines.length} Line items (Labor, Parts, Access Rigging)
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-slate-900">
                      ${q.total.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400">incl. 15% VAT</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                    Token: {q.approvalToken}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Customers Directory */}
      {subTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400">{c.number}</span>
                  <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                </div>
                <Badge status={c.isActive ? 'Active' : 'Inactive'}>
                  {c.isActive ? 'Active Client' : 'Inactive'}
                </Badge>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Email: {c.email}</div>
                <div>Phone: {c.phone}</div>
                <div>Billing Address: {c.billingAddress}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span>Credit Limit: ${c.creditLimit.toLocaleString()}</span>
                <span className="font-semibold text-slate-800">
                  Balance: ${c.balance.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Billing Run Modal */}
      {showBillingRunModal && (
        <Modal
          isOpen={showBillingRunModal}
          onClose={() => setShowBillingRunModal(false)}
          title="Run Batch Customer Billing Engine"
          subtitle="Gathers completed billable work orders and calculates time & materials"
        >
          <form onSubmit={handleExecuteBillingRun} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.number})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-600">
              <div className="font-semibold text-slate-800">Batch Invoicing Policy:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Pulls all completed and closed work orders for the current month.</li>
                <li>Applies contract hourly rate cards, parts markups, and callout fees.</li>
                <li>Allocates the next gapless invoice number for the branch.</li>
                <li>Draft invoice is automatically routed to Maker-Checker approval queue.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBillingRunModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Generate Gapless Invoice Batch
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {selectedInvoiceForPay && (
        <Modal
          isOpen={Boolean(selectedInvoiceForPay)}
          onClose={() => setSelectedInvoiceForPay(null)}
          title={`Record Customer Payment: ${selectedInvoiceForPay.number}`}
          subtitle={`Client: ${selectedInvoiceForPay.customerName}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Payment Amount ($)</label>
              <input
                type="number"
                step="0.01"
                max={selectedInvoiceForPay.balance}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-orange-500 bg-white"
              >
                <option value="BankTransfer">Direct Bank Wire / Transfer</option>
                <option value="MobileMoney">Mobile Money (MTN MoMo / Telecel Cash)</option>
                <option value="Card">Visa / MasterCard Online Link</option>
                <option value="Cash">Cash at Branch Counter</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPay(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Confirm Payment & Update Balance
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
