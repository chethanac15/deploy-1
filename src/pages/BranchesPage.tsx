// ==============================================================================
// APNI ESTATE INTERIORS - MULTI-BRANCH MANAGEMENT PAGE (ENTERPRISE)
// Multi-location operations, branch managers, contract values, and real expenses
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Branch } from '../types';
import { branchService } from '../services/branchService';
import { INITIAL_BRANCHES } from '../data/mockData';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { 
  Building, 
  MapPin, 
  Users, 
  FolderKanban, 
  IndianRupee, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  Filter,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const BranchesPage: React.FC = () => {
  const { projects, expenses, teamMembers } = useApp();
  const { organization, isDemoMode } = useAuth();

  const [rawBranches, setRawBranches] = useState<Branch[]>(() => {
    return isDemoMode ? INITIAL_BRANCHES : [];
  });
  const [loading, setLoading] = useState<boolean>(!isDemoMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('');
  const [formState, setFormState] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formManagerId, setFormManagerId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch branches on mount
  useEffect(() => {
    if (isDemoMode) {
      setRawBranches(INITIAL_BRANCHES);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        if (organization?.id) {
          const data = await branchService.getBranches(organization.id);
          setRawBranches(data);
        }
      } catch (err: any) {
        console.error('[BranchesPage] Failed to fetch branches:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organization?.id, isDemoMode]);

  // Derived branches with live metrics
  const branches = useMemo(() => {
    return branchService.calculateBranchMetrics(rawBranches, projects, expenses, teamMembers);
  }, [rawBranches, projects, expenses, teamMembers]);

  // Organization-wide aggregated metrics
  const summaryMetrics = useMemo(() => {
    const totalBranches = branches.length;
    const activeBranches = branches.filter(b => b.is_active).length;
    const totalProjects = branches.reduce((sum, b) => sum + (b.project_count || 0), 0);
    const totalContractValue = branches.reduce((sum, b) => sum + (b.total_contract_value || 0), 0);
    const totalExpenses = branches.reduce((sum, b) => sum + (b.total_expenses || 0), 0);

    return {
      totalBranches,
      activeBranches,
      totalProjects,
      totalContractValue,
      totalExpenses
    };
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      const matchesSearch = 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.code && b.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.managerName && b.managerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? b.is_active :
        !b.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName('');
    setFormCode('');
    setFormCity('');
    setFormState('');
    setFormAddress('');
    setFormPhone('');
    setFormEmail('');
    setFormManagerId('');
    setFormIsActive(true);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormCode(branch.code || '');
    setFormCity(branch.city || '');
    setFormState(branch.state || '');
    setFormAddress(branch.address || '');
    setFormPhone(branch.phone || '');
    setFormEmail(branch.email || '');
    setFormManagerId(branch.manager_id || '');
    setFormIsActive(branch.is_active);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Branch name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (isDemoMode) {
        if (editingBranch) {
          setRawBranches(prev => prev.map(b => b.id === editingBranch.id ? {
            ...b,
            name: formName.trim(),
            code: formCode.trim() || undefined,
            city: formCity.trim() || undefined,
            state: formState.trim() || undefined,
            address: formAddress.trim() || undefined,
            phone: formPhone.trim() || undefined,
            email: formEmail.trim() || undefined,
            manager_id: formManagerId || undefined,
            is_active: formIsActive
          } : b));
        } else {
          const newBranch: Branch = {
            id: `branch-${Date.now()}`,
            organization_id: 'demo-org',
            name: formName.trim(),
            code: formCode.trim() || undefined,
            city: formCity.trim() || undefined,
            state: formState.trim() || undefined,
            address: formAddress.trim() || undefined,
            phone: formPhone.trim() || undefined,
            email: formEmail.trim() || undefined,
            manager_id: formManagerId || undefined,
            is_active: formIsActive,
            created_at: new Date().toISOString()
          };
          setRawBranches(prev => [newBranch, ...prev]);
        }
        setIsCreateModalOpen(false);
      } else {
        if (editingBranch) {
          const updated = await branchService.updateBranch(editingBranch.id, {
            name: formName.trim(),
            code: formCode.trim() || undefined,
            city: formCity.trim() || undefined,
            state: formState.trim() || undefined,
            address: formAddress.trim() || undefined,
            phone: formPhone.trim() || undefined,
            email: formEmail.trim() || undefined,
            manager_id: formManagerId || null,
            is_active: formIsActive
          });
          setRawBranches(prev => prev.map(b => b.id === updated.id ? updated : b));
        } else {
          if (!organization?.id) throw new Error('No active organization.');
          const created = await branchService.createBranch(organization.id, {
            name: formName.trim(),
            code: formCode.trim() || undefined,
            city: formCity.trim() || undefined,
            state: formState.trim() || undefined,
            address: formAddress.trim() || undefined,
            phone: formPhone.trim() || undefined,
            email: formEmail.trim() || undefined,
            manager_id: formManagerId || undefined,
            is_active: formIsActive
          });
          setRawBranches(prev => [created, ...prev]);
        }
        setIsCreateModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBranchStatus = async (branch: Branch) => {
    const newStatus = !branch.is_active;
    if (isDemoMode) {
      setRawBranches(prev => prev.map(b => b.id === branch.id ? { ...b, is_active: newStatus } : b));
    } else {
      try {
        const updated = await branchService.updateBranch(branch.id, { is_active: newStatus });
        setRawBranches(prev => prev.map(b => b.id === updated.id ? updated : b));
      } catch (err: any) {
        alert(err.message || 'Failed to update branch status');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
              Enterprise Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-7 h-7 text-brand-600" />
            <span>Multi-Branch Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage regional studios, assign branch managers, and track decentralized site performance.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-900/20 active:scale-[0.98] transition-all cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Aggregated Organization Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Studios</span>
            <Building className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {summaryMetrics.totalBranches}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{summaryMetrics.activeBranches} Active locations</span>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Allocated Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {summaryMetrics.totalProjects}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across registered branches
          </div>
        </div>

        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Branch Contract Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {formatINRCompact(summaryMetrics.totalContractValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {formatINR(summaryMetrics.totalContractValue)}
          </div>
        </div>

        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Actual Branch Spend</span>
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {formatINRCompact(summaryMetrics.totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total project expenses logged
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by studio name, code, city, or manager..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            {(['all', 'active', 'inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Branches List Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-semibold">
          Loading studio branches...
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Branches Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery ? 'No studio branch matches your current search filters.' : 'Get started by creating your first regional branch or studio location.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700 shadow-sm transition-all"
          >
            Create Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map(branch => (
            <div 
              key={branch.id} 
              className={`premium-card p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                !branch.is_active ? 'opacity-70 bg-slate-50/80 border-dashed' : ''
              }`}
            >
              <div>
                {/* Header: Title & Status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold font-display text-slate-900 truncate">
                        {branch.name}
                      </h3>
                      {branch.code && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {branch.code}
                        </span>
                      )}
                    </div>
                    {(branch.city || branch.state) && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {[branch.city, branch.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                    branch.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {branch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Manager & Contact */}
                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 font-semibold">Studio Manager:</span>
                    <span className="font-bold text-slate-800 truncate ml-2">
                      {branch.managerName || 'Unassigned'}
                    </span>
                  </div>

                  {branch.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> Phone:
                      </span>
                      <span className="font-medium text-slate-700">{branch.phone}</span>
                    </div>
                  )}

                  {branch.email && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> Email:
                      </span>
                      <span className="font-medium text-slate-700 truncate ml-2">{branch.email}</span>
                    </div>
                  )}
                </div>

                {/* Real Branch Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Active Projects
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {branch.project_count || 0}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Team Count
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {branch.team_count || 0}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Contract Value
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700">
                      {formatINRCompact(branch.total_contract_value || 0)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Actual Expenses
                    </span>
                    <span className="text-xs font-extrabold text-amber-700">
                      {formatINRCompact(branch.total_expenses || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleBranchStatus(branch)}
                  className={`text-xs font-bold transition-colors cursor-pointer ${
                    branch.is_active 
                      ? 'text-slate-500 hover:text-rose-600'
                      : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {branch.is_active ? 'Deactivate Branch' : 'Activate Branch'}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(branch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Branch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Branch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingBranch ? 'Edit Studio Branch' : 'Create New Studio Branch'}
        subtitle="Branches allow segregating staff, active site execution, and regional expense budgets."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Branch Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Bandra Flagship Studio"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                placeholder="e.g. MUM-BAN"
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={formCity}
                onChange={e => setFormCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={formState}
                onChange={e => setFormState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Office / Studio Address
              </label>
              <input
                type="text"
                placeholder="e.g. 14th Road, Off Linking Road, Bandra West"
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Branch Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98201 55901"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Branch Email
              </label>
              <input
                type="email"
                placeholder="bandra@apniestate.in"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Assign Branch Manager
              </label>
              <select
                value={formManagerId}
                onChange={e => setFormManagerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">-- No Branch Manager Assigned --</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} ({member.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="formIsActive"
                checked={formIsActive}
                onChange={e => setFormIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="formIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                Branch is currently operational and accepting project assignments
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
