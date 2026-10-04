// ==============================================================================
// APNI ESTATE INTERIORS - LEADS CRM PAGE (SALES PIPELINE & CLIENT CONVERSION)
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Lead, LeadStatus, LeadSource } from '../types';
import { formatINR, formatINRCompact, formatDate } from '../utils/formatters';
import { 
  UserPlus, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Tag, 
  IndianRupee, 
  ArrowRight, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Sparkles, 
  LayoutGrid, 
  List, 
  Filter, 
  UserCheck, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Building2,
  Clock,
  Users
} from 'lucide-react';
import { LeadModal } from '../components/modals/LeadModal';
import { EmptyState } from '../components/common/EmptyState';

const STATUS_COLUMNS: LeadStatus[] = [
  'New',
  'Contacted',
  'Site Visit Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  'New': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Contacted': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Site Visit Scheduled': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Proposal Sent': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Won': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Lost': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

export const LeadsPage: React.FC = () => {
  const { leads, deleteLead, convertLeadToClient, updateLead, openProjectDetail, setCurrentPage } = useApp();
  const { isDemoMode } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  // Conversion state
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          lead.name.toLowerCase().includes(q) ||
          (lead.phone && lead.phone.toLowerCase().includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.requirement && lead.requirement.toLowerCase().includes(q)) ||
          (lead.notes && lead.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
      if (sourceFilter !== 'All' && lead.source !== sourceFilter) return false;
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  // Metric summaries
  const totalLeads = leads.length;
  const activePipelineLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
  const pipelineValue = activePipelineLeads.reduce((acc, l) => acc + (l.estimated_budget || 0), 0);
  const wonLeads = leads.filter(l => l.status === 'Won').length;

  const handleConvert = async (lead: Lead) => {
    if (lead.converted_client_id) {
      alert('This lead has already been converted to an active client.');
      return;
    }

    if (confirm(`Convert "${lead.name}" to an active Client record in your CRM?`)) {
      setConvertingLeadId(lead.id);
      try {
        await convertLeadToClient(lead.id);
        setConversionSuccess(`"${lead.name}" successfully converted to Client!`);
        setTimeout(() => setConversionSuccess(null), 4000);
      } catch (err: any) {
        alert(err.message || 'Failed to convert lead.');
      } finally {
        setConvertingLeadId(null);
      }
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    try {
      await updateLead(lead.id, { status: newStatus });
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Leads & Inquiries
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
              {leads.length} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Capture prospective clients, track consultation stages, and convert won proposals into live projects.
          </p>
        </div>

        <button
          onClick={() => {
            setLeadToEdit(null);
            setIsLeadModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto min-h-[42px] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>+ Capture Lead</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {conversionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{conversionSuccess}</span>
          </div>
          <button
            onClick={() => setCurrentPage('clients')}
            className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View Clients</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="premium-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Pipeline</span>
            <Clock className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {activePipelineLeads.length}
          </div>
          <span className="text-[11px] text-slate-400">In discussion or proposal</span>
        </div>

        <div className="premium-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Pipeline Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-emerald-700">
            {formatINRCompact(pipelineValue)}
          </div>
          <span className="text-[11px] text-slate-400">Estimated budget volume</span>
        </div>

        <div className="premium-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Converted Won</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-purple-700">
            {wonLeads}
          </div>
          <span className="text-[11px] text-slate-400">Successful conversions</span>
        </div>

        <div className="premium-card p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Win Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-blue-700">
            {totalLeads > 0 ? `${Math.round((wonLeads / totalLeads) * 100)}%` : '0%'}
          </div>
          <span className="text-[11px] text-slate-400">Conversion efficiency</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, phone, email, requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none shrink-0"
          >
            <option value="All">All Stages</option>
            {STATUS_COLUMNS.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none shrink-0"
          >
            <option value="All">All Sources</option>
            {(['Instagram', 'Website', 'Referral', 'Walk-in', 'Housing Portal', 'Other'] as LeadSource[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('board')}
              title="Pipeline Board"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'board' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Pipeline Board or List */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads match your criteria"
          description="Capture incoming consultation inquiries from Instagram, website forms, or client referrals."
          actionLabel="+ Capture New Lead"
          onAction={() => {
            setLeadToEdit(null);
            setIsLeadModalOpen(true);
          }}
        />
      ) : viewMode === 'board' ? (
        /* Kanban Pipeline Board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.filter(st => statusFilter === 'All' || statusFilter === st).map((colStatus) => {
            const colLeads = filteredLeads.filter(l => l.status === colStatus);
            const style = STATUS_COLORS[colStatus];

            return (
              <div key={colStatus} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col gap-3 min-h-[220px]">
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                      {colStatus}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {colLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {formatINRCompact(colLeads.reduce((s, l) => s + (l.estimated_budget || 0), 0))}
                  </span>
                </div>

                {/* Lead Cards */}
                <div className="space-y-3">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-brand-300 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-xs text-slate-900 group-hover:text-brand-600 transition-colors">
                            {lead.name}
                          </h3>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {lead.source}
                          </span>
                        </div>

                        {lead.requirement && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 mb-2.5">
                            {lead.requirement}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Budget:</span>
                          <span className="font-extrabold text-slate-900">
                            {lead.estimated_budget ? formatINR(lead.estimated_budget) : 'TBD'}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2 mb-2">
                          {lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <a href={`tel:${lead.phone}`} className="hover:text-brand-600 truncate">{lead.phone}</a>
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        {lead.converted_client_id ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Client Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConvert(lead)}
                            disabled={convertingLeadId === lead.id}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-md border border-brand-200 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-brand-600" />
                            <span>Convert to Client</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setLeadToEdit(lead);
                              setIsLeadModalOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete lead "${lead.name}"?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Prospect Name</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Est. Budget</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLeads.map((lead) => {
                  const style = STATUS_COLORS[lead.status];
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{lead.name}</div>
                        {lead.requirement && (
                          <div className="text-[11px] text-slate-500 font-normal line-clamp-1 max-w-xs mt-0.5">
                            {lead.requirement}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                          className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md border focus:outline-none ${style.bg} ${style.text} ${style.border}`}
                        >
                          {STATUS_COLUMNS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {lead.estimated_budget ? formatINR(lead.estimated_budget) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>{lead.phone || '—'}</div>
                        <div className="text-slate-400">{lead.email || ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] font-semibold text-slate-700">
                        {lead.assigned_staff_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.converted_client_id ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Converted
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConvert(lead)}
                              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline px-2 py-1"
                            >
                              Convert
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setLeadToEdit(lead);
                              setIsLeadModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete lead "${lead.name}"?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Capture / Edit Lead Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setLeadToEdit(null);
        }}
        leadToEdit={leadToEdit}
      />
    </div>
  );
};
