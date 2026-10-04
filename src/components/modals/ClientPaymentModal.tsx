import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Calendar, CreditCard, Building2, CheckCircle2, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPayment, ClientPaymentStatus, Project, Client } from '../../types';

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (paymentData: Partial<ClientPayment>) => Promise<void>;
  paymentToEdit?: ClientPayment | null;
  projects?: Project[];
  clients?: Client[];
  defaultProjectId?: string | null;
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  paymentToEdit,
  projects: propProjects,
  clients: propClients,
  defaultProjectId
}) => {
  const { projects: contextProjects, clients: contextClients, addClientPayment, updateClientPayment } = useApp();
  const projects = propProjects || contextProjects;
  const clients = propClients || contextClients;

  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [paidDate, setPaidDate] = useState('');
  const [status, setStatus] = useState<ClientPaymentStatus>('Pending');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer / NEFT');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentToEdit) {
      setProjectId(paymentToEdit.project_id);
      setClientId(paymentToEdit.client_id || '');
      setTitle(paymentToEdit.title || (paymentToEdit as any).milestone_name || '');
      setAmount(paymentToEdit.amount.toString());
      setDueDate(paymentToEdit.due_date || new Date().toISOString().split('T')[0]);
      setPaidAmount(paymentToEdit.paid_amount?.toString() || '0');
      setPaidDate(paymentToEdit.paid_date || '');
      setStatus(paymentToEdit.status || 'Pending');
      setPaymentMethod(paymentToEdit.payment_method || (paymentToEdit as any).paymentMethod || 'Bank Transfer / NEFT');
      setPaymentReference(paymentToEdit.payment_reference || (paymentToEdit as any).reference_number || '');
      setNotes(paymentToEdit.notes || '');
    } else {
      const initialProjId = defaultProjectId || (projects.length > 0 ? projects[0].id : '');
      setProjectId(initialProjId);
      
      const foundProj = projects.find(p => p.id === initialProjId);
      const initialClientId = (foundProj as any)?.client_id || (foundProj as any)?.clientId || '';
      setClientId(initialClientId);

      setTitle('');
      setAmount('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPaidAmount('0');
      setPaidDate('');
      setStatus('Pending');
      setPaymentMethod('Bank Transfer / NEFT');
      setPaymentReference('');
      setNotes('');
    }
    setError(null);
  }, [paymentToEdit, isOpen, defaultProjectId, projects]);

  // Handle Project selection change -> auto-update client
  const handleProjectChange = (selectedId: string) => {
    setProjectId(selectedId);
    const found = projects.find(p => p.id === selectedId);
    const resolvedClientId = (found as any)?.client_id || (found as any)?.clientId || '';
    if (resolvedClientId) {
      setClientId(resolvedClientId);
    }
  };

  // Sync Status when paidAmount changes
  const handlePaidAmountChange = (val: string) => {
    setPaidAmount(val);
    const numPaid = Number(val) || 0;
    const numTotal = Number(amount) || 0;

    if (numPaid >= numTotal && numTotal > 0) {
      setStatus('Paid');
      if (!paidDate) setPaidDate(new Date().toISOString().split('T')[0]);
    } else if (numPaid > 0) {
      setStatus('Partially Paid');
      if (!paidDate) setPaidDate(new Date().toISOString().split('T')[0]);
    } else {
      setStatus('Pending');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project.');
      return;
    }
    if (!title.trim()) {
      setError('Payment / Milestone Title is required.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid scheduled payment amount.');
      return;
    }

    const numPaid = Number(paidAmount) || 0;
    if (numPaid < 0) {
      setError('Paid amount cannot be negative.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        project_id: projectId,
        client_id: clientId || undefined,
        title: title.trim(),
        amount: numAmount,
        due_date: dueDate || new Date().toISOString().split('T')[0],
        paid_amount: numPaid,
        paid_date: numPaid > 0 ? (paidDate || new Date().toISOString().split('T')[0]) : undefined,
        status,
        payment_method: paymentMethod || undefined,
        payment_reference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined
      };

      if (onSave) {
        await onSave(payload);
      } else if (paymentToEdit) {
        await updateClientPayment(paymentToEdit.id, payload);
      } else {
        await addClientPayment(payload as any);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save payment record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">
                {paymentToEdit ? 'Edit Client Payment' : 'Record Client Payment / Milestone'}
              </h2>
              <p className="text-xs text-slate-500">
                Track incoming milestone collections, partial receipts & bank references
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium bg-white"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Client (Optional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium bg-white"
              >
                <option value="">Linked to Project</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Milestone / Payment Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2nd Milestone - Carpentry & Modular Kitchen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Total Scheduled Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium bg-white"
              />
            </div>
          </div>

          {/* Payment Receipt Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Receipt / Collection Details
              </span>
              <button
                type="button"
                onClick={() => handlePaidAmountChange(amount)}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
              >
                Mark Full Payment (100%)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Amount Received So Far (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => handlePaidAmountChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Paid Date
                </label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                  <option value="UPI / QR">UPI / QR Code</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Transaction / UTR / Cheque No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982144510"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Notes & Invoicing Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 50% advance on civil layout sign-off."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : paymentToEdit ? 'Update Payment' : 'Save Payment Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
