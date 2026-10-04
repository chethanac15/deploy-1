// ==============================================================================
// APNI ESTATE INTERIORS - ADD & EDIT EXPENSE MODAL (SUPABASE PERSISTENCE)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentStatus, Expense } from '../../types';
import { IndianRupee, Tag, Calendar, User, UploadCloud, CheckCircle2, FileText, AlertCircle, Layers } from 'lucide-react';

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

export const AddExpenseModal: React.FC = () => {
  const { 
    isAddExpenseModalOpen, 
    setIsAddExpenseModalOpen, 
    defaultExpenseProjectId, 
    expenseToEdit,
    projects, 
    addExpense,
    updateExpense
  } = useApp();

  const [projectId, setProjectId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected project object to get available rooms
  const selectedProject = projects.find(p => p.id === projectId) || (projects.length > 0 ? projects[0] : undefined);
  const projectRooms = selectedProject?.rooms || [];

  useEffect(() => {
    if (isAddExpenseModalOpen) {
      setErrorMsg(null);
      if (expenseToEdit) {
        setProjectId(expenseToEdit.projectId);
        setRoomId(expenseToEdit.room_id || '');
        setTitle(expenseToEdit.title || '');
        setCategory(expenseToEdit.category || 'Materials');
        setAmount(expenseToEdit.amount?.toString() || '');
        setVendor(expenseToEdit.vendor || '');
        setDate(expenseToEdit.date || new Date().toISOString().split('T')[0]);
        setPaymentStatus(expenseToEdit.paymentStatus || 'Paid');
        setNotes(expenseToEdit.notes || '');
        setHasReceipt(!!expenseToEdit.receiptUrl);
      } else {
        const targetProjId = defaultExpenseProjectId || (projects.length > 0 ? projects[0].id : '');
        setProjectId(targetProjId);
        setRoomId('');
        setTitle('');
        setCategory('Materials');
        setAmount('');
        setVendor('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentStatus('Paid');
        setNotes('');
        setHasReceipt(false);
      }
    }
  }, [isAddExpenseModalOpen, expenseToEdit, defaultExpenseProjectId, projects]);

  // When project changes in the modal, ensure room belongs to the new project
  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    const newProj = projects.find(p => p.id === newProjId);
    if (!newProj?.rooms?.some(r => r.id === roomId)) {
      setRoomId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!projectId) {
      setErrorMsg('Please select a project.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter an expense title.');
      return;
    }
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) {
      setErrorMsg('Expense amount must be greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, {
          projectId,
          projectName: selectedProject ? selectedProject.name : 'Project',
          room_id: roomId || undefined,
          title: title.trim(),
          category,
          amount: numAmount,
          vendor: vendor.trim() || 'Vendor',
          date,
          paymentStatus,
          notes: notes.trim() || undefined,
          receiptUrl: hasReceipt ? 'receipt_preview.pdf' : undefined
        });
      } else {
        await addExpense({
          projectId,
          projectName: selectedProject ? selectedProject.name : 'Project',
          room_id: roomId || undefined,
          title: title.trim(),
          category,
          amount: numAmount,
          vendor: vendor.trim() || 'Vendor',
          date,
          paymentStatus,
          notes: notes.trim() || undefined,
          receiptUrl: hasReceipt ? 'receipt_preview.pdf' : undefined
        });
      }

      setIsAddExpenseModalOpen(false);
    } catch (err: any) {
      console.error('Expense submit error:', err);
      setErrorMsg(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isAddExpenseModalOpen}
      onClose={() => !isSubmitting && setIsAddExpenseModalOpen(false)}
      title={expenseToEdit ? 'Edit Expense Record' : 'Record Project Expense'}
      subtitle={expenseToEdit ? 'Update bill details or payment ledger entry' : 'Record a verified bill, material invoice, or contractor payout.'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Project & Room Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Project <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location || 'Site'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Room / Scope Area
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">-- Project-Wide (General) --</option>
              {projectRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.room_type || 'Room'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Expense Title / Item <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Italian Marble Botticino Slabs, Carpentry Advance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
        </div>

        {/* Amount & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vendor & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Vendor / Contractor
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. StoneCraft India, Demo Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Expense Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Payment Status <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Paid', 'Pending', 'Partially Paid'] as PaymentStatus[]).map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setPaymentStatus(st)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  paymentStatus === st
                    ? st === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20 font-bold'
                      : st === 'Pending'
                      ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-orange-500/20 font-bold'
                      : 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Item Notes / Invoice Reference
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Advance paid for living room veneer framing work."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>

        {/* Receipt indicator */}
        <div>
          <button
            type="button"
            onClick={() => setHasReceipt(!hasReceipt)}
            className={`w-full p-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-medium transition-all ${
              hasReceipt
                ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-500'
            }`}
          >
            {hasReceipt ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>GST Tax Invoice attached (preview_tax_invoice.pdf)</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-slate-400" />
                <span>Attach Bill / Vendor Receipt (Optional)</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setIsAddExpenseModalOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold shadow-md transition-all flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Record Expense'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
