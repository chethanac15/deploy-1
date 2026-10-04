// ==============================================================================
// APNI ESTATE INTERIORS - SIDEBAR NAVIGATION (GROUPED COMMERCIAL WORKSPACE)
// ==============================================================================

import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  UserPlus,
  CheckSquare,
  FileText,
  Receipt, 
  PieChart, 
  Settings, 
  Plus, 
  Crown,
  Sparkles,
  LogOut,
  ChevronRight,
  X,
  UserCheck,
  Building2,
  ShoppingBag,
  IndianRupee,
  BarChart3,
  TrendingUp,
  Building,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  FileCheck2,
  ClipboardList
} from 'lucide-react';
import { useApp, NavigationPage } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getPlanDetails, canUseFeature } from '../../lib/entitlements';

interface NavGroup {
  groupLabel: string;
  items: {
    id: NavigationPage;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[];
}

export const Sidebar: React.FC = () => {
  const { 
    currentPage, 
    setCurrentPage, 
    setIsNewProjectModalOpen,
    setIsPricingModalOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    stats,
    clients,
    leads,
    tasks,
    documents,
    teamMembers,
    vendors,
    clientPayments,
    purchases
  } = useApp();

  const { user, profile, organization, daysRemaining, trialStatus, isDemoMode, setIsDemoMode, signOut } = useAuth();

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const activeLeadsCount = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;
  const pendingPaymentsCount = clientPayments.filter(p => p.status === 'Pending' || p.status === 'Overdue' || p.status === 'Partially Paid').length;
  const activeOrdersCount = purchases.filter(p => p.status === 'Ordered' || p.status === 'Partially Received').length;

  const hasEnterpriseAccess = isDemoMode || canUseFeature(organization, 'multi_branch', { isDemoMode });
  const hasExportAccess = isDemoMode || canUseFeature(organization, 'data_export', { isDemoMode });

  const navGroups: NavGroup[] = [
    {
      groupLabel: 'Overview',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    ...(hasEnterpriseAccess ? [{
      groupLabel: 'Management',
      items: [
        { id: 'management' as NavigationPage, label: 'Management', icon: TrendingUp },
        { id: 'branches' as NavigationPage, label: 'Branches', icon: Building },
        { id: 'approvals' as NavigationPage, label: 'Approvals', icon: ShieldCheck },
        { id: 'roles' as NavigationPage, label: 'Roles & Access', icon: Shield }
      ]
    }] : []),
    {
      groupLabel: 'Sales & CRM',
      items: [
        { id: 'clients', label: 'Clients', icon: Users, badge: clients.length },
        { id: 'leads', label: 'Leads', icon: UserPlus, badge: activeLeadsCount > 0 ? activeLeadsCount : undefined },
        { id: 'quotations', label: 'Quotations', icon: FileCheck2 }
      ]
    },
    {
      groupLabel: 'Projects & Site',
      items: [
        { id: 'projects', label: 'Projects', icon: FolderKanban, badge: stats.activeProjectsCount },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
        { id: 'documents', label: 'Documents', icon: FileText, badge: documents.length > 0 ? documents.length : undefined },
        { id: 'change-requests', label: 'Change Requests', icon: ClipboardList },
        { id: 'site-controls', label: 'Contractor Bills & Wastage', icon: Receipt },
        { id: 'client-portal', label: 'Client Portal', icon: Users }
      ]
    },
    {
      groupLabel: 'Finance & Ledger',
      items: [
        { id: 'expenses', label: 'Expenses', icon: Receipt },
        { id: 'payments', label: 'Client Payments', icon: IndianRupee, badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined },
        { id: 'budget', label: 'Budget', icon: PieChart }
      ]
    },
    {
      groupLabel: 'Operations',
      items: [
        { id: 'vendors', label: 'Vendors', icon: Building2, badge: vendors.length > 0 ? vendors.length : undefined },
        { id: 'purchases', label: 'Purchases', icon: ShoppingBag, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined }
      ]
    },
    {
      groupLabel: 'Reporting & Data',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        ...(hasExportAccess ? [{ id: 'export' as NavigationPage, label: 'Data Export', icon: FileSpreadsheet }] : [])
      ]
    },
    {
      groupLabel: 'Admin & Settings',
      items: [
        { id: 'team', label: 'Team', icon: UserCheck, badge: teamMembers.length },
        { id: 'settings', label: 'Company Settings', icon: Settings }
      ]
    }
  ];

  const roleDisplay = () => {
    if (!profile) return 'Studio Owner';
    switch (profile.role) {
      case 'owner': return 'Studio Owner';
      case 'designer': return 'Lead Designer';
      case 'supervisor': return 'Site Supervisor';
      default: return 'Studio Owner';
    }
  };

  const displayName = profile?.full_name || (isDemoMode ? 'Aarav Mehta' : 'Studio Owner');
  const studioName = organization?.name || (isDemoMode ? 'Apni Estate Interiors' : 'My Studio');
  const planInfo = getPlanDetails(organization?.plan);
  const planDisplayName = planInfo?.name ? planInfo.name.toUpperCase() : 'STUDIO';

  const handleNavClick = (pageId: NavigationPage) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
  };

