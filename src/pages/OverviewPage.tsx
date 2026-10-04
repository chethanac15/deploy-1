import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderKanban, 
  IndianRupee, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  Layers, 
  Calendar, 
  MapPin, 
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  Users,
  Building2,
  Package,
  Receipt,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { formatINR, formatINRCompact, calculateDaysRemaining } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { milestoneService } from '../services/milestoneService';
import { quotationService } from '../services/quotationService';

export const OverviewPage: React.FC = () => {
  const { 
    projects, 
    clients,
    expenses, 
    clientPayments,
    purchases,
    tasks,
    boqItems,
    milestones,
    attentionItems, 
    stats, 
    openProjectDetail, 
    setCurrentPage, 
    setIsNewProjectModalOpen,
    setIsAddExpenseModalOpen,
    globalSearch 
  } = useApp();

  const { profile, organization, isDemoMode, setIsDemoMode, user } = useAuth();

  const [projectFilter, setProjectFilter] = useState<'All' | 'Residential' | 'Commercial' | 'Needs Attention'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pendingClientApprovals, setPendingClientApprovals] = useState(0);
  const [approvalDataError, setApprovalDataError] = useState('');

  useEffect(() => {
    let active = true;
    const loadPendingClientApprovals = async () => {
      try {
        if (isDemoMode) {
          const saved = localStorage.getItem('apni_estate_quotations');
          const quotes = saved ? JSON.parse(saved) : [];
          if (active) setPendingClientApprovals(quotes.filter((quote: { status?: string }) => quote.status === 'sent').length);
        } else if (organization?.id) {
          const quotes = await quotationService.getQuotations(organization.id);
          if (active) setPendingClientApprovals(quotes.filter(quote => quote.status === 'sent').length);
        } else if (active) {
          setPendingClientApprovals(0);
        }
        if (active) setApprovalDataError('');
      } catch (err) {
        if (active) setApprovalDataError(err instanceof Error ? err.message : 'Client approval count is unavailable.');
      }
    };
    loadPendingClientApprovals();
    return () => { active = false; };
  }, [organization?.id, isDemoMode]);

  const userFirstName = profile?.full_name?.trim().split(' ')[0] || (isDemoMode ? 'Aarav' : 'Designer');
  const companyName = organization?.name || (isDemoMode ? 'Apni Estate Interiors' : 'Your Studio');
  const contractValue = projects.reduce((sum, project) => sum + Number(project.contract_value ?? project.budget ?? 0), 0);
  const revenueReceived = clientPayments.reduce((sum, payment) => sum + (Number(payment.paid_amount) || 0), 0);
  const actualCost = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const currentProfit = contractValue - actualCost;
  const currentMargin = contractValue > 0 ? currentProfit / contractValue * 100 : 0;
  const profitAtRisk = projects.reduce((sum, project) => {
    const plannedCost = boqItems.filter(item => item.project_id === project.id)
      .reduce((itemSum, item) => itemSum + (Number(item.estimated_cost) || 0), 0);
    const projectCost = expenses.filter(expense => expense.projectId === project.id)
      .reduce((expenseSum, expense) => expenseSum + (Number(expense.amount) || 0), 0);
    return sum + Math.max(projectCost - plannedCost, 0);
  }, 0);
  const openPurchaseOrders = purchases.filter(purchase =>
    purchase.status === 'Draft' || purchase.status === 'Ordered' || purchase.status === 'Partially Received'
  ).length;
  const overdueTaskCount = tasks.filter(task =>
    (task.due_date || task.dueDate || '') < new Date().toISOString().slice(0, 10) &&
    task.status !== 'Completed' && task.status !== 'Cancelled'
  ).length;

  // Filter projects for the dashboard section
  const filteredProjects = projects.filter(p => {
    // Search match
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      const match = p.name.toLowerCase().includes(q) || 
                    p.client.toLowerCase().includes(q) || 
                    p.location.toLowerCase().includes(q) ||
                    p.city.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (projectFilter === 'Residential') return p.type === 'Residential';
    if (projectFilter === 'Commercial') return p.type === 'Commercial';
    if (projectFilter === 'Needs Attention') {
      return p.status === 'Needs Attention' || p.status === 'Budget Alert' || p.status === 'Delayed';
    }
    return true;
  });

  // Data for Budget vs Spent comparative chart
  const topProjectsBudgetChart = projects.slice(0, 5).map(p => ({
    name: p.name.length > 14 ? p.name.substring(0, 14) + '...' : p.name,
    budget: Math.round(p.budget / 100000), // In Lakhs
    spent: Math.round(p.spent / 100000),   // In Lakhs
    fullName: p.name
  }));

  // ============================================================================
  // EMPTY STATE / NEW COMPANY ONBOARDING HERO (When 0 Projects)
  // ============================================================================
  if (projects.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Welcome, {userFirstName} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Your company workspace for <strong className="text-slate-800 font-bold">{companyName}</strong> is ready.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create First Project</span>
            </button>
          </div>
        </div>

        {/* Welcome Onboarding Checklist Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Onboarding Guide</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Get started with your interior studio in 5 simple steps
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Apni Estate Interiors helps your team organize turnkey projects, manage multi-room budgets, track live material stock, and publish daily site updates for clients.
            </p>

            {/* Onboarding Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              <div 
                onClick={() => setCurrentPage('clients')}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-brand-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-brand-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center text-xs font-black">1</div>
                  <span className="text-xs font-bold text-white group-hover:text-brand-300">Add First Client</span>
                </div>
                <p className="text-[11px] text-slate-400">Save client contact details, site address, and preferences.</p>
              </div>

              <div 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-brand-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-purple-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-xs font-black">2</div>
                  <span className="text-xs font-bold text-white group-hover:text-purple-300">Create Project</span>
                </div>
                <p className="text-[11px] text-slate-400">Set project contract value, timeline deadlines, and location.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5 text-emerald-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs font-black">3</div>
                  <span className="text-xs font-bold text-white">Define Room Scope</span>
                </div>
                <p className="text-[11px] text-slate-400">Divide projects into Living Room, Kitchen, Master Bed, etc.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5 text-amber-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-black">4</div>
                  <span className="text-xs font-bold text-white">Build BOQ Estimates</span>
                </div>
                <p className="text-[11px] text-slate-400">Itemize civil, woodwork, electrical, and finish costs.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5 text-cyan-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-black">5</div>
                  <span className="text-xs font-bold text-white">Log Site Activity</span>
                </div>
                <p className="text-[11px] text-slate-400">Record daily site diary DPRs, materials stock, and photos.</p>
              </div>

              <div 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-4 rounded-2xl bg-brand-600/20 border border-brand-500/40 hover:bg-brand-600/30 transition-all cursor-pointer flex flex-col justify-center text-center"
              >
                <div className="text-xs font-bold text-brand-300 mb-0.5">+ Launch First Project</div>
                <div className="text-[10px] text-slate-400">Takes less than 60 seconds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Zero State Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="premium-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Active Projects</div>
            <div className="text-3xl font-extrabold font-display text-slate-900">0</div>
            <div className="text-xs text-slate-400 mt-1">No active sites</div>
          </div>

          <div className="premium-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Project Value</div>
            <div className="text-3xl font-extrabold font-display text-slate-900">₹0</div>
            <div className="text-xs text-slate-400 mt-1">0 planned projects</div>
          </div>

          <div className="premium-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Budget</div>
            <div className="text-3xl font-extrabold font-display text-slate-900">₹0</div>
            <div className="text-xs text-slate-400 mt-1">₹0 allocated</div>
          </div>

          <div className="premium-card p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Spent</div>
            <div className="text-3xl font-extrabold font-display text-slate-900">₹0</div>
            <div className="text-xs text-slate-400 mt-1">0 expense transactions</div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // POPULATED DASHBOARD VIEW (When Projects Exist)
  // ============================================================================
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Good day, {userFirstName} 👋
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Operational summary for <strong className="text-slate-800 font-bold">{companyName}</strong> across <strong className="text-slate-700 font-semibold">{stats.activeProjectsCount} active projects</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* 4 Premium KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Active Projects */}
        <div 
          onClick={() => setCurrentPage('projects')}
          className="premium-card p-5 cursor-pointer group hover:border-brand-300 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold font-display text-slate-900">{stats.activeProjectsCount}</span>
            <span className="text-xs text-slate-400 font-medium">projects</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{stats.needAttentionCount} need attention</span>
          </div>
        </div>

        {/* KPI 2: Total Project Value */}
        <div className="premium-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Project Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold font-display text-slate-900">{formatINRCompact(stats.totalProjectValue)}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span>Across active portfolios</span>
          </div>
        </div>

        {/* KPI 3: Total Budget */}
        <div 
          onClick={() => setCurrentPage('budget')}
          className="premium-card p-5 cursor-pointer group hover:border-brand-300 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Budget</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold font-display text-slate-900">{formatINRCompact(stats.totalBudget)}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span>Total allocated spend</span>
          </div>
        </div>

        {/* KPI 4: Total Spent */}
        <div 
          onClick={() => setCurrentPage('expenses')}
          className="premium-card p-5 cursor-pointer group hover:border-brand-300 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Spent</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold font-display text-slate-900">{formatINRCompact(stats.totalSpent)}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-700">{stats.spentPercentage.toFixed(1)}%</span> of total budget utilized
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.8fr_0.85fr]">
        <div className="premium-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">Portfolio finance</p>
              <h2 className="mt-1 text-sm font-extrabold text-slate-900">Live contract &amp; cost position</h2>
            </div>
            <button onClick={() => setCurrentPage('reports')} className="text-xs font-bold text-brand-700 hover:underline">Financial reports</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract value</p>
              <p className="mt-1 text-sm font-black text-slate-900">{formatINRCompact(contractValue)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Revenue received</p>
              <p className="mt-1 text-sm font-black text-emerald-800">{formatINRCompact(revenueReceived)}</p>
            </div>
            <div className="rounded-xl bg-amber-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Actual cost</p>
              <p className="mt-1 text-sm font-black text-amber-800">{formatINRCompact(actualCost)}</p>
            </div>
            <div className="rounded-xl bg-indigo-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Current profit</p>
              <p className={`mt-1 text-sm font-black ${currentProfit < 0 ? 'text-rose-700' : 'text-indigo-800'}`}>{formatINRCompact(currentProfit)}</p>
            </div>
            <div className="rounded-xl bg-purple-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Profit margin</p>
              <p className={`mt-1 text-sm font-black ${currentMargin < 0 ? 'text-rose-700' : 'text-purple-800'}`}>{currentMargin.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding revenue</p>
              <p className="mt-1 text-sm font-black text-slate-900">{formatINRCompact(Math.max(contractValue - revenueReceived, 0))}</p>
            </div>
          </div>
        </div>

        <div className={`premium-card p-5 ${profitAtRisk > 0 ? 'border-rose-200 bg-rose-50/30' : ''}`}>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">Profit at risk</p>
          <p className={`mt-2 text-2xl font-black ${profitAtRisk > 0 ? 'text-rose-700' : 'text-slate-900'}`}>{formatINR(profitAtRisk)}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {profitAtRisk > 0
              ? 'Captured expenses exceed BOQ estimates by this amount across the portfolio.'
              : 'No recorded expense-over-BOQ overrun. This excludes risks not yet recorded against a BOQ.'}
          </p>
          <button onClick={() => setCurrentPage('budget')} className="mt-3 text-xs font-bold text-brand-700 hover:underline">Review project budgets</button>
        </div>

        <div className="premium-card p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Pending actions</p>
          <div className="mt-3 space-y-2.5">
            <button onClick={() => setCurrentPage('quotations')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-left hover:bg-amber-100">
              <span className="text-xs font-semibold text-slate-700">Client approvals</span><span className="text-sm font-black text-amber-800">{pendingClientApprovals}</span>
            </button>
            <button onClick={() => setCurrentPage('purchases')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-left hover:bg-indigo-100">
              <span className="text-xs font-semibold text-slate-700">Open purchase orders</span><span className="text-sm font-black text-indigo-800">{openPurchaseOrders}</span>
            </button>
            <button onClick={() => setCurrentPage('tasks')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2.5 text-left hover:bg-rose-100">
              <span className="text-xs font-semibold text-slate-700">Overdue tasks</span><span className="text-sm font-black text-rose-800">{overdueTaskCount}</span>
            </button>
          </div>
          {approvalDataError && <p role="alert" className="mt-3 text-[10px] text-rose-700">Client approvals could not be loaded: {approvalDataError}</p>}
        </div>
      </section>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 tracking-tight">
              Active Project Portfolios
            </h2>
            <p className="text-xs text-slate-500">Real-time site progress and budget health tracking.</p>
          </div>

          {/* Controls: Filter tabs & View mode toggle */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['All', 'Residential', 'Commercial', 'Needs Attention'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    projectFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-slate-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setCurrentPage('projects')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors cursor-pointer"
            >
              View All ({projects.length}) →
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProjects.slice(0, 8).map((project) => {
              const daysInfo = calculateDaysRemaining(project.deadline);
              const remainingBudget = Math.max(0, project.budget - project.spent);
              const projectMilestones = milestones.filter(m => m.project_id === project.id);
              const derivedProg = milestoneService.calculateProjectMilestoneProgress(projectMilestones);
              const displayProgress = derivedProg !== null ? derivedProg : project.progress;

              return (
                <div
                  key={project.id}
                  onClick={() => openProjectDetail(project.id)}
                  className="premium-card overflow-hidden cursor-pointer group flex flex-col justify-between hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Card Cover Image with Status Overlay */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={project.coverImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    
                    {/* Top status & type tags */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
                        {project.type}
                      </span>
                      <Badge status={project.status} size="sm" />
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-extrabold text-white truncate font-display drop-shadow-sm">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-200 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Financials Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Budget</div>
                        <div className="font-extrabold text-slate-900 truncate">{formatINR(project.budget)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Spent</div>
                        <div className="font-extrabold text-brand-600 truncate">{formatINR(project.spent)}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1 font-medium">
                        <span className="text-slate-500">Site Progress</span>
                        <span className="font-bold text-slate-900">{displayProgress}%</span>
                      </div>
                      <ProgressBar value={displayProgress} height="sm" />
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <span className={`font-semibold ${daysInfo.isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                        {daysInfo.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Budget</th>
                    <th className="py-3 px-4">Spent</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => {
                    const projectMilestones = milestones.filter(m => m.project_id === project.id);
                    const derivedProg = milestoneService.calculateProjectMilestoneProgress(projectMilestones);
                    const displayProgress = derivedProg !== null ? derivedProg : project.progress;

                    return (
                      <tr 
                        key={project.id}
                        onClick={() => openProjectDetail(project.id)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900">{project.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{project.client}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{formatINR(project.budget)}</td>
                        <td className="py-3.5 px-4 font-semibold text-brand-600">{formatINR(project.spent)}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-8 font-bold">{displayProgress}%</span>
                            <div className="w-20"><ProgressBar value={displayProgress} height="sm" /></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4"><Badge status={project.status} size="sm" /></td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-brand-600 font-bold hover:underline">Open Workspace →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
