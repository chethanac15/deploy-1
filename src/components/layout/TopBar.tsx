import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Sparkles, 
  LogOut, 
  User, 
  Settings, 
  CreditCard,
  ChevronDown,
  Building2,
  FolderKanban,
  CheckCircle2,
  ExternalLink,
  Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const TopBar: React.FC = () => {
  const { 
    currentPage,
    globalSearch, 
    setGlobalSearch, 
    setIsAddExpenseModalOpen,
    setIsPricingModalOpen,
    notifications,
    setIsNotificationsOpen,
    setIsMobileMenuOpen,
    setCurrentPage,
    projects,
    selectedProjectId
  } = useApp();

  const { 
    user, 
    profile, 
    organization, 
    signOut, 
    daysRemaining, 
    trialStatus, 
    isDemoMode,
    setIsDemoMode
  } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const displayName = profile?.full_name || (isDemoMode ? 'Aarav Mehta' : 'Studio Owner');
  const userEmail = user?.email || (isDemoMode ? 'aarav@mehtadesign.in' : '');
  const studioName = organization?.name || (isDemoMode ? 'Apni Estate Interiors' : 'My Studio');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Page title calculation
  const getPageTitle = () => {
    switch (currentPage) {
      case 'overview': return 'Studio Overview';
      case 'projects': return 'Projects';
      case 'clients': return 'Client Directory';
      case 'expenses': return 'Expense Ledger';
      case 'budget': return 'Budget Analytics';
      case 'settings': return 'Studio Settings';
      case 'project-detail': return selectedProject ? selectedProject.name : 'Project Workspace';
      default: return 'Overview';
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile & Tablet Hamburger + Contextual Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-xs sm:text-base font-extrabold font-display text-slate-900 truncate">
          {getPageTitle()}
        </h1>
        {currentPage === 'project-detail' && selectedProject && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 truncate max-w-[150px]">
            <span>{selectedProject.client}</span>
          </span>
        )}
      </div>

      {/* Center: Search Input */}
      <div className="hidden lg:flex items-center gap-4 flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, clients, expenses..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Date Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600">
          <span>{todayStr}</span>
        </div>

        {/* Quick Add Expense Action */}
        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden xs:inline">+ Expense</span>
          <span className="xs:hidden">+ Exp</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Demo Mode Badge / Trial Pill */}
        {isDemoMode && !user ? (
          <button
            onClick={() => setIsDemoMode(false)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Demo Workspace</span>
          </button>
        ) : (
          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 text-brand-900 border border-brand-200 text-xs font-bold hover:border-brand-300 transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>
              {trialStatus === 'active' ? 'Active Plan' : `Trial • ${daysRemaining}d left`}
            </span>
          </button>
        )}

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <img
              src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
              alt={displayName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-slate-300"
            />
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-xs text-slate-900 truncate">{displayName}</div>
                {userEmail && <div className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</div>}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200 truncate">
                    {studioName}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentPage('settings');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Studio Settings</span>
                </button>

                <button
                  onClick={() => {
                    setIsPricingModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Plans & Invoicing</span>
                </button>

                {isDemoMode && !user && (
                  <button
                    onClick={() => {
                      setIsDemoMode(false);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-600" />
                    <span>Exit Demo & Sign Up</span>
                  </button>
                )}
              </div>

              {user && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
