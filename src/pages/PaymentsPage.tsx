// ==============================================================================
// APNI ESTATE INTERIORS - CLIENT PAYMENTS & RECEIVABLES PAGE
// Real client milestone revenue tracking, partial collections, and overdue aging
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ClientPayment, ClientPaymentStatus } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { calculatePaymentScheduleMetrics } from '../lib/profitabilityMetrics';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Edit2, 
  Trash2,
  TrendingUp,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { ClientPaymentModal } from '../components/modals/ClientPaymentModal';
import { EmptyState } from '../components/common/EmptyState';

const STATUS_FILTERS: ('All' | ClientPaymentStatus)[] = [
  'All',
  'Pending',
  'Partially Paid',
  'Paid',
  'Overdue'
];

export const PaymentsPage: React.FC = () => {
  const { clientPayments, projects, clients, addClientPayment, updateClientPayment, deleteClientPayment } = useApp();
  const { isDemoMode } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | ClientPaymentStatus>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<ClientPayment | null>(null);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return clientPayments.filter(p => {
      const matchesProject = selectedProjectId === 'All' || p.project_id === selectedProjectId;
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.projectName && p.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.clientName && p.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.payment_reference && p.payment_reference.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesProject && matchesStatus && matchesSearch;
    });
  }, [clientPayments, selectedProjectId, selectedStatus, searchQuery]);

  // Overall Financial Metrics using authoritative engine
  const metrics = useMemo(() => {
    return calculatePaymentScheduleMetrics(clientPayments);
  }, [clientPayments]);

  const handleSave = async (paymentData: Partial<ClientPayment>) => {
    if (paymentToEdit) {
      await updateClientPayment(paymentToEdit.id, paymentData);
    } else {
      await addClientPayment(paymentData);
    }
  };

  const handleQuickMarkPaid = async (payment: ClientPayment) => {
    await updateClientPayment(payment.id, {
      paid_amount: payment.amount,
      paid_date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Client Payments & Milestones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {clientPayments.length} Milestone Invoices
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track customer stage payments, advance deposits, received collections & outstanding aging.
          </p>
        </div>

        <button
          onClick={() => {
            setPaymentToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>+ Record Payment</span>
        </button>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scheduled */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Scheduled Milestone Value
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-display">
            {formatINR(metrics.totalScheduled)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Across {clientPayments.length} scheduled stages
          </div>
        </div>

        {/* Revenue Received */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Total Revenue Received
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 font-display">
            {formatINR(metrics.totalReceived)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics.paidCount} milestones fully collected</span>
          </div>
        </div>

        {/* Schedule Outstanding */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Pending Collections
            </span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-indigo-900 font-display">
            {formatINR(metrics.scheduleOutstanding)}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">
            {metrics.pendingCount} milestones awaiting payment
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Overdue Aging
            </span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 font-display">
            {formatINR(metrics.overdueAmount)}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">
            {metrics.overdueCount > 0 ? `⚠️ ${metrics.overdueCount} payments past due` : 'No overdue invoices'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search milestone, project, client, or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
            />
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {STATUS_FILTERS.map(st => {
            const active = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payments List / Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={IndianRupee}
          title="No client payments match your filters"
          description="Record milestone stages (e.g. 50% on booking, 30% on carpentry, 20% on handover)."
          actionLabel="+ Record New Payment"
          onAction={() => {
            setPaymentToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((p) => {
            const isFullyPaid = p.status === 'Paid';
            const isOverdue = p.status === 'Overdue';
            const isPartial = p.status === 'Partially Paid';
            const pctCollected = p.amount > 0 ? Math.min(100, Math.round((p.paid_amount / p.amount) * 100)) : 0;

            return (
              <div
                key={p.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOverdue 
                    ? 'border-rose-300 bg-rose-50/10 shadow-xs' 
                    : isFullyPaid 
                      ? 'border-slate-200/90 shadow-xs' 
                      : 'border-slate-200/90 shadow-xs hover:border-brand-300'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {/* Status Badge */}
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                      isFullyPaid 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isOverdue
                          ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                          : isPartial
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {p.status}
                    </span>

                    {p.projectName && (
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.projectName}</span>
                      </span>
                    )}

                    {p.clientName && (
                      <span className="text-xs text-slate-400">
                        • {p.clientName}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1 mb-1">
                    {p.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Due: {formatDate(p.due_date)}</span>
                    {p.paid_date && (
                      <span className="text-emerald-600 font-semibold">
                        Received: {formatDate(p.paid_date)}
                      </span>
                    )}
                    {p.payment_method && (
                      <span>Mode: {p.payment_method}</span>
                    )}
                    {p.payment_reference && (
                      <span className="font-mono text-slate-600">Ref: {p.payment_reference}</span>
                    )}
                  </div>

                  {/* Progress Bar for Partial Collections */}
                  <div className="mt-2.5 max-w-md flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFullyPaid ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${pctCollected}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">
                      {pctCollected}% Paid ({formatINR(p.paid_amount)} of {formatINR(p.amount)})
                    </span>
                  </div>
                </div>

                {/* Amounts & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-display block">
                      {formatINR(p.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isFullyPaid 
                        ? 'Fully Settled' 
                        : `Pending: ${formatINR(Math.max(p.amount - p.paid_amount, 0))}`
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isFullyPaid && (
                      <button
                        onClick={() => handleQuickMarkPaid(p)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
                        title="Mark as fully received"
                      >
                        Mark Paid
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setPaymentToEdit(p);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete milestone "${p.title}"?`)) {
                          deleteClientPayment(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Payment Modal */}
      <ClientPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        paymentToEdit={paymentToEdit}
        projects={projects}
        clients={clients}
      />
    </div>
  );
};
