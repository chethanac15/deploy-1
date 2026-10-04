// ==============================================================================
// APNI ESTATE INTERIORS - MAIN APPLICATION ROUTER & MODAL MOUNT
// ==============================================================================

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthScreen } from './components/auth/AuthScreen';
import { TrialExpiredScreen } from './components/auth/TrialExpiredScreen';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ClientsPage } from './pages/ClientsPage';
import { LeadsPage } from './pages/LeadsPage';
import { TasksPage } from './pages/TasksPage';
import { TeamPage } from './pages/TeamPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetPage } from './pages/BudgetPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { VendorsPage } from './pages/VendorsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { ReportsPage } from './pages/ReportsPage';
import { CalendarPage } from './pages/CalendarPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { SettingsPage } from './pages/SettingsPage';
import { BranchesPage } from './pages/BranchesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { EnterpriseManagementPage } from './pages/EnterpriseManagementPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { DataExportPage } from './pages/DataExportPage';
import { QuotationsPage, SharedQuotationPage } from './pages/QuotationsPage';
import { ChangeRequestsPage, SharedChangeRequestPage } from './pages/ChangeRequestsPage';
import { ClientPortalPage, SharedClientPortalPage } from './pages/ClientPortalPage';
import { SiteControlsPage } from './pages/SiteControlsPage';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { PricingModal } from './components/modals/PricingModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { BOQModal } from './components/modals/BOQModal';
import { Building2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    currentPage, 
    isBOQModalOpen, 
    setIsBOQModalOpen, 
    boqModalProjectId, 
    boqModalDefaultRoomId, 
    boqItemToEdit 
  } = useApp();
  const { loading, isAuthenticated, isDemoMode, isTrialExpired } = useAuth();
  const sharedQuotationToken = new URLSearchParams(window.location.search).get('quote');
  const sharedChangeRequestToken = new URLSearchParams(window.location.search).get('change');
  const sharedPortalToken = new URLSearchParams(window.location.search).get('portal');

  if (sharedQuotationToken) {
    return <SharedQuotationPage token={sharedQuotationToken} />;
  }
  if (sharedChangeRequestToken) {
    return <SharedChangeRequestPage token={sharedChangeRequestToken} />;
  }
  if (sharedPortalToken) {
    return <SharedClientPortalPage token={sharedPortalToken} />;
  }

  // 1. Initial Auth Loading State (Prevents UI Flashing)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 mb-4 animate-pulse">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-white mb-1">Apni Estate Interiors</h2>
        <p className="text-xs text-slate-400">Loading your studio workspace...</p>
      </div>
    );
  }

  // 2. Unauthenticated User (and not in demo mode)
  if (!isAuthenticated && !isDemoMode) {
    return <AuthScreen />;
  }

  // 3. Authenticated User with Expired Trial
  if (isAuthenticated && isTrialExpired) {
    return <TrialExpiredScreen />;
  }

  // 4. Authenticated with Active/Valid Trial OR in Local Demo Sandbox
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'clients':
        return <ClientsPage />;
      case 'leads':
        return <LeadsPage />;
      case 'quotations':
        return <QuotationsPage />;
      case 'change-requests':
        return <ChangeRequestsPage />;
      case 'site-controls':
        return <SiteControlsPage />;
      case 'client-portal':
        return <ClientPortalPage />;
      case 'tasks':
        return <TasksPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'vendors':
        return <VendorsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'team':
        return <TeamPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'budget':
        return <BudgetPage />;
      case 'management':
        return <EnterpriseManagementPage />;
      case 'branches':
        return <BranchesPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'roles':
        return <RolesPermissionsPage />;
      case 'export':
        return <DataExportPage />;
      case 'settings':
        return <SettingsPage />;
      case 'project-detail':
        return <ProjectDetailPage />;
      case 'calendar':
        return isDemoMode ? <CalendarPage /> : <OverviewPage />;
      case 'workspace':
        return isDemoMode ? <WorkspacePage /> : <OverviewPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <AppLayout>
      {renderCurrentPage()}

      {/* Global Application Modals */}
      <NewProjectModal />
      <AddExpenseModal />
      <BOQModal
        isOpen={isBOQModalOpen}
        onClose={() => setIsBOQModalOpen(false)}
        projectId={boqModalProjectId}
        defaultRoomId={boqModalDefaultRoomId}
        itemToEdit={boqItemToEdit}
      />
      <PricingModal />
      <NotificationsDrawer />
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
