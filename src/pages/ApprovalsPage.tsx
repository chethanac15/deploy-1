// ==============================================================================
// APNI ESTATE INTERIORS - APPROVAL WORKFLOWS PAGE (ENTERPRISE)
// Multi-tenant governance for Purchase Orders, Expenses, and Financial Commitments
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalRequest, ApprovalEntityType, ApprovalStatus } from '../types';
import { approvalService } from '../services/approvalService';
import { INITIAL_APPROVAL_REQUESTS } from '../data/mockData';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  ShoppingBag, 
  Receipt, 
  User, 
  Calendar,
  AlertCircle,
  FileText,
  Building,
  Check,
  X
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const ApprovalsPage: React.FC = () => {
  const { purchases, expenses, teamMembers } = useApp();
  const { user, profile, organization, isDemoMode } = useAuth();

  const [rawRequests, setRawRequests] = useState<ApprovalRequest[]>(() => {
    return isDemoMode ? INITIAL_APPROVAL_REQUESTS : [];
  });
  const [loading, setLoading] = useState<boolean>(!isDemoMode);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [entityFilter, setEntityFilter] = useState<'all' | 'purchase_order' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action decision modal
  const [decisionModalOpen, setDecisionModalOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  // New Request Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [newEntityType, setNewEntityType] = useState<ApprovalEntityType>('purchase_order');
  const [newEntityId, setNewEntityId] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newAssignedTo, setNewAssignedTo] = useState<string>('');
  const [newError, setNewError] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Determine if caller can authorize reviews
  const canReview = useMemo(() => {
    if (isDemoMode) return true;
    if (!profile) return false;
    return profile.role === 'owner' || profile.role === 'admin';
  }, [profile, isDemoMode]);

  // Load approvals
  useEffect(() => {
    if (isDemoMode) {
      setRawRequests(INITIAL_APPROVAL_REQUESTS);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        if (organization?.id) {
          const data = await approvalService.getApprovalRequests(organization.id);
          setRawRequests(data);
        }
      } catch (err: any) {
        console.error('[ApprovalsPage] Failed to fetch approvals:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organization?.id, isDemoMode]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      pending: rawRequests.filter(r => r.status === 'pending').length,
      approved: rawRequests.filter(r => r.status === 'approved').length,
      rejected: rawRequests.filter(r => r.status === 'rejected').length,
      all: rawRequests.length
    };
  }, [rawRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return rawRequests.filter(req => {
      const matchesTab = 
        activeTab === 'all' ? true :
        req.status === activeTab;

      const matchesEntity = 
        entityFilter === 'all' ? true :
        req.entity_type === entityFilter;

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        req.title.toLowerCase().includes(q) ||
        (req.description && req.description.toLowerCase().includes(q)) ||
        (req.requesterName && req.requesterName.toLowerCase().includes(q)) ||
        (req.review_notes && req.review_notes.toLowerCase().includes(q));

      return matchesTab && matchesEntity && matchesSearch;
    });
  }, [rawRequests, activeTab, entityFilter, searchQuery]);

  // Open Review Decision Modal
  const openDecisionModal = (req: ApprovalRequest, type: 'approved' | 'rejected') => {
    setSelectedRequest(req);
    setDecisionType(type);
    setReviewNotes('');
    setActionError('');
    setDecisionModalOpen(true);
  };

  // Submit Decision
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsProcessing(true);
    setActionError('');

    try {
      if (isDemoMode) {
        setRawRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
          ...r,
          status: decisionType,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || 'demo-reviewer',
          reviewerName: profile?.full_name || 'Aarav Mehta',
          review_notes: reviewNotes.trim() || undefined
        } : r));
        setDecisionModalOpen(false);
      } else {
        await approvalService.reviewApprovalRequest(selectedRequest.id, decisionType, reviewNotes);
        setRawRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
          ...r,
          status: decisionType,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          reviewerName: profile?.full_name || 'Current User',
          review_notes: reviewNotes.trim() || undefined
        } : r));
        setDecisionModalOpen(false);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to process approval decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open New Request Modal
  const openNewRequestModal = () => {
    setNewEntityType('purchase_order');
    setNewEntityId('');
    setNewTitle('');
    setNewDescription('');
    setNewAmount('');
    setNewAssignedTo('');
    setNewError('');
    setIsNewModalOpen(true);
  };

  // Auto-populate when selecting entity
  const handleEntitySelect = (id: string) => {
    setNewEntityId(id);
    if (newEntityType === 'purchase_order') {
      const po = purchases.find(p => p.id === id);
      if (po) {
        setNewTitle(`PO-${po.po_number}: ${po.vendorName || 'Vendor'} Procurement`);
        setNewAmount(String(po.total_amount || ''));
      }
    } else {
      const exp = expenses.find(e => e.id === id);
      if (exp) {
        setNewTitle(`EXP: ${exp.title} (${exp.category})`);
        setNewAmount(String(exp.amount || ''));
      }
    }
  };

  // Create Request Submit
  const handleNewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setNewError('Title is required.');
      return;
    }
    if (!newEntityId) {
      setNewError('Please select a valid referencing entity.');
      return;
    }

    setIsCreating(true);
    setNewError('');

    try {
      const amountNum = newAmount ? parseFloat(newAmount) : undefined;
      const requesterId = profile?.id || user?.id || 'demo-requester';

      if (isDemoMode) {
        const newReq: ApprovalRequest = {
          id: `appr-${Date.now()}`,
          organization_id: 'demo-org',
          entity_type: newEntityType,
          entity_id: newEntityId,
          requested_by: requesterId,
          requesterName: profile?.full_name || 'Aarav Mehta',
          assigned_to: newAssignedTo || undefined,
          status: 'pending',
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          amount: amountNum,
          requested_at: new Date().toISOString()
        };
        setRawRequests(prev => [newReq, ...prev]);
        setIsNewModalOpen(false);
      } else {
        if (!organization?.id) throw new Error('No active organization.');
        const created = await approvalService.createApprovalRequest(organization.id, {
          entity_type: newEntityType,
          entity_id: newEntityId,
          requested_by: requesterId,
          assigned_to: newAssignedTo || undefined,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          amount: amountNum
        });
        setRawRequests(prev => [created, ...prev]);
        setIsNewModalOpen(false);
      }
    } catch (err: any) {
      setNewError(err.message || 'Failed to submit approval request.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Enterprise Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <span>Approval Workflows</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforce audit trails and managerial sign-offs for purchase orders, large vendor expenses, and commitments.
          </p>
        </div>

        <button
          onClick={openNewRequestModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 text-white text-xs font-bold shadow-md shadow-indigo-900/20 active:scale-[0.98] transition-all cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Approval Request</span>
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl overflow-x-auto">
          {[
            { key: 'pending', label: 'Pending', count: counts.pending, color: 'text-amber-600' },
            { key: 'approved', label: 'Approved', count: counts.approved, color: 'text-emerald-600' },
            { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-rose-600' },
            { key: 'all', label: 'All Requests', count: counts.all, color: 'text-slate-600' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Entity Filter & Search */}
        <div className="flex items-center gap-2.5">
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Entities</option>
            <option value="purchase_order">Purchase Orders Only</option>
            <option value="expense">Expenses Only</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-semibold">
          Loading approval requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Approval Requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery ? 'No requests match your current search query.' : 'There are no approval requests in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div 
                key={req.id} 
                className="premium-card p-4 sm:p-5 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    req.entity_type === 'purchase_order'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {req.entity_type === 'purchase_order' ? (
                      <ShoppingBag className="w-5 h-5" />
                    ) : (
                      <Receipt className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {req.entity_type === 'purchase_order' ? 'Purchase Order' : 'Expense Claim'}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                        {req.title}
                      </h3>
                    </div>

                    {req.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                        {req.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Requested by: <strong className="text-slate-700">{req.requesterName || 'Staff'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(req.requested_at)}</span>
                      </div>

                      {req.reviewed_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Reviewed by: <strong className="text-slate-700">{req.reviewerName || 'Admin'}</strong> ({formatDate(req.reviewed_at)})</span>
                        </div>
                      )}
                    </div>

                    {req.review_notes && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-600 italic">
                        "{req.review_notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Amount, Status Badge & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {req.amount !== undefined && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Amount
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatINR(req.amount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border ${
                      isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {isPending && <Clock className="w-3.5 h-3.5" />}
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5" />}
                      <span>{req.status}</span>
                    </span>

                    {/* Decision CTA buttons if pending and user authorized */}
                    {isPending && canReview && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          type="button"
                          onClick={() => openDecisionModal(req, 'approved')}
                          title="Authorize and approve"
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDecisionModal(req, 'rejected')}
                          title="Reject request"
                          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal (Approve / Reject) */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={decisionType === 'approved' ? 'Authorize Approval Request' : 'Reject Approval Request'}
        subtitle={selectedRequest?.title}
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Entity Type:</span>
              <span className="font-bold text-slate-800 uppercase">{selectedRequest?.entity_type}</span>
            </div>
            {selectedRequest?.amount !== undefined && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Value:</span>
                <span className="font-extrabold text-slate-900">{formatINR(selectedRequest.amount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-500">
              <span>Requested By:</span>
              <span className="font-bold text-slate-800">{selectedRequest?.requesterName}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Reviewer Audit Notes {decisionType === 'rejected' ? '*' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              placeholder={
                decisionType === 'approved'
                  ? 'e.g. Authorized as per sanctioned BOQ schedule.'
                  : 'e.g. Disapproved due to missing vendor rate comparison.'
              }
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              required={decisionType === 'rejected'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                decisionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isProcessing ? 'Processing...' : decisionType === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Approval Request Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Submit New Approval Request"
        subtitle="Submit a vendor purchase order or project expenditure for executive approval."
      >
        <form onSubmit={handleNewRequestSubmit} className="space-y-4">
          {newError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{newError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Entity Category *
              </label>
              <select
                value={newEntityType}
                onChange={e => {
                  setNewEntityType(e.target.value as any);
                  setNewEntityId('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="purchase_order">Purchase Order (PO)</option>
                <option value="expense">Project Expense Claim</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Referencing Item *
              </label>
              <select
                value={newEntityId}
                onChange={e => handleEntitySelect(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">-- Choose item to approve --</option>
                {newEntityType === 'purchase_order' ? (
                  purchases.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.vendorName || 'Vendor'} ({formatINR(po.total_amount)})
                    </option>
                  ))
                ) : (
                  expenses.map(exp => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title} - {exp.category} ({formatINR(exp.amount)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Request Subject / Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Special marble lot procurement authorization"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Amount (INR)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Assign Designated Reviewer
              </label>
              <select
                value={newAssignedTo}
                onChange={e => setNewAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">-- Any Studio Owner / Admin --</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} ({member.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Justification / Scope Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide context on why this financial commitment or purchase is required..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isCreating ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
