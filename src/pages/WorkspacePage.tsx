import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Briefcase, 
  Sparkles, 
  Users, 
  Palette, 
  Ruler, 
  Calculator, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { formatINRCompact } from '../utils/formatters';

export const WorkspacePage: React.FC = () => {
  const { stats, setCurrentPage, setIsNewProjectModalOpen, setIsAddExpenseModalOpen } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Design Studio Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your design studio operations, active sites, and team bandwidth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Studio Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apni Estate Interiors Studio Edition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
            Spend less time managing spreadsheets. Spend more time designing.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your studio is actively managing <strong className="text-white">{stats.activeProjectsCount} projects</strong> with a total turnover value of <strong className="text-white">{formatINRCompact(stats.totalProjectValue)}</strong>.
          </p>
        </div>
      </div>

      {/* Designer Quick Utilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => setCurrentPage('projects')}
          className="premium-card p-6 cursor-pointer group hover:border-brand-300"
        >
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit mb-4 group-hover:scale-110 transition-transform">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">Project Portfolio</h3>
          <p className="text-xs text-slate-500 mb-4">View and organize all active residential and commercial sites.</p>
          <div className="flex items-center gap-1 text-xs font-bold text-brand-600">
            <span>Browse {stats.activeProjectsCount} Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setCurrentPage('expenses')}
          className="premium-card p-6 cursor-pointer group hover:border-brand-300"
        >
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit mb-4 group-hover:scale-110 transition-transform">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">Expense Tracker</h3>
          <p className="text-xs text-slate-500 mb-4">Log purchases for marble, ply, lighting, and contractor payouts.</p>
          <div className="flex items-center gap-1 text-xs font-bold text-brand-600">
            <span>Manage Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => setCurrentPage('budget')}
          className="premium-card p-6 cursor-pointer group hover:border-brand-300"
        >
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">Budget Health Alerts</h3>
          <p className="text-xs text-slate-500 mb-4">Prevent cost overruns and maintain healthy studio profit margins.</p>
          <div className="flex items-center gap-1 text-xs font-bold text-brand-600">
            <span>View Budget Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