  const handleNewProjectClick = () => {
    setIsNewProjectModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 pb-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1E293B] border border-slate-700/60 flex items-center justify-center text-white shadow-md shrink-0 p-1">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 200 200" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M 20 15 L 180 15 L 180 135 L 135 75 L 95 125 L 95 90 L 60 90 L 60 145 L 20 200 Z" 
                fill="#FFFFFF" 
              />
              <rect x="123" y="115" width="10" height="10" rx="0.5" fill="#FFFFFF" />
              <rect x="137" y="115" width="10" height="10" rx="0.5" fill="#FFFFFF" />
              <rect x="123" y="129" width="10" height="10" rx="0.5" fill="#FFFFFF" />
              <rect x="137" y="129" width="10" height="10" rx="0.5" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base text-white tracking-tight truncate">
                {isDemoMode ? 'Apni Estate' : studioName}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-extrabold tracking-widest text-brand-400 uppercase bg-brand-950/90 px-1.5 py-0.5 rounded border border-brand-800/50">
                INTERIORS
              </span>
              {isDemoMode && !user && (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/50">
                  DEMO
                </span>
              )}
            </div>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* New Project Primary CTA */}
      <div className="px-4 pt-3.5 pb-2">
        <button
          onClick={handleNewProjectClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-900/40 hover:shadow-lg transition-all duration-200 group active:scale-[0.98] cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>+ New Project</span>
        </button>
      </div>

      {/* Grouped Navigation Links */}
      <div className="flex-1 px-3 py-1 space-y-3 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-0.5">
            <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {group.groupLabel}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || (item.id === 'projects' && currentPage === 'project-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
                    isActive
                      ? 'bg-brand-600/20 text-white border border-brand-500/30 shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Demo Workspace Banner or Subscription Card */}
        {isDemoMode && !user ? (
          <div className="pt-2 px-1">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-700/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Workspace</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                Exploring sample studio data. Register your company to start your 15-day trial.
              </p>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsDemoMode(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all text-center shadow-xs flex items-center justify-center gap-1 cursor-pointer min-h-[36px]"
              >
                <span>Exit Demo & Sign Up</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 px-1">
            <div 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPricingModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 hover:border-brand-500/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{planDisplayName} Plan</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  trialStatus === 'active'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50'
                    : 'bg-indigo-900 text-indigo-300 border-indigo-700/50'
                }`}>
                  {trialStatus === 'active' ? 'Active' : `${daysRemaining}d Trial`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                {trialStatus === 'active' ? 'Active studio subscription' : `15-day trial • ${daysRemaining} days left`}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-brand-400 group-hover:text-brand-300">
                <Sparkles className="w-3 h-3" />
                <span>Plans & Invoicing →</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                alt={displayName}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-brand-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{displayName}</div>
              <div className="text-[10px] text-slate-400 truncate">{roleDisplay()}</div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              signOut();
            }}
            title={user ? "Sign Out" : "Exit Demo"}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0F172A] text-slate-300 flex-col h-full border-r border-slate-800/80 select-none z-30 shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile & Tablet Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-[#0F172A] text-slate-300 shadow-2xl border-r border-slate-800 z-50 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
