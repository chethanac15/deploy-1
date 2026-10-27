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
  const activeProjects = projects.filter(project => project.status !== 'Completed');
  const projectsNeedingAttention = activeProjects.filter(project => project.status !== 'On Track').length;
  const deliveryHealthPercent = activeProjects.length
    ? Math.round((activeProjects.length - projectsNeedingAttention) / activeProjects.length * 100)
    : 0;
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
    Boolean(task.due_date || task.dueDate) &&
    (task.due_date || task.dueDate || '') < new Date().toISOString().slice(0, 10) &&
    task.status !== 'Completed' && task.status !== 'Cancelled'
  ).length;
  const today = new Date().toISOString().slice(0, 10);
  const daysLate = (date: string) => {
    const dueTime = Date.parse(`${date}T00:00:00Z`);
    const todayTime = Date.parse(`${today}T00:00:00Z`);
    return Number.isFinite(dueTime) && Number.isFinite(todayTime)
      ? Math.max(1, Math.floor((todayTime - dueTime) / 86400000))
      : 1;
  };
  const attentionQueue = [
    ...tasks
      .filter(task =>
        Boolean(task.due_date || task.dueDate) &&
        (task.due_date || task.dueDate || '') < today &&
        task.status !== 'Completed' && task.status !== 'Cancelled'
      )
      .sort((a, b) => (a.due_date || a.dueDate || '').localeCompare(b.due_date || b.dueDate || ''))
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        context: [task.projectName || projects.find(project => project.id === (task.project_id || task.projectId))?.name, task.assigned_staff_name].filter(Boolean).join(' · ') || 'Unassigned project task',
        label: 'Overdue task',
        detail: `${daysLate(task.due_date || task.dueDate || today)}d overdue`,
        tone: 'rose',
        onSelect: () => setCurrentPage('tasks')
      })),
    ...purchases
      .filter(purchase =>
        purchase.expected_delivery &&
        purchase.expected_delivery < today &&
        !['Received', 'Delivered', 'Cancelled', 'received', 'delivered', 'cancelled'].includes(purchase.status)
      )
      .map(purchase => ({
        id: `delivery-${purchase.id}`,
        title: `${purchase.po_number} · ${purchase.vendorName || 'Vendor'}`,
        context: purchase.projectName || projects.find(project => project.id === (purchase.project_id || purchase.projectId))?.name || 'Project purchase',
        label: 'Delivery overdue',
        detail: `${daysLate(purchase.expected_delivery || today)}d late`,
        tone: 'amber',
        onSelect: () => setCurrentPage('purchases')
      })),
    ...activeProjects
      .filter(project => project.status !== 'On Track')
      .map(project => ({
        id: `project-${project.id}`,
        title: project.name,
        context: `${project.city || project.location} · ${project.progress}% complete`,
        label: project.status,
        detail: 'Review site',
        tone: project.status === 'Delayed' ? 'rose' : 'amber',
        onSelect: () => openProjectDetail(project.id)
      })),
    ...(pendingClientApprovals > 0 ? [{
      id: 'client-approvals',
      title: `${pendingClientApprovals} quotation${pendingClientApprovals === 1 ? '' : 's'} awaiting client decision`,
      context: 'Review sent quotations and follow up with clients',
      label: 'Client approval',
      detail: 'Review',
      tone: 'blue',
      onSelect: () => setCurrentPage('quotations')
    }] : [])
  ].slice(0, 5);

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
              Welcome, {userFirstName}
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
              <span>Create first project</span>
            </button>
          </div>
        </div>

        {/* Welcome Onboarding Checklist Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Getting started</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-950">
              Get started with your interior studio in 5 simple steps
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Bring project scope, budgets, materials and site updates into one clear workspace.
            </p>

            {/* Onboarding Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              <div 
                onClick={() => setCurrentPage('clients')}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-brand-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-brand-700">Add your first client</span>
                </div>
                <p className="text-[11px] text-slate-500">Keep contact details and project preferences together.</p>
              </div>

              <div 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-brand-700 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-brand-700">Create a project</span>
                </div>
                <p className="text-[11px] text-slate-500">Set the scope, budget, location and target dates.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2.5 text-brand-700 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-xs font-semibold text-slate-900">Define room scope</span>
                </div>
                <p className="text-[11px] text-slate-500">Break down the work by room and deliverable.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2.5 text-amber-400 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-xs font-semibold text-slate-900">Build the estimate</span>
                </div>
                <p className="text-[11px] text-slate-500">Add quantities, materials and trade costs.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2.5 text-brand-700 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">5</div>
                  <span className="text-xs font-semibold text-slate-900">Track site progress</span>
                </div>
                <p className="text-[11px] text-slate-500">Keep daily updates, stock and photos in context.</p>
              </div>

              <div 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100/70 transition-all cursor-pointer flex flex-col justify-center text-center"
              >
                <div className="text-xs font-semibold text-slate-900 mb-0.5">Start with a project</div>
                <div className="text-[10px] text-slate-500">You can add details as you go</div>
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
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300 pb-12">
      {/* Dashboard Top Header */}
      <section className="dashboard-hero grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)] lg:items-center lg:p-8">
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Studio overview
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-[2.1rem]">
            Good day, {userFirstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Projects, budgets and decisions for <strong className="font-semibold text-slate-900">{companyName}</strong> — together in one view.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-4 w-4 text-white" />
              New project
            </button>
            <span className="text-xs font-medium text-slate-500">
              {stats.activeProjectsCount} active project{stats.activeProjectsCount === 1 ? '' : 's'} across your portfolio
            </span>
          </div>
        </div>
        <div className="dashboard-hero-panel relative z-10 rounded-xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Portfolio health</p>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">{stats.activeProjectsCount} active sites</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-600">
              {projectsNeedingAttention === 0 ? 'All active sites on track' : `${projectsNeedingAttention} site${projectsNeedingAttention === 1 ? '' : 's'} need attention`}
            </span>
            <span className="font-bold text-slate-900">
              {deliveryHealthPercent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-700"
              style={{
                width: `${deliveryHealthPercent}%`
              }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-amber-200/70 pt-3">
            <span className="text-xs text-slate-600">Projects needing attention</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${projectsNeedingAttention ? 'bg-amber-200 text-amber-950' : 'bg-emerald-100 text-emerald-800'}`}>
              {projectsNeedingAttention}
            </span>
          </div>
        </div>
      </section>

      {/* 4 Premium KPI Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Active Projects */}
        <div 
          onClick={() => setCurrentPage('projects')}
          className="premium-card metric-card metric-card--blue p-5 cursor-pointer group hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Active projects</span>
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
            <span>{projectsNeedingAttention} need attention</span>
          </div>
        </div>

        {/* KPI 2: Total Project Value */}
        <div className="premium-card metric-card metric-card--teal p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Total project value</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
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
          className="premium-card metric-card metric-card--violet p-5 cursor-pointer group hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Total budget</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center group-hover:scale-110 transition-transform">
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
          className="premium-card metric-card metric-card--amber p-5 cursor-pointer group hover:border-brand-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-slate-500">Total spent</span>
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

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr_0.85fr]">
        <div className="premium-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">Portfolio finance</p>
              <h2 className="section-heading mt-1 text-base font-extrabold text-slate-900">Live contract &amp; cost position</h2>
            </div>
            <button onClick={() => setCurrentPage('reports')} className="text-xs font-bold text-brand-700 hover:underline">Financial reports</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contract value</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatINRCompact(contractValue)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue received</p>
              <p className="mt-1 text-sm font-bold text-brand-700">{formatINRCompact(revenueReceived)}</p>
            </div>
            <div className="rounded-lg bg-amber-50/70 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">Actual cost</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatINRCompact(actualCost)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current profit</p>
              <p className={`mt-1 text-sm font-bold ${currentProfit < 0 ? 'text-rose-700' : 'text-brand-700'}`}>{formatINRCompact(currentProfit)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Profit margin</p>
              <p className={`mt-1 text-sm font-bold ${currentMargin < 0 ? 'text-rose-700' : 'text-brand-700'}`}>{currentMargin.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Outstanding revenue</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatINRCompact(Math.max(contractValue - revenueReceived, 0))}</p>
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
            <button onClick={() => setCurrentPage('purchases')} className="flex w-full items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2.5 text-left hover:bg-brand-100">
              <span className="text-xs font-semibold text-slate-700">Open purchase orders</span><span className="text-sm font-bold text-brand-800">{openPurchaseOrders}</span>
            </button>
            <button onClick={() => setCurrentPage('tasks')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2.5 text-left hover:bg-rose-100">
              <span className="text-xs font-semibold text-slate-700">Overdue tasks</span><span className="text-sm font-black text-rose-800">{overdueTaskCount}</span>
            </button>
          </div>
          {approvalDataError && <p role="alert" className="mt-3 text-[10px] text-rose-700">Client approvals could not be loaded: {approvalDataError}</p>}
        </div>
      </section>

      <section className="premium-card overflow-hidden" aria-labelledby="priority-actions-heading">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">Keep work moving</p>
            <h2 id="priority-actions-heading" className="section-heading mt-1 text-base font-extrabold text-slate-900">Priority actions</h2>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {attentionQueue.length} {attentionQueue.length === 1 ? 'item' : 'items'} shown
          </span>
        </div>
        {attentionQueue.length ? (
          <div className="divide-y divide-slate-100">
            {attentionQueue.map(item => (
              <button
                key={item.id}
                onClick={item.onSelect}
                className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 sm:gap-4"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  item.tone === 'rose' ? 'bg-rose-50 text-rose-600' :
                  item.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {item.tone === 'blue' ? <FileText className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-slate-900">{item.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.tone === 'rose' ? 'bg-rose-50 text-rose-700' :
                      item.tone === 'amber' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-700'
                    }`}>{item.label}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{item.context}</span>
                </span>
                <span className="hidden shrink-0 text-xs font-semibold text-slate-500 sm:block">{item.detail}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">You’re all caught up</p>
              <p className="text-xs text-slate-500">No overdue tasks, deliveries, site alerts, or client decisions need action.</p>
            </div>
          </div>
        )}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <div className="project-cover-fallback relative h-44 w-full overflow-hidden">
                    <img
                      src={project.coverImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/interior_studio_office_bg.jpg';
                      }}
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
