import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectType, ProjectStatus } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  FolderKanban,
  ArrowUpDown,
  Building,
  User,
  LayoutGrid,
  List
} from 'lucide-react';
import { formatINR, calculateDaysRemaining } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { milestoneService } from '../services/milestoneService';

export const ProjectsPage: React.FC = () => {
  const { 
    projects, 
    milestones,
    openProjectDetail, 
    setIsNewProjectModalOpen,
    globalSearch,
    setGlobalSearch 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Residential' | 'Commercial' | 'Completed'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'budget-desc' | 'spent-desc' | 'progress-desc'>('deadline');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter & sort
  const filtered = projects.filter(p => {
    // Global search or local search
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      const matches = p.name.toLowerCase().includes(q) || 
                      p.client.toLowerCase().includes(q) || 
                      p.location.toLowerCase().includes(q) ||
                      p.city.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (activeTab === 'Residential' && p.type !== 'Residential') return false;
    if (activeTab === 'Commercial' && p.type !== 'Commercial') return false;
    if (activeTab === 'Completed' && p.status !== 'Completed') return false;

    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (cityFilter !== 'All' && p.city !== cityFilter) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'budget-desc') return b.budget - a.budget;
    if (sortBy === 'spent-desc') return b.spent - a.spent;
    if (sortBy === 'progress-desc') return b.progress - a.progress;
    // Default deadline soonest
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const cities = Array.from(new Set(projects.map(p => p.city))).filter(Boolean);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your active site portfolios, client timelines, and room-level cost structures.
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Project</span>
        </button>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(['All', 'Residential', 'Commercial', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'All' ? `All Projects (${projects.length})` : tab}
            </button>
          ))}
        </div>

        {/* Dropdown Filters & View Mode */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Budget Alert">Budget Alert</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* City filter */}
          {cities.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-400">City:</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="deadline">Due Soonest</option>
              <option value="budget-desc">Highest Budget</option>
              <option value="spent-desc">Highest Spent</option>
              <option value="progress-desc">Most Progress</option>
            </select>
          </div>

          {/* Grid / List toggle */}
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
        </div>
      </div>

      {/* Projects Grid / Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={globalSearch || statusFilter !== 'All' ? 'No matching projects found' : 'No projects created yet'}
          description={
            globalSearch || statusFilter !== 'All'
              ? 'Try adjusting your filters or search keywords to find the project you are looking for.'
              : 'Create your first interior project to begin tracking rooms, BOQ estimates, expenses, and site updates.'
          }
          actionLabel={globalSearch || statusFilter !== 'All' ? undefined : '+ Create First Project'}
          onAction={globalSearch || statusFilter !== 'All' ? undefined : () => setIsNewProjectModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => {
            const daysInfo = calculateDaysRemaining(project.deadline);
            const remaining = project.budget - project.spent;
            const projectMilestones = milestones.filter(m => m.project_id === project.id);
            const derivedProg = milestoneService.calculateProjectMilestoneProgress(projectMilestones);
            const displayProgress = derivedProg !== null ? derivedProg : project.progress;

            return (
              <div
                key={project.id}
                onClick={() => openProjectDetail(project.id)}
                className="premium-card overflow-hidden cursor-pointer group flex flex-col justify-between hover:-translate-y-1 transition-all duration-200"
              >
                {/* Image Cover Banner */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={project.coverImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                  
                  {/* Top Tags */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
                      {project.type}
                    </span>
                    <Badge status={project.status} size="sm" />
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-extrabold text-white truncate font-display drop-shadow-sm">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 truncate mt-0.5">
                      <User className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                      <span className="truncate">{project.client}</span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Location & city */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>

                  {/* Financials pill grid */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Budget</div>
                      <div className="font-extrabold text-slate-900 truncate">{formatINR(project.budget)}</div>
                    </div>
                    <div className="border-x border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Spent</div>
                      <div className="font-extrabold text-brand-600 truncate">{formatINR(project.spent)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Remaining</div>
                      <div className={`font-extrabold truncate ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatINR(remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                      <span className="text-slate-600">Site Progress</span>
                      <span className="text-slate-900 font-bold">{displayProgress}%</span>
                    </div>
                    <ProgressBar value={displayProgress} height="sm" />
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className={`font-bold ${daysInfo.isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
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
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Spent</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((project) => {
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
                      <td className="py-3.5 px-4 text-slate-500">{project.location}</td>
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
  );
};
