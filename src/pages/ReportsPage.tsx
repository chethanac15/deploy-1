// ==============================================================================
// APNI ESTATE INTERIORS - ADVANCED REPORTS & BUSINESS ANALYTICS
// Multi-dimensional financial & operational reporting with real metrics
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatINRCompact, formatDate } from '../utils/formatters';
import { calculateProjectProfitability, calculatePaymentScheduleMetrics } from '../lib/profitabilityMetrics';
import { 
  BarChart3, 
  TrendingUp, 
  IndianRupee, 
  Building2, 
  ShoppingBag, 
  PieChart, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  Package,
  Clock,
  Building,
  ShieldCheck,
  FolderKanban
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { materialService } from '../services/materialService';
import { branchService } from '../services/branchService';
import { INITIAL_BRANCHES, INITIAL_APPROVAL_REQUESTS } from '../data/mockData';

export const ReportsPage: React.FC = () => {
  const { 
    projects, 
    expenses, 
    clientPayments, 
    purchases, 
    vendors, 
    materials, 
    materialTransactions,
    teamMembers
  } = useApp();
  const { isDemoMode } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<
    'profitability' | 'payments' | 'vendors' | 'procurement' | 'expenses' | 'inventory' | 'branches' | 'approvals' | 'progress'
  >('profitability');

  // Branch list
  const branches = useMemo(() => {
    return isDemoMode ? INITIAL_BRANCHES : [];
  }, [isDemoMode]);

  // Filtered dataset based on project selection and branch selection
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesProj = selectedProjectId === 'All' || p.id === selectedProjectId;
      const matchesBranch = selectedBranchId === 'All' || p.branch_id === selectedBranchId;
      return matchesProj && matchesBranch;
    });
  }, [projects, selectedProjectId, selectedBranchId]);

  const filteredExpenses = useMemo(() => {
    return selectedProjectId === 'All' ? expenses : expenses.filter(e => e.projectId === selectedProjectId);
  }, [expenses, selectedProjectId]);

  const filteredPayments = useMemo(() => {
    return selectedProjectId === 'All' ? clientPayments : clientPayments.filter(p => p.project_id === selectedProjectId);
  }, [clientPayments, selectedProjectId]);

  const filteredPurchases = useMemo(() => {
    return selectedProjectId === 'All' ? purchases : purchases.filter(p => p.project_id === selectedProjectId);
  }, [purchases, selectedProjectId]);

  const filteredMaterials = useMemo(() => {
    return selectedProjectId === 'All' ? materials : materials.filter(m => (m.project_id || (m as any).projectId) === selectedProjectId);
  }, [materials, selectedProjectId]);

  // 1. Profitability Metrics
  const profitabilityList = useMemo(() => {
    return filteredProjects.map(proj => calculateProjectProfitability(proj, expenses, clientPayments));
  }, [filteredProjects, expenses, clientPayments]);

  const totalContractVal = profitabilityList.reduce((sum, p) => sum + p.contractValue, 0);
  const totalRevenueRec = profitabilityList.reduce((sum, p) => sum + p.revenueReceived, 0);
  const totalActualCost = profitabilityList.reduce((sum, p) => sum + p.actualCost, 0);
  const totalGrossProfit = totalContractVal - totalActualCost;
  const overallMarginPct = totalContractVal > 0 ? (totalGrossProfit / totalContractVal) * 100 : 0;
  const totalRealizedCash = totalRevenueRec - totalActualCost;

  // 2. Client Payment Metrics
  const paymentMetrics = useMemo(() => {
    return calculatePaymentScheduleMetrics(filteredPayments, totalContractVal);
  }, [filteredPayments, totalContractVal]);

  // 3. Vendor Category Spend
  const vendorSpendByCategory = useMemo(() => {
    const spendMap: Record<string, number> = {};
    for (const exp of filteredExpenses) {
      const cat = exp.category || 'Other';
      spendMap[cat] = (spendMap[cat] || 0) + (Number(exp.amount) || 0);
    }
    return Object.entries(spendMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // 4. Procurement Status Breakdown
  const procurementSummary = useMemo(() => {
    const totalOrders = filteredPurchases.length;
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const receivedAmount = filteredPurchases
      .filter(p => p.status === 'Received')
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const inTransitAmount = filteredPurchases
      .filter(p => p.status === 'Ordered' || p.status === 'Partially Received')
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    return {
      totalOrders,
      totalAmount,
      receivedAmount,
      inTransitAmount
    };
  }, [filteredPurchases]);

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Reports & Business Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
              Professional Suite
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Executive insights into project margins, client collections, vendor disbursements, and inventory flow.
          </p>
        </div>

        {/* Filters: Branch & Project */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="All">All Projects (Consolidated)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Reports */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
        {[
          { id: 'profitability', label: 'Project Profitability', icon: TrendingUp },
          { id: 'branches', label: 'Branch Performance', icon: Building },
          { id: 'payments', label: 'Payment Aging & Collections', icon: IndianRupee },
          { id: 'expenses', label: 'Expense Breakdown', icon: PieChart },
          { id: 'procurement', label: 'Procurement Commitments', icon: ShoppingBag },
          { id: 'vendors', label: 'Vendor Disbursements', icon: Building2 },
          { id: 'approvals', label: 'Approval Activity', icon: ShieldCheck },
          { id: 'progress', label: 'Project Progress', icon: FolderKanban },
          { id: 'inventory', label: 'Material & Site Inventory', icon: Package }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROJECT PROFITABILITY */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          {/* Top Profitability Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Contract Value
              </span>
              <span className="text-lg sm:text-2xl font-black text-slate-900 font-display block">
                {formatINR(totalContractVal)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total contracted customer scope
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Gross Profit
              </span>
              <span className="text-lg sm:text-2xl font-black text-emerald-700 font-display block">
                {formatINR(totalGrossProfit)}
              </span>
              <span className="text-[11px] text-emerald-600 mt-1 font-semibold block">
                {Math.round(overallMarginPct * 10) / 10}% Gross Margin
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 block mb-1">
                Revenue Collected
              </span>
              <span className="text-lg sm:text-2xl font-black text-indigo-900 font-display block">
                {formatINR(totalRevenueRec)}
              </span>
              <span className="text-[11px] text-indigo-600 mt-1 block">
                Actual received client receipts
              </span>
            </div>

            <div className={`bg-white p-4 sm:p-5 rounded-3xl border shadow-xs ${
              totalRealizedCash >= 0 ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Realized Cash Position
              </span>
              <span className={`text-lg sm:text-2xl font-black font-display block ${
                totalRealizedCash >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {formatINR(totalRealizedCash)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Revenue Received minus Actual Costs
              </span>
            </div>
          </div>

          {/* Project Profitability Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                Project Margin & Realized Cash Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated strictly from recorded contract values, real client receipts, and actual project expenses.
              </p>
            </div>

            {profitabilityList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No project profitability data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4 text-right">Contract Value</th>
                      <th className="py-3 px-4 text-right">Collected</th>
                      <th className="py-3 px-4 text-right">Actual Cost</th>
                      <th className="py-3 px-4 text-right">Gross Profit</th>
                      <th className="py-3 px-4 text-right">Margin %</th>
                      <th className="py-3 px-4 text-right">Cash Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {profitabilityList.map((item) => (
                      <tr key={item.projectId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.projectName}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatINR(item.contractValue)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                          {formatINR(item.revenueReceived)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-bold">
                          {formatINR(item.actualCost)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {formatINR(item.grossProfit)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                            item.grossMarginPct >= 20 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {item.grossMarginPct}%
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${
                          item.realizedCashPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatINR(item.realizedCashPosition)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT PAYMENT AGING */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Scheduled</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900 font-display block">{formatINR(paymentMetrics.totalScheduled)}</span>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">Total Collected</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-700 font-display block">{formatINR(paymentMetrics.totalReceived)}</span>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 block mb-1">Schedule Outstanding</span>
              <span className="text-lg sm:text-2xl font-black text-indigo-900 font-display block">{formatINR(paymentMetrics.scheduleOutstanding)}</span>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 bg-rose-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block mb-1">Overdue Aging</span>
              <span className="text-lg sm:text-2xl font-black text-rose-600 font-display block">{formatINR(paymentMetrics.overdueAmount)}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5">
            <h3 className="text-base font-bold font-display text-slate-900 mb-3">Milestone Aging Ledger</h3>
            <div className="space-y-3">
              {filteredPayments.map(p => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{p.title}</span>
                    <span className="text-[11px] text-slate-500">{p.projectName} • Due: {formatDate(p.due_date)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">{formatINR(p.amount)}</span>
                    <span className="text-[10px] font-bold text-emerald-600">Paid: {formatINR(p.paid_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE BREAKDOWN */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5">
            <h3 className="text-base font-bold font-display text-slate-900 mb-4">Expenses by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendorSpendByCategory.map(item => (
                <div key={item.category} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs">
                      {item.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.category}</h4>
                      <span className="text-[11px] text-slate-400">Total spent</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 font-display">
                    {formatINR(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROCUREMENT STATUS */}
      {activeTab === 'procurement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Orders</span>
              <span className="text-2xl font-black text-slate-900 font-display block">{procurementSummary.totalOrders}</span>
              <span className="text-[11px] text-slate-400 mt-1 block">Value: {formatINR(procurementSummary.totalAmount)}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">Delivered Scope</span>
              <span className="text-2xl font-black text-emerald-700 font-display block">{formatINR(procurementSummary.receivedAmount)}</span>
              <span className="text-[11px] text-emerald-600 mt-1 block">Received on site</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 block mb-1">In Transit</span>
              <span className="text-2xl font-black text-indigo-900 font-display block">{formatINR(procurementSummary.inTransitAmount)}</span>
              <span className="text-[11px] text-indigo-600 mt-1 block">Ordered / awaiting fulfillment</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VENDOR DISBURSEMENTS */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5">
            <h3 className="text-base font-bold font-display text-slate-900 mb-3">Active Vendor Directory & Scope</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <div key={v.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-xs text-slate-900">{v.name}</h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">{v.category}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">{v.phone || 'No direct phone'}</span>
                  {v.gst_number && <span className="text-[10px] font-mono text-slate-400 block mt-1">GST: {v.gst_number}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MATERIAL / INVENTORY SUMMARY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Material & Site Inventory Summary</h3>
                <p className="text-xs text-slate-500">Real on-site physical stock balances and replenishment alerts.</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                {filteredMaterials.length} Tracked SKUs
              </span>
            </div>

            {filteredMaterials.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-6 text-center">No materials registered for this project scope.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map(mat => {
                  const stockInfo = materialService.calculateStock(mat.id, materialTransactions, mat.minimum_stock);
                  const isLow = stockInfo.is_low_stock;
                  return (
                    <div key={mat.id} className={`p-4 rounded-2xl border transition-all ${
                      isLow ? 'bg-rose-50/20 border-rose-200' : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{mat.name}</h4>
                          <span className="text-[11px] text-slate-400">{mat.category || 'General Material'}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border ${
                          isLow ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Ordered</span>
                          <span className="text-xs font-bold text-slate-800">{mat.quantity_ordered || 0} {mat.unit}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Stock In</span>
                          <span className="text-xs font-bold text-emerald-600">+{stockInfo.total_in} {mat.unit}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Available</span>
                          <span className="text-xs font-black text-slate-900">{stockInfo.available} {mat.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: BRANCH PERFORMANCE REPORT (ENTERPRISE) */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Multi-Branch Performance Report</h3>
                <p className="text-xs text-slate-500">Comparative regional studio financial performance, project contracts, and margins.</p>
              </div>
              <span className="text-xs font-bold bg-brand-50 text-brand-700 px-3 py-1 rounded-xl border border-brand-200">
                {branches.length} Registered Studios
              </span>
            </div>

            {branches.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-6 text-center">No branches registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Studio Name</th>
                      <th className="py-2.5 px-3">Manager</th>
                      <th className="py-2.5 px-3 text-center">Sites</th>
                      <th className="py-2.5 px-3 text-center">Staff</th>
                      <th className="py-2.5 px-3 text-right">Contract Value</th>
                      <th className="py-2.5 px-3 text-right">Actual Cost</th>
                      <th className="py-2.5 px-3 text-right">Gross Profit</th>
                      <th className="py-2.5 px-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchService.calculateBranchMetrics(branches, projects, expenses, teamMembers).map(b => {
                      const contract = b.total_contract_value || 0;
                      const cost = b.total_expenses || 0;
                      const profit = contract - cost;
                      const margin = contract > 0 ? (profit / contract) * 100 : 0;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{b.name}</div>
                            <div className="text-[10px] text-slate-400">{b.city || 'Regional Office'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{b.managerName}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{b.project_count || 0}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{b.team_count || 0}</td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">{formatINR(contract)}</td>
                          <td className="py-3 px-3 text-right font-semibold text-amber-700">{formatINR(cost)}</td>
                          <td className={`py-3 px-3 text-right font-extrabold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatINR(profit)}
                          </td>
                          <td className={`py-3 px-3 text-right font-extrabold ${margin >= 20 ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {margin.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: APPROVAL ACTIVITY REPORT (ENTERPRISE) */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Governance & Approval Activity</h3>
                <p className="text-xs text-slate-500">Audit log of submitted purchase orders and expenditure approval requests.</p>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
                Enterprise Audit Trail
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Requests</span>
                <span className="text-xl font-extrabold text-slate-900">{INITIAL_APPROVAL_REQUESTS.length}</span>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Pending Review</span>
                <span className="text-xl font-extrabold text-amber-700">
                  {INITIAL_APPROVAL_REQUESTS.filter(r => r.status === 'pending').length}
                </span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Approved Sum</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  {formatINRCompact(INITIAL_APPROVAL_REQUESTS.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0))}
                </span>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">Rejected Requests</span>
                <span className="text-xl font-extrabold text-rose-700">
                  {INITIAL_APPROVAL_REQUESTS.filter(r => r.status === 'rejected').length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Subject / Title</th>
                    <th className="py-2.5 px-3">Requester</th>
                    <th className="py-2.5 px-3">Requested At</th>
                    <th className="py-2.5 px-3">Reviewer</th>
                    <th className="py-2.5 px-3 text-right">Value</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INITIAL_APPROVAL_REQUESTS.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{req.title}</td>
                      <td className="py-3 px-3 text-slate-600">{req.requesterName}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(req.requested_at)}</td>
                      <td className="py-3 px-3 text-slate-600">{req.reviewerName || 'Awaiting Review'}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {req.amount !== undefined ? formatINR(req.amount) : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: PROJECT PROGRESS REPORT (ENTERPRISE) */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Project Progress & Timeline Overview</h3>
                <p className="text-xs text-slate-500">Real-time completion percentage, deadline schedules, and budget consumption.</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                {filteredProjects.length} Projects Analyzed
              </span>
            </div>

            <div className="space-y-3">
              {filteredProjects.map(proj => {
                const isOverBudget = Number(proj.spent) > Number(proj.budget);
                return (
                  <div key={proj.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">{proj.name}</span>
                        <span className="text-xs text-slate-400 ml-2">({proj.client} • {proj.city})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                          proj.status === 'On Track' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          proj.status === 'Budget Alert' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {proj.status}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Handover: {formatDate(proj.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 font-semibold">
                        <span>Physical Site Completion</span>
                        <span className="font-extrabold text-brand-600">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(2, proj.progress))}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Budget</span>
                        <span className="font-bold text-slate-800">{formatINR(proj.budget)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Incurred Cost</span>
                        <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                          {formatINR(proj.spent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Contract Scope</span>
                        <span className="font-bold text-slate-800">{formatINR(proj.contract_value ?? proj.budget)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Branch Studio</span>
                        <span className="font-bold text-slate-700">{proj.branchName || 'Head Office'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
