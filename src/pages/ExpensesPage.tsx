// ==============================================================================
// APNI ESTATE INTERIORS - EXPENSES PAGE (AUTHENTICATED & ACCURATE LEDGER)
// ==============================================================================

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory, PaymentStatus, Expense } from '../types';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  IndianRupee,
  Layers,
  ArrowUpDown,
  Edit2
} from 'lucide-react';
import { formatINR, formatINRCompact, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

const CATEGORIES: ExpenseCategory[] = [
  'Materials',
  'Labour',
  'Furniture',
  'Electrical',
  'Plumbing',
  'Transport',
  'Design',
  'Miscellaneous'
];

export const ExpensesPage: React.FC = () => {
  const { 
    expenses, 
    projects, 
    setIsAddExpenseModalOpen, 
    deleteExpense, 
    openProjectDetail,
    globalSearch 
  } = useApp();

  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  // Deletion confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered expenses
  const filtered = expenses.filter(exp => {
    // Search
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      const match = exp.title.toLowerCase().includes(q) ||
                    exp.projectName.toLowerCase().includes(q) ||
                    (exp.vendor && exp.vendor.toLowerCase().includes(q)) ||
                    exp.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedProject !== 'All' && exp.projectId !== selectedProject) return false;
    if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
    if (selectedPaymentStatus !== 'All' && exp.paymentStatus !== selectedPaymentStatus) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Calculate authoritative KPI numbers
  const totalExpensesSum = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  
  // This month expenses
  const currentMonthPrefix = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const thisMonthExpenses = expenses
    .filter(e => e.date && e.date.startsWith(currentMonthPrefix))
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Pending / partially paid sum
  const pendingPaymentsSum = expenses
    .filter(e => e.paymentStatus === 'Pending' || e.paymentStatus === 'Partially Paid')
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Largest category
  const catSums: Record<string, number> = {};
  expenses.forEach(e => {
    catSums[e.category] = (catSums[e.category] || 0) + (Number(e.amount) || 0);
  });
  let largestCategory = expenses.length > 0 ? 'Materials' : 'None';
  let largestCatAmount = 0;
  Object.entries(catSums).forEach(([cat, sum]) => {
    if (sum > largestCatAmount) {
      largestCatAmount = sum;
      largestCategory = cat;
    }
  });

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Expense Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and verify every rupee spent across project materials, contractor advances, and site procurement.
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* 4 Expense KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Expenses</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-display text-slate-900">
            {formatINRCompact(totalExpensesSum)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} recorded ledger entries</p>
        </div>

        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">This Month</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-display text-emerald-600">
            {formatINRCompact(thisMonthExpenses)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Current monthly spend</p>
        </div>

        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Largest Category</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-display text-slate-900 truncate">
            {largestCategory}
          </div>
          <p className="text-xs text-slate-400 mt-1">{formatINRCompact(largestCatAmount)} spent</p>
        </div>

        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Payments</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-display text-amber-600">
            {formatINRCompact(pendingPaymentsSum)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting vendor clearance</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Project filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Payment:</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Latest Date</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table / Cards */}
      <div className="premium-card overflow-hidden p-0 sm:p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={expenses.length === 0 ? "No expenses recorded yet" : "No expenses match your filters"}
            description={expenses.length === 0 ? "Record bills, material receipts, or contractor advances to maintain accurate financial ledgers." : "Clear your search or filter criteria to see all recorded entries."}
            actionLabel="+ Add First Expense"
            onAction={() => setIsAddExpenseModalOpen(true)}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Expense Title</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Vendor</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 max-w-xs">
                        <div>{expense.title}</div>
                        {expense.notes && <div className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">{expense.notes}</div>}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => openProjectDetail(expense.projectId, 'Expenses')}
                          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline text-left"
                        >
                          {expense.projectName}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium text-[11px]">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{expense.vendor || '—'}</td>
                      <td className="py-4 px-4 text-slate-500">{formatDate(expense.date)}</td>
                      <td className="py-4 px-4">
                        <Badge status={expense.paymentStatus} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                        {formatINR(expense.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setIsAddExpenseModalOpen(true, expense.projectId, expense)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(expense)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden p-3.5 space-y-3">
              {filtered.map((expense) => (
                <div key={expense.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{expense.title}</h4>
                      <button
                        onClick={() => openProjectDetail(expense.projectId, 'Expenses')}
                        className="text-xs font-semibold text-brand-600 hover:underline text-left block mt-0.5"
                      >
                        {expense.projectName}
                      </button>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-semibold">
                          {expense.category}
                        </span>
                        {expense.vendor && (
                          <span className="text-[11px] text-slate-500">
                            Vendor: <strong className="text-slate-700">{expense.vendor}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-slate-900 block">{formatINR(expense.amount)}</span>
                      <div className="mt-1">
                        <Badge status={expense.paymentStatus} size="sm" />
                      </div>
                    </div>
                  </div>

                  {expense.notes && (
                    <p className="text-xs text-slate-500 leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-100">
                      {expense.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                    <span>{formatDate(expense.date)}</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsAddExpenseModalOpen(true, expense.projectId, expense)}
                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-200 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>


      {/* Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Expense: {expenseToDelete.title}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to remove this ledger entry of {formatINR(expenseToDelete.amount)}? Financial totals will be recalculated immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
