// ==============================================================================
// APNI ESTATE INTERIORS - ENTERPRISE MANAGEMENT ANALYTICS DASHBOARD
// Executive-level operational, financial, procurement, and multi-branch metrics
// Built strictly from 100% REAL state - zero fabricated charts or random trends.
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { calculateProjectProfitability } from '../lib/profitabilityMetrics';
import { branchService } from '../services/branchService';
import { INITIAL_BRANCHES, INITIAL_APPROVAL_REQUESTS } from '../data/mockData';
import { formatINR, formatINRCompact, formatDate } from '../utils/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  IndianRupee, 
  FolderKanban, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  Building, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Filter,
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';

export const EnterpriseManagementPage: React.FC = () => {
  const { 
    projects, 
    expenses, 
    clientPayments, 
    purchases, 
    vendors, 
    teamMembers,
    setCurrentPage,
    openProjectDetail
  } = useApp();
  const { isDemoMode } = useAuth();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('all');

  // Branch list
  const branches = useMemo(() => {
    return isDemoMode ? INITIAL_BRANCHES : [];
  }, [isDemoMode]);

  // Filter projects based on branch and typology
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesBranch = selectedBranchId === 'all' || p.branch_id === selectedBranchId;
      const matchesType = selectedProjectType === 'all' || p.type.toLowerCase() === selectedProjectType.toLowerCase();
      return matchesBranch && matchesType;
    });
  }, [projects, selectedBranchId, selectedProjectType]);

  const filteredProjectIds = useMemo(() => new Set(filteredProjects.map(p => p.id)), [filteredProjects]);

  // Filtered child entities
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => filteredProjectIds.has(e.projectId));
  }, [expenses, filteredProjectIds]);

  const filteredPayments = useMemo(() => {
    return clientPayments.filter(p => filteredProjectIds.has(p.project_id || (p as any).projectId));
  }, [clientPayments, filteredProjectIds]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => filteredProjectIds.has(p.project_id || (p as any).projectId));
  }, [purchases, filteredProjectIds]);

  // 1. Core Financial Engine Metrics (Direct Real Sums)
  const financialTotals = useMemo(() => {
    // Total Contract Value (uses project contract_value or falls back to budgeted contract)
    const totalContractValue = filteredProjects.reduce((sum, p) => {
      return sum + (Number(p.contract_value) || Number(p.budget) || 0);
    }, 0);

    // Actual Expenses (real money paid out to vendors/labour)
    const totalActualCost = filteredExpenses.reduce((sum, e) => {
      return sum + (Number(e.amount) || 0);
    }, 0);

    // Revenue Received (real cash collected from clients)
    const totalRevenueReceived = filteredPayments.reduce((sum, p) => {
      return sum + (Number(p.paid_amount) || 0);
    }, 0);

    // Outstanding Client Collections (scheduled receivables not yet collected)
    const totalScheduledReceivables = filteredPayments.reduce((sum, p) => {
      return sum + (Number(p.amount) || 0);
    }, 0);
    const outstandingCollections = Math.max(0, totalScheduledReceivables - totalRevenueReceived);

    // Outstanding against total contract
    const unbilledContractValue = Math.max(0, totalContractValue - totalRevenueReceived);

    // Gross Profit & Margin
    const grossProjectedProfit = totalContractValue - totalActualCost;
    const grossMarginPct = totalContractValue > 0 ? (grossProjectedProfit / totalContractValue) * 100 : 0;

    // Realized Net Cash Position
    const realizedCashPosition = totalRevenueReceived - totalActualCost;

    // Procurement Commitments (POs in 'Ordered' or 'Partially Received' status)
    const committedProcurement = filteredPurchases
      .filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'ordered' || s === 'partially_received' || s === 'partially received';
      })
      .reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

    return {
      totalContractValue,
      totalActualCost,
      totalRevenueReceived,
      outstandingCollections,
      unbilledContractValue,
      grossProjectedProfit,
      grossMarginPct,
      realizedCashPosition,
      committedProcurement
    };
  }, [filteredProjects, filteredExpenses, filteredPayments, filteredPurchases]);

  // 2. Project Health & Budget Risks
  const projectHealthMetrics = useMemo(() => {
    const active = filteredProjects.filter(p => p.progress < 100 && p.status !== 'Completed');
    const completed = filteredProjects.filter(p => p.progress === 100 || p.status === 'Completed');

    // Projects where expenses > budget
    const overBudget = filteredProjects.filter(p => {
      const budget = Number(p.budget) || 0;
      const spent = Number(p.spent) || 0;
      return budget > 0 && spent > budget;
    });

    // Projects at budget risk (between 90% and 100% of budget)
    const atRisk = filteredProjects.filter(p => {
      const budget = Number(p.budget) || 0;
      const spent = Number(p.spent) || 0;
      return budget > 0 && spent >= budget * 0.9 && spent <= budget;
    });

    return {
      activeCount: active.length,
      completedCount: completed.length,
      overBudgetCount: overBudget.length,
      atRiskCount: atRisk.length,
      overBudgetProjects: overBudget,
      atRiskProjects: atRisk
    };
  }, [filteredProjects]);

  // 3. Project Profitability Ranking
  const projectProfitabilityList = useMemo(() => {
    return filteredProjects.map(proj => {
      return calculateProjectProfitability(proj, expenses, clientPayments);
    }).sort((a, b) => b.grossProfit - a.grossProfit);
  }, [filteredProjects, expenses, clientPayments]);

  // 4. Real Expense Category Breakdown
  const expenseCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of filteredExpenses) {
      const cat = exp.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
    }
    const total = financialTotals.totalActualCost || 1;
    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / total) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, financialTotals.totalActualCost]);

  // 5. Procurement Status Breakdown
  const procurementSummary = useMemo(() => {
    const totalOrders = filteredPurchases.length;
    const totalValue = filteredPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const receivedOrders = filteredPurchases.filter(p => (p.status || '').toLowerCase() === 'received');
    const receivedValue = receivedOrders.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const pendingDelivery = filteredPurchases.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'ordered' || s === 'partially_received';
    });

    return {
      totalOrders,
      totalValue,
      receivedValue,
      pendingDeliveryCount: pendingDelivery.length,
      pendingDeliveryValue: financialTotals.committedProcurement
    };
  }, [filteredPurchases, financialTotals.committedProcurement]);

  // 6. Branch Performance Summary (Real derived metrics)
  const branchPerformance = useMemo(() => {
    if (branches.length === 0) return [];
    return branchService.calculateBranchMetrics(branches, projects, expenses, teamMembers);
  }, [branches, projects, expenses, teamMembers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
              Executive Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-600" />
            <span>Management Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            High-fidelity financial performance, procurement commitments, margin distribution, and risk alerts.
          </p>
        </div>

        {/* Global Multi-Branch & Project Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All Studios ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectType}
              onChange={e => setSelectedProjectType(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Typologies</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="hospitality">Hospitality</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI 1: Primary Commercial Ledger Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Contract Value */}
        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Contract Value</span>
            <FolderKanban className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {formatINRCompact(financialTotals.totalContractValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {filteredProjects.length} active projects
          </div>
        </div>

        {/* Actual Expenses Incurred */}
        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Actual Cost Incurred</span>
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {formatINRCompact(financialTotals.totalActualCost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Real expenditures paid out
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue Received</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">
            {formatINRCompact(financialTotals.totalRevenueReceived)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {financialTotals.totalContractValue > 0 
              ? `${((financialTotals.totalRevenueReceived / financialTotals.totalContractValue) * 100).toFixed(1)}% of Contract Value`
              : 'Cleared receipts'}
          </div>
        </div>

        {/* Gross Projected Margin */}
        <div className="premium-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Projected Margin</span>
            <PieChart className="w-4 h-4 text-indigo-500" />
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold font-display ${
            financialTotals.grossProjectedProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'
          }`}>
            {financialTotals.grossMarginPct.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {formatINRCompact(financialTotals.grossProjectedProfit)} Projected Profit
          </div>
        </div>
      </div>

      {/* KPI 2: Critical Working Capital & Risk Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Outstanding Receivables */}
        <div className="premium-card p-4 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Pending Client Receivables
          </span>
          <div className="text-lg font-extrabold text-slate-900">
            {formatINR(financialTotals.outstandingCollections)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Scheduled milestones awaiting payment
          </p>
        </div>

        {/* Committed Procurement */}
        <div className="premium-card p-4 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Committed Procurement Orders
          </span>
          <div className="text-lg font-extrabold text-slate-900">
            {formatINR(financialTotals.committedProcurement)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            PO commitments pending fulfillment
          </p>
        </div>

        {/* Realized Cash Balance */}
        <div className="premium-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Realized Net Cash Position
          </span>
          <div className={`text-lg font-extrabold ${
            financialTotals.realizedCashPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {formatINR(financialTotals.realizedCashPosition)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cash in hand: Receipts minus Actual Costs
          </p>
        </div>

        {/* Projects at Risk */}
        <div className="premium-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Budget Variance & Risk
          </span>
          <div className="text-lg font-extrabold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{projectHealthMetrics.overBudgetCount} Over / {projectHealthMetrics.atRiskCount} At Risk</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Projects exceeding 90% budget threshold
          </p>
        </div>
      </div>

      {/* Multi-Branch Operational Comparison (Enterprise) */}
      {branchPerformance.length > 0 && (
        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold font-display text-slate-900">
                Multi-Branch Regional Performance
              </h2>
            </div>
            <button
              onClick={() => setCurrentPage('branches')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Studios</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Studio Location</th>
                  <th className="py-2.5 px-3">Studio Manager</th>
                  <th className="py-2.5 px-3 text-center">Active Sites</th>
                  <th className="py-2.5 px-3 text-center">Staff Count</th>
                  <th className="py-2.5 px-3 text-right">Contract Value</th>
                  <th className="py-2.5 px-3 text-right">Actual Cost</th>
                  <th className="py-2.5 px-3 text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchPerformance.map(b => {
                  const contract = b.total_contract_value || 0;
                  const cost = b.total_expenses || 0;
                  const profit = contract - cost;
                  const margin = contract > 0 ? (profit / contract) * 100 : 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {b.name}
                        {b.city && <span className="text-slate-400 font-normal ml-1.5">({b.city})</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{b.managerName}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">{b.project_count || 0}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">{b.team_count || 0}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">{formatINR(contract)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-700">{formatINR(cost)}</td>
                      <td className={`py-3 px-3 text-right font-extrabold ${
                        profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {margin.toFixed(1)}% ({formatINRCompact(profit)})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Project Profitability Ranking & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Profitability Rankings (2 Cols) */}
        <div className="lg:col-span-2 premium-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold font-display text-slate-900">
                Project Profitability Ranking
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              Contract Value vs Incurred Cost
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3 text-right">Contract</th>
                  <th className="py-2.5 px-3 text-right">Actual Cost</th>
                  <th className="py-2.5 px-3 text-right">Received</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectProfitabilityList.slice(0, 7).map(item => (
                  <tr 
                    key={item.projectId}
                    onClick={() => {
                      openProjectDetail(item.projectId, 'Overview');
                    }}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {item.projectName}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                      {formatINRCompact(item.contractValue)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-700 font-semibold">
                      {formatINRCompact(item.actualCost)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      {formatINRCompact(item.revenueReceived)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatINRCompact(item.grossProfit)}
                    </td>
                    <td className={`py-3 px-3 text-right font-extrabold ${
                      item.grossMarginPct >= 20 ? 'text-emerald-600' :
                      item.grossMarginPct >= 0 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {item.grossMarginPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Category Breakdown (1 Col) */}
        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold font-display text-slate-900">
                Expense Category Share
              </h2>
            </div>
          </div>

          <div className="space-y-3.5">
            {expenseCategoryBreakdown.slice(0, 6).map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{cat.category}</span>
                  <span className="text-slate-500 font-semibold">
                    {formatINRCompact(cat.amount)} ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Recorded</span>
            <span className="font-extrabold text-slate-900">{formatINR(financialTotals.totalActualCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
