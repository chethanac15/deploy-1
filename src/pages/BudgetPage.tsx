// ==============================================================================
// APNI ESTATE INTERIORS - BUDGET CONTROL & HEALTH PAGE (REAL FINANCIAL ENGINE)
// ==============================================================================

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PieChart as PieChartIcon, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2,
  ArrowRight,
  Filter,
  Layers
} from 'lucide-react';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { ProgressBar } from '../components/common/ProgressBar';
import { 
  calculateProjectSpent, 
  calculateProjectBOQ, 
  calculateBudgetMetrics,
  BudgetHealthStatus 
} from '../lib/financialMetrics';

export const BudgetPage: React.FC = () => {
  const { projects, expenses, boqItems, stats, openProjectDetail } = useApp();
  const [filterHealth, setFilterHealth] = useState<'All' | BudgetHealthStatus>('All');

  const projectsWithFinancials = projects.map(p => {
    const spent = calculateProjectSpent(p.id, expenses);
    const boqEstimate = calculateProjectBOQ(p.id, boqItems);
    const metrics = calculateBudgetMetrics(p.budget, spent);
    return {
      ...p,
      spent,
      boqEstimate,
      metrics
    };
  });

  const filtered = projectsWithFinancials.filter(p => {
    if (filterHealth === 'All') return true;
    return p.metrics.health.status === filterHealth;
  });

  const healthyCount = projectsWithFinancials.filter(p => p.metrics.health.status === 'Healthy').length;
  const watchCount = projectsWithFinancials.filter(p => p.metrics.health.status === 'Watch').length;
  const riskCount = projectsWithFinancials.filter(p => p.metrics.health.status === 'Risk').length;
  const overBudgetCount = projectsWithFinancials.filter(p => p.metrics.health.status === 'Over Budget').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Budget Control & Health
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial variance engine tracking approved budget, BOQ estimates, and actual disbursements.
          </p>
        </div>
      </div>

      {/* Portfolio Summary 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Portfolio Budget</span>
          <div className="text-2xl font-extrabold font-display text-slate-900 mt-2">
            {formatINRCompact(stats.totalBudget)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all active contracts</p>
        </div>

        <div className="premium-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total BOQ Estimated</span>
          <div className="text-2xl font-extrabold font-display text-indigo-600 mt-2">
            {formatINRCompact(stats.totalBOQEstimate)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Detailed scope rate estimates</p>
        </div>

        <div className="premium-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Actual Spent</span>
          <div className="text-2xl font-extrabold font-display text-brand-600 mt-2">
            {formatINRCompact(stats.totalSpent)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{stats.spentPercentage.toFixed(1)}% portfolio utilization</p>
        </div>

        <div className="premium-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining Cushion</span>
          <div className={`text-2xl font-extrabold font-display mt-2 ${stats.totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatINRCompact(stats.totalRemaining)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.totalRemaining < 0 ? 'Portfolio overrun detected' : 'Available uncommitted funds'}
          </p>
        </div>
      </div>

      {/* Rules Indicator Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">0–70% Used:</span>
            <span className="text-slate-500 ml-1">Healthy</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">71–85% Used:</span>
            <span className="text-slate-500 ml-1">Watch</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">86–100% Used:</span>
            <span className="text-slate-500 ml-1">Risk</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-700 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">&gt;100% Used:</span>
            <span className="text-slate-500 ml-1">Over Budget</span>
          </div>
        </div>
      </div>

      {/* Health Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['All', 'Healthy', 'Watch', 'Risk', 'Over Budget'] as const).map((h) => (
          <button
            key={h}
            onClick={() => setFilterHealth(h)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterHealth === h
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {h}
            {h === 'Healthy' && ` (${healthyCount})`}
            {h === 'Watch' && ` (${watchCount})`}
            {h === 'Risk' && ` (${riskCount})`}
            {h === 'Over Budget' && ` (${overBudgetCount})`}
          </button>
        ))}
      </div>

      {/* Project Budget Health Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="premium-card p-12 text-center">
            <p className="text-sm font-semibold text-slate-600">No projects match the selected health filter.</p>
          </div>
        ) : (
          filtered.map((project) => {
            const metrics = project.metrics;
            const percent = metrics.utilization !== null ? Math.round(metrics.utilization) : 0;

            return (
              <div
                key={project.id}
                onClick={() => openProjectDetail(project.id, 'Budget')}
                className="premium-card p-5 cursor-pointer hover:border-brand-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={project.coverImage}
                      alt={project.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base font-display text-slate-900">{project.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {project.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{project.location} • Client: {project.client}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${metrics.health.badgeBg} ${metrics.health.textColor}`}>
                      {metrics.health.label} {metrics.utilization !== null ? `(${percent}%)` : ''}
                    </span>
                    <button className="hidden sm:flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
                      <span>View Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Budget</div>
                    <div className="text-sm font-extrabold text-slate-900">{formatINR(project.budget)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">BOQ Estimate</div>
                    <div className="text-sm font-extrabold text-indigo-600">{formatINR(project.boqEstimate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Actual Spent</div>
                    <div className="text-sm font-extrabold text-brand-600">{formatINR(project.spent)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Remaining Cushion</div>
                    <div className={`text-sm font-black ${metrics.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatINR(metrics.remaining)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <ProgressBar 
                    value={Math.min(100, percent)} 
                    height="md" 
                    color={metrics.health.color} 
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
