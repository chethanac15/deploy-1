// ==============================================================================
// APNI ESTATE INTERIORS - LEAD MODAL (CRM PIPELINE CAPTURE & EDIT)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadStatus, LeadSource } from '../../types';
import { 
  User, 
  Phone, 
  Mail, 
  IndianRupee, 
  FileText, 
  Tag, 
  UserCheck, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

const SOURCES: LeadSource[] = ['Instagram', 'Website', 'Referral', 'Walk-in', 'Housing Portal', 'Other'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Site Visit Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  leadToEdit
}) => {
  const { addLead, updateLead, teamMembers } = useApp();
  const { organization, isDemoMode } = useAuth();

  const isEdit = Boolean(leadToEdit);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Instagram');
  const [requirement, setRequirement] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (leadToEdit) {
      setName(leadToEdit.name || '');
      setPhone(leadToEdit.phone || '');
      setEmail(leadToEdit.email || '');
      setSource((leadToEdit.source as LeadSource) || 'Instagram');
      setRequirement(leadToEdit.requirement || '');
      setEstimatedBudget(leadToEdit.estimated_budget ? String(leadToEdit.estimated_budget) : '');
      setStatus(leadToEdit.status || 'New');
      setAssignedTo(leadToEdit.assigned_to || '');
      setNotes(leadToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setSource('Instagram');
      setRequirement('');
      setEstimatedBudget('');
      setStatus('New');
      setAssignedTo('');
      setNotes('');
    }
    setErrorMessage(null);
  }, [leadToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Lead prospect name is required.');
      return;
    }

    setLoading(true);
    try {
      const budgetNum = estimatedBudget ? parseFloat(estimatedBudget.replace(/,/g, '')) : 0;
      const assignedMember = teamMembers.find(m => m.id === assignedTo);

      if (isEdit && leadToEdit) {
        await updateLead(leadToEdit.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          source,
          requirement: requirement.trim() || undefined,
          estimated_budget: isNaN(budgetNum) ? 0 : budgetNum,
          status,
          assigned_to: assignedTo || undefined,
          notes: notes.trim() || undefined
        });
      } else {
        await addLead({
          organization_id: organization?.id || 'demo-org',
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          source,
          requirement: requirement.trim() || undefined,
          estimated_budget: isNaN(budgetNum) ? 0 : budgetNum,
          status,
          assigned_to: assignedTo || undefined,
          assigned_staff_name: assignedMember?.full_name,
          notes: notes.trim() || undefined
        });
      }
      onClose();
    } catch (err: any) {
      console.error('[LeadModal] Save error:', err);
      setErrorMessage(err.message || 'Failed to save lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead Opportunity' : 'Capture New Lead'}
      subtitle={isEdit ? `Updating opportunity for ${leadToEdit?.name}` : 'Log client inquiry and track conversion through your design pipeline.'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lead Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Prospect / Client Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Vikram Malhotra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="+91 98200 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="vikram@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Lead Source
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated Budget */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Estimated Budget (₹)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="25,00,000"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pipeline Stage
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              {STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Assigned Staff */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Assigned Designer / Supervisor
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Requirement */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Project Scope / Requirement
            </label>
            <input
              type="text"
              placeholder="e.g. 3BHK Turnkey Interior with Italian marble and custom woodwork"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Interaction Log / Discovery Notes
            </label>
            <textarea
              rows={3}
              placeholder="Key client preferences, site location notes, follow-up schedule..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{isEdit ? 'Update Opportunity' : 'Save Lead'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
