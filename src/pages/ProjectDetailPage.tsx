// ==============================================================================
// APNI ESTATE INTERIORS - PROJECT DETAIL PAGE (OPERATIONAL SITE MVP & FINANCIALS)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Room, BOQItem, Expense, Material, Milestone, DailyUpdate, ProjectPhoto } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  MapPin, 
  Phone, 
  IndianRupee, 
  Layers, 
  Clock, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink,
  Edit3,
  Share2,
  Camera,
  MessageSquare,
  Sparkles,
  LayoutGrid,
  Edit2,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  Package,
  Flag,
  ArrowDownLeft,
  ArrowUpRight,
  UploadCloud,
  Users,
  UserRound,
  ArrowRight,
  X,
  AlertTriangle,
  History,
  Eye,
  ZoomIn,
  Download,
  CheckSquare,
  CreditCard,
  ShoppingBag,
  Receipt,
  DollarSign
} from 'lucide-react';
import { formatINR, formatINRCompact, calculateDaysRemaining, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { AddPhotoModal } from '../components/modals/AddPhotoModal';
import { AddNoteModal } from '../components/modals/AddNoteModal';
import { RoomModal } from '../components/modals/RoomModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { MaterialModal } from '../components/modals/MaterialModal';
import { MaterialTransactionModal } from '../components/modals/MaterialTransactionModal';
import { MilestoneModal } from '../components/modals/MilestoneModal';
import { DailyUpdateModal } from '../components/modals/DailyUpdateModal';
import { UploadPhotoModal } from '../components/modals/UploadPhotoModal';
import { TaskModal } from '../components/modals/TaskModal';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';
import { ClientPaymentModal } from '../components/modals/ClientPaymentModal';
import { PurchaseModal } from '../components/modals/PurchaseModal';
import { 
  calculateProjectSpent, 
  calculateRoomSpent, 
  calculateProjectBOQ, 
  calculateRoomBOQ, 
  calculateBudgetMetrics,
  calculateCategoryBreakdown,
  getBudgetHealth
} from '../lib/financialMetrics';
import { calculateProjectProfitability } from '../lib/profitabilityMetrics';
import { materialService } from '../services/materialService';
import { milestoneService } from '../services/milestoneService';
import { documentService } from '../services/documentService';
import { quotationService } from '../services/quotationService';
import { Task, DocumentItem, DocumentCategory, TaskStatus, TaskPriority, ClientPayment, Purchase, Vendor } from '../types';

export const ProjectDetailPage: React.FC = () => {
  const { 
    projects, 
    selectedProjectId, 
    setCurrentPage, 
    initialProjectDetailTab,
    expenses, 
    boqItems,
    materials,
    materialTransactions,
    milestones,
    dailyUpdates,
    projectPhotos,
    tasks,
    documents,
    teamMembers,
    clientPayments,
    purchases,
    vendors,
    clients,
    updateTask,
    deleteTask,
    deleteDocument,
    deleteClientPayment,
    deletePurchase,
    setIsAddExpenseModalOpen, 
    setIsBOQModalOpen,
    approveProjectBOQ,
    deleteExpense,
    deleteBOQItem,
    updateProject,
    deleteProject,
    deleteRoom,
    isMaterialModalOpen,
    setIsMaterialModalOpen,
    materialToEdit,
    isMaterialTransactionModalOpen,
    setIsMaterialTransactionModalOpen,
    selectedMaterialForTransaction,
    materialTransactionType,
    isMilestoneModalOpen,
    setIsMilestoneModalOpen,
    milestoneToEdit,
    isDailyUpdateModalOpen,
    setIsDailyUpdateModalOpen,
    dailyUpdateToEdit,
    isUploadPhotoModalOpen,
    setIsUploadPhotoModalOpen,
    defaultPhotoDailyUpdateId,
    deleteMaterial,
    deleteMilestone,
    updateMilestone,
    deleteDailyUpdate,
    deleteProjectPhoto
  } = useApp();

  const { isDemoMode, profile, organization } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Rooms' | 'BOQ' | 'Expenses' | 'Budget' | 'Materials' | 'Milestones' | 'Daily Updates' | 'Photos' | 'Notes' | 'Tasks' | 'Documents' | 'Payments' | 'Purchases'
  >('Overview');
  
  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<string>('All');

  // Tasks & Documents Project Modals
  const [isProjectTaskModalOpen, setIsProjectTaskModalOpen] = useState(false);
  const [projectTaskToEdit, setProjectTaskToEdit] = useState<Task | null>(null);
  const [isProjectUploadDocModalOpen, setIsProjectUploadDocModalOpen] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Client Payments & Purchases Project Modals
  const [isProjectPaymentModalOpen, setIsProjectPaymentModalOpen] = useState(false);
  const [projectPaymentToEdit, setProjectPaymentToEdit] = useState<ClientPayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<ClientPayment | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  const [isProjectPurchaseModalOpen, setIsProjectPurchaseModalOpen] = useState(false);
  const [projectPurchaseToEdit, setProjectPurchaseToEdit] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);
  
  // Room modal state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  // BOQ Item deletion confirmation
  const [boqToDelete, setBOQToDelete] = useState<BOQItem | null>(null);
  const [isDeletingBOQ, setIsDeletingBOQ] = useState(false);

  // Expense deletion confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Material Deletion confirmation & History Drawer
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [materialDeleteError, setMaterialDeleteError] = useState<string | null>(null);
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);

  // Milestone Deletion confirmation
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);

  // Daily Update Deletion confirmation
  const [dailyUpdateToDelete, setDailyUpdateToDelete] = useState<DailyUpdate | null>(null);
  const [isDeletingDailyUpdate, setIsDeletingDailyUpdate] = useState(false);

  // Photo Deletion confirmation & Lightbox
  const [photoToDelete, setPhotoToDelete] = useState<ProjectPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<ProjectPhoto | null>(null);

  // Edit Project modal state
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Filters
  const [boqSearch, setBOQSearch] = useState('');
  const [boqRoomFilter, setBOQRoomFilter] = useState('All');
  const [boqCategoryFilter, setBOQCategoryFilter] = useState('All');

  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('All');
  const [materialRoomFilter, setMaterialRoomFilter] = useState('All');
  const [isApprovingBOQ, setIsApprovingBOQ] = useState(false);
  const [boqApprovalError, setBOQApprovalError] = useState('');
  const [pendingQuotationCount, setPendingQuotationCount] = useState(0);
  const [quotationLoadError, setQuotationLoadError] = useState('');

  useEffect(() => {
    if (initialProjectDetailTab) {
      setActiveTab(initialProjectDetailTab);
    }
  }, [initialProjectDetailTab]);

  const project = projects.find(p => p.id === selectedProjectId) || projects[0];

  useEffect(() => {
    if (!project?.id) {
      setPendingQuotationCount(0);
      setQuotationLoadError('');
      return;
    }
    let active = true;
    setQuotationLoadError('');
    const loadPendingQuotes = async () => {
      try {
        if (isDemoMode) {
          const stored = localStorage.getItem('apni_estate_quotations');
          const quotes = stored ? JSON.parse(stored) : [];
          if (active) setPendingQuotationCount(quotes.filter((quote: { project_id?: string; status?: string }) =>
            quote.project_id === project.id && quote.status === 'sent'
          ).length);
        } else if (organization?.id) {
          const quotes = await quotationService.getQuotations(organization.id);
          if (active) setPendingQuotationCount(quotes.filter(quote =>
            quote.project_id === project.id && quote.status === 'sent'
          ).length);
        } else if (active) {
          setPendingQuotationCount(0);
        }
      } catch (err) {
        if (active) setQuotationLoadError(err instanceof Error ? err.message : 'Client approval status could not be loaded.');
      }
    };
    loadPendingQuotes();
    return () => { active = false; };
  }, [project?.id, isDemoMode, organization?.id]);

  if (!project) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Project not found"
        description="The project you are looking for does not exist or has been removed."
        actionLabel="Back to Projects"
        onAction={() => setCurrentPage('projects')}
      />
    );
  }

  // Authoritative dynamic financial rollups from Expense Ledger & BOQ
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  const projectBOQItems = boqItems.filter(b => b.project_id === project.id);
  const approvedBOQCount = projectBOQItems.filter(item => Boolean(item.approved_at)).length;
  const canApproveBOQ = isDemoMode || profile?.role === 'owner' || profile?.role === 'admin';
  
  const projectSpent = calculateProjectSpent(project.id, expenses);
  const projectBOQ = calculateProjectBOQ(project.id, boqItems);
  const projectMetrics = calculateBudgetMetrics(project.budget, projectSpent);
  
  const daysInfo = calculateDaysRemaining(project.deadline);
  const rooms = project.rooms || [];

  // Phase 6 Operational Data
  const projectMaterials = materials.filter(m => m.project_id === project.id);
  const projectMilestones = milestones.filter(m => m.project_id === project.id);
  const projectDailyUpdates = dailyUpdates.filter(d => d.project_id === project.id);
  const authenticatedPhotos = projectPhotos.filter(p => p.projectId === project.id);
  const allPhotos = isDemoMode ? (project.photos || []) : authenticatedPhotos;

  // Milestone-derived deterministic project progress
  const derivedMilestoneProgress = milestoneService.calculateProjectMilestoneProgress(projectMilestones);
  const displayProgressText = derivedMilestoneProgress !== null ? `${derivedMilestoneProgress}%` : 'No milestones configured';
  const progressNumericValue = derivedMilestoneProgress !== null ? derivedMilestoneProgress : 0;

  // Filtered Materials
  const filteredMaterials = projectMaterials.filter(m => {
    if (materialCategoryFilter !== 'All' && m.category !== materialCategoryFilter) return false;
    if (materialRoomFilter !== 'All') {
      if (materialRoomFilter === 'General' && m.room_id) return false;
      if (materialRoomFilter !== 'General' && m.room_id !== materialRoomFilter) return false;
    }
    if (materialSearch.trim()) {
      const q = materialSearch.toLowerCase();
      const match = m.name.toLowerCase().includes(q) ||
                    (m.category && m.category.toLowerCase().includes(q)) ||
                    (m.notes && m.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Filtered BOQ items
  const filteredBOQItems = projectBOQItems.filter(b => {
    if (boqRoomFilter !== 'All') {
      if (boqRoomFilter === 'General' && b.room_id) return false;
      if (boqRoomFilter !== 'General' && b.room_id !== boqRoomFilter) return false;
    }
    if (boqCategoryFilter !== 'All' && b.category !== boqCategoryFilter) return false;
    if (boqSearch.trim()) {
      const q = boqSearch.toLowerCase();
      const match = b.item_name.toLowerCase().includes(q) ||
                    (b.description && b.description.toLowerCase().includes(q)) ||
                    (b.category && b.category.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Filtered Photos & Notes
  const filteredPhotos = photoFilter === 'All' 
    ? allPhotos 
    : allPhotos.filter(p => p.category === photoFilter);
  const notes = project.notes || [];

  // Project Tasks & Documents
  const projectTasks = tasks.filter(t => (t.project_id || t.projectId) === project.id);
  const projectDocuments = documents.filter(d => (d.project_id || d.projectId) === project.id);
  
  // Project Payments & Purchases
  const projectPayments = clientPayments.filter(p => (p.project_id || p.projectId) === project.id);
  const projectPurchases = purchases.filter(p => (p.project_id || p.projectId) === project.id);

  // Authoritative Project Profitability
  const profitability = calculateProjectProfitability(project, projectExpenses, projectPayments);

  // Category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(projectExpenses, projectBOQItems, project.id);
  const today = new Date().toISOString().slice(0, 10);
  const delayedTasks = projectTasks.filter(task =>
    Boolean(task.due_date || task.dueDate) &&
    (task.due_date || task.dueDate || '') < today &&
    task.status !== 'Completed' && task.status !== 'Cancelled'
  );
  const delayedPurchases = projectPurchases.filter(purchase =>
    Boolean(purchase.expected_delivery) &&
    (purchase.expected_delivery || '') < today &&
    purchase.status !== 'Received' && purchase.status !== 'Delivered' && purchase.status !== 'Cancelled'
  );
  const overduePayments = projectPayments.filter(payment =>
    Boolean(payment.due_date) && payment.due_date < today &&
    Math.max(Number(payment.amount) - Number(payment.paid_amount || 0), 0) > 0
  );
  const overduePaymentAmount = overduePayments.reduce(
    (total, payment) => total + Math.max(Number(payment.amount) - Number(payment.paid_amount || 0), 0), 0
  );
  const costOverrun = Math.max(projectSpent - projectBOQ, 0);
  const costOverrunPercent = projectBOQ > 0 ? costOverrun / projectBOQ * 100 : 0;
  const projectOverdueDays = project.deadline && project.deadline < today
    ? Math.ceil((new Date(`${today}T00:00:00`).getTime() - new Date(`${project.deadline}T00:00:00`).getTime()) / 86400000)
    : 0;
  const healthReasons = [
    ...(costOverrun > 0 ? [`Recorded expenses are ${formatINR(costOverrun)} above the BOQ cost estimate.`] : []),
    ...(projectOverdueDays > 0 && Number(project.progress) < 100 ? [`Project handover is ${projectOverdueDays} day${projectOverdueDays === 1 ? '' : 's'} past its deadline.`] : []),
    ...(project.status === 'Delayed' && projectOverdueDays === 0 ? ['Project is marked delayed and should be reviewed against its current schedule.'] : []),
    ...(delayedTasks.length > 0 ? [`${delayedTasks.length} task${delayedTasks.length === 1 ? '' : 's'} are past due, including ${delayedTasks[0].title}.`] : []),
    ...(delayedPurchases.length > 0 ? [`${delayedPurchases.length} purchase order${delayedPurchases.length === 1 ? '' : 's'} missed the expected delivery date.`] : []),
    ...(overduePaymentAmount > 0 ? [`${formatINR(overduePaymentAmount)} in scheduled client payments is overdue.`] : []),
    ...(pendingQuotationCount > 0 ? [`${pendingQuotationCount} client quotation approval${pendingQuotationCount === 1 ? '' : 's'} are awaiting response.`] : []),
    ...(profitability.contractValue > 0 && profitability.grossMarginPercentage < 15 ? [`Current gross margin is ${profitability.grossMarginPercentage.toFixed(1)}%, below the 15% watch threshold.`] : [])
  ];
  const projectHealth = profitability.grossMarginPercentage < 0 || costOverrunPercent > 10 || projectOverdueDays > 14
    ? 'Red'
    : healthReasons.length > 0 ? 'Amber' : 'Green';
  const taskCompletion = projectTasks.length
    ? Math.round(projectTasks.filter(task => task.status === 'Completed').length / projectTasks.length * 100)
    : null;
  const purchaseCompletion = projectPurchases.length
    ? Math.round(projectPurchases.filter(purchase => purchase.status === 'Received' || purchase.status === 'Delivered').length / projectPurchases.length * 100)
    : null;

  // Handlers
  const handleApproveBOQ = async () => {
    setBOQApprovalError('');
    setIsApprovingBOQ(true);
    try {
      await approveProjectBOQ(project.id);
    } catch (err) {
      setBOQApprovalError(err instanceof Error ? err.message : 'Could not approve the BOQ.');
    } finally {
      setIsApprovingBOQ(false);
    }
  };

  const handleEditRoom = (room: Room) => {
    setRoomToEdit(room);
    setIsRoomModalOpen(true);
  };

  const handleAddRoom = () => {
    setRoomToEdit(null);
    setIsRoomModalOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    try {
      await deleteRoom(roomToDelete.id);
      setRoomToDelete(null);
    } catch (err) {
      console.error('Failed to delete room:', err);
    } finally {
      setIsDeletingRoom(false);
    }
  };

  const confirmDeleteBOQItem = async () => {
    if (!boqToDelete) return;
    setIsDeletingBOQ(true);
    try {
      await deleteBOQItem(boqToDelete.id);
      setBOQToDelete(null);
    } catch (err) {
      console.error('Failed to delete BOQ item:', err);
    } finally {
      setIsDeletingBOQ(false);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    setIsDeletingMaterial(true);
    setMaterialDeleteError(null);
    try {
      await deleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
    } catch (err: any) {
      setMaterialDeleteError(err.message || 'Cannot delete material with existing stock transaction history.');
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  const confirmDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setIsDeletingMilestone(true);
    try {
      await deleteMilestone(milestoneToDelete.id);
      setMilestoneToDelete(null);
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  const confirmDeleteDailyUpdate = async () => {
    if (!dailyUpdateToDelete) return;
    setIsDeletingDailyUpdate(true);
    try {
      await deleteDailyUpdate(dailyUpdateToDelete.id);
      setDailyUpdateToDelete(null);
    } catch (err) {
      console.error('Failed to delete daily update:', err);
    } finally {
      setIsDeletingDailyUpdate(false);
    }
  };

  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return;
    setIsDeletingPhoto(true);
    try {
      await deleteProjectPhoto(photoToDelete.id, photoToDelete.storage_path);
      setPhotoToDelete(null);
      if (lightboxPhoto?.id === photoToDelete.id) {
        setLightboxPhoto(null);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeletingPayment(true);
    try {
      await deleteClientPayment(paymentToDelete.id);
      setPaymentToDelete(null);
    } catch (err) {
      console.error('Failed to delete client payment:', err);
    } finally {
      setIsDeletingPayment(false);
    }
  };

  const confirmDeletePurchase = async () => {
    if (!purchaseToDelete) return;
    setIsDeletingPurchase(true);
    try {
      await deletePurchase(purchaseToDelete.id);
      setPurchaseToDelete(null);
    } catch (err) {
      console.error('Failed to delete purchase order:', err);
    } finally {
      setIsDeletingPurchase(false);
    }
  };

  const confirmDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await deleteProject(project.id);
      setIsDeleteProjectOpen(false);
      setCurrentPage('projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('projects')}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-all"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <Badge status={project.status} />
              <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-100">
                {project.type}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {project.client} {project.clientPhone ? `(${project.clientPhone})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="relative">
            <select
              value={project.status}
              onChange={(e) => updateProject(project.id, { status: e.target.value as any })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="On Track">Status: On Track</option>
              <option value="Needs Attention">Status: Needs Attention</option>
              <option value="Budget Alert">Status: Budget Alert</option>
              <option value="Delayed">Status: Delayed</option>
              <option value="Completed">Status: Completed</option>
            </select>
          </div>

          <button
            onClick={() => setIsEditProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setIsBOQModalOpen(true, project.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-xs transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Add BOQ</span>
          </button>

          <button
            onClick={() => setIsAddExpenseModalOpen(true, project.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>

          <button
            onClick={() => setIsDeleteProjectOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-card flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {(['Overview', 'Rooms', 'BOQ', 'Expenses', 'Budget', 'Materials', 'Milestones', 'Daily Updates', 'Photos', 'Notes', 'Tasks', 'Documents', 'Payments', 'Purchases'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[38px] ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab === 'Rooms' ? 'Rooms & Scope' : tab === 'BOQ' ? 'BOQ & Costing' : tab === 'Materials' ? 'Materials & Stock' : tab === 'Payments' ? 'Client Payments' : tab === 'Purchases' ? 'Procurement / PO' : tab}
            {tab === 'Rooms' && ` (${rooms.length})`}
            {tab === 'BOQ' && ` (${projectBOQItems.length})`}
            {tab === 'Expenses' && ` (${projectExpenses.length})`}
            {tab === 'Materials' && ` (${projectMaterials.length})`}
            {tab === 'Milestones' && ` (${projectMilestones.length})`}
            {tab === 'Daily Updates' && ` (${projectDailyUpdates.length})`}
            {tab === 'Photos' && ` (${allPhotos.length})`}
            {tab === 'Notes' && ` (${notes.length})`}
            {tab === 'Tasks' && ` (${projectTasks.length})`}
            {tab === 'Documents' && ` (${projectDocuments.length})`}
            {tab === 'Payments' && ` (${projectPayments.length})`}
            {tab === 'Purchases' && ` (${projectPurchases.length})`}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Budget</span>
              <div className="text-2xl font-extrabold font-display text-slate-900 mt-2">
                {formatINR(project.budget)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                BOQ Estimate: <span className="font-semibold text-slate-700">{formatINR(projectBOQ)}</span>
              </p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual Spent</span>
              <div className="text-2xl font-extrabold font-display text-brand-600 mt-2">
                {formatINR(projectSpent)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {projectMetrics.utilization !== null ? `${projectMetrics.utilization.toFixed(1)}% of budget utilized` : 'No budget configured'}
              </p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining Cushion</span>
              <div className={`text-2xl font-extrabold font-display mt-2 ${projectMetrics.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatINR(projectMetrics.remaining)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {projectMetrics.isOverBudget ? (
                  <span className="font-bold text-rose-600">Over budget by {formatINR(projectMetrics.overBudgetAmount)}</span>
                ) : (
                  'Available for uncommitted scope'
                )}
              </p>
            </div>

            <div className="premium-card p-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Milestone Progress</span>
                <span className="text-xs font-extrabold text-slate-900">{displayProgressText}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={progressNumericValue} height="md" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Target handover: {formatDate(project.deadline)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 premium-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900 mb-4">Project Details & Handover</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">Start Date</div>
                        <div className="text-xs font-bold text-slate-800">{formatDate(project.startDate)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold">Deadline</div>
                      <div className="text-xs font-bold text-slate-800">{formatDate(project.deadline)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-100/80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-amber-700 font-semibold">Days to Handover</div>
                        <div className="text-sm font-extrabold text-amber-900">{daysInfo.text}</div>
                      </div>
                    </div>
                    <Badge status={daysInfo.isOverdue ? 'Delayed' : 'On Track'} />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scope Summary</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Configured Rooms:</span>
                    <span className="block font-bold text-slate-800 text-sm mt-0.5">{rooms.length} Areas</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium">BOQ Line Items:</span>
                    <span className="block font-bold text-slate-800 text-sm mt-0.5">{projectBOQItems.length} Items</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 premium-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">Room-by-Room Financial Breakdown</h3>
                  <p className="text-xs text-slate-500">Budgets and actual spent calculated from real expense ledger</p>
                </div>
                <button
                  onClick={handleAddRoom}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Room</span>
                </button>
              </div>

              {rooms.length === 0 ? (
                <EmptyState
                  icon={LayoutGrid}
                  title="No rooms created yet"
                  description="Add rooms like Living Room, Kitchen, and Master Bedroom to organize budget and scope."
                  actionLabel="+ Add First Room"
                  onAction={handleAddRoom}
                />
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => {
                    const roomSpent = calculateRoomSpent(room.id, expenses);
                    const roomBOQ = calculateRoomBOQ(room.id, boqItems);
                    const roomMetrics = calculateBudgetMetrics(room.budget, roomSpent);

                    return (
                      <div key={room.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{room.name}</span>
                            {room.room_type && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 font-semibold text-slate-600">
                                {room.room_type}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge status={roomMetrics.health.status} />
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                              title="Edit Room"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Budget</span>
                            <div className="font-extrabold text-slate-800">{formatINR(room.budget)}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Actual Spent</span>
                            <div className="font-extrabold text-brand-600">{formatINR(roomSpent)}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Remaining</span>
                            <div className={`font-extrabold ${roomMetrics.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatINR(roomMetrics.remaining)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <ProgressBar value={roomMetrics.utilization || 0} height="sm" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {roomMetrics.utilization !== null ? `${roomMetrics.utilization.toFixed(0)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Professional Profitability & Cash Position Card */}
          <div className="premium-card p-6 bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">Professional Financial Suite</span>
                <h3 className="text-base sm:text-lg font-black font-display text-white mt-0.5">
                  Project Profitability & Cash Flow Position
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('Payments')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
                >
                  View Payments ({projectPayments.length})
                </button>
                <button
                  onClick={() => setActiveTab('Purchases')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors"
                >
                  View POs ({projectPurchases.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Value</span>
                <span className="text-base sm:text-lg font-black text-white mt-1 block">
                  {formatINR(profitability.contractValue)}
                </span>
                <span className="text-[10px] text-slate-400">Agreed client budget</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Revenue Received</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 mt-1 block">
                  {formatINR(profitability.revenueReceived)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {profitability.contractValue > 0 
                    ? `${((profitability.revenueReceived / profitability.contractValue) * 100).toFixed(0)}% collected`
                    : '0% collected'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Actual Cost</span>
                <span className="text-base sm:text-lg font-black text-amber-400 mt-1 block">
                  {formatINR(profitability.actualCost)}
                </span>
                <span className="text-[10px] text-slate-400">Total ledger expenses</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Gross Profit</span>
                <span className={`text-base sm:text-lg font-black mt-1 block ${profitability.grossProfit >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                  {formatINR(profitability.grossProfit)}
                </span>
                <span className="text-[10px] text-slate-400">Contract − Costs</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Gross Margin</span>
                <span className={`text-base sm:text-lg font-black mt-1 block ${profitability.grossMarginPercentage >= 0 ? 'text-purple-300' : 'text-rose-400'}`}>
                  {profitability.grossMarginPercentage.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400">Margin on contract</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Realized Cash</span>
                <span className={`text-base sm:text-lg font-black mt-1 block ${profitability.realizedCashPosition >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                  {formatINR(profitability.realizedCashPosition)}
                </span>
                <span className="text-[10px] text-slate-400">Received − Spent</span>
              </div>
            </div>
          </div>

          <section className="premium-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project controls</span>
                <h3 className="mt-1 text-base font-extrabold text-slate-900">Project health &amp; actions</h3>
              </div>
              <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                projectHealth === 'Red' ? 'bg-rose-100 text-rose-800' :
                projectHealth === 'Amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <span className={`h-2 w-2 rounded-full ${projectHealth === 'Red' ? 'bg-rose-600' : projectHealth === 'Amber' ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                {projectHealth} health
              </div>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profit at risk</p>
                    <p className={`mt-1 text-base font-black ${costOverrun ? 'text-rose-700' : 'text-slate-900'}`}>{formatINR(costOverrun)}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      {projectBOQ > 0 ? 'Recorded expense overrun against BOQ estimate' : 'Not measurable until project BOQ is entered'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding client dues</p>
                    <p className={`mt-1 text-base font-black ${overduePaymentAmount ? 'text-amber-700' : 'text-slate-900'}`}>{formatINR(overduePaymentAmount)}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{overduePayments.length} overdue scheduled payment{overduePayments.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Task completion</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{taskCompletion === null ? 'No tasks' : `${taskCompletion}%`}</p>
                    <p className="text-[10px] text-slate-500">{delayedTasks.length} overdue</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">BOQ approval</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{approvedBOQCount}/{projectBOQItems.length} lines</p>
                    <p className="text-[10px] text-slate-500">{projectBOQItems.length - approvedBOQCount} awaiting approval</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Purchase received</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{purchaseCompletion === null ? 'No orders' : `${purchaseCompletion}%`}</p>
                    <p className="text-[10px] text-slate-500">{delayedPurchases.length} delayed</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Site updates</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{projectDailyUpdates.length} reports</p>
                    <p className="text-[10px] text-slate-500">{allPhotos.length} site photos</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client approvals</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{pendingQuotationCount} pending</p>
                    <p className="text-[10px] text-slate-500">Quotation responses</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Health reasons</h4>
                  {projectOverdueDays > 0 && Number(project.progress) < 100 && <Badge status="Delayed" />}
                </div>
                {healthReasons.length === 0 ? (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
                    No cost, schedule, purchase, or payment risks are visible in the data recorded for this project.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {healthReasons.map(reason => (
                      <li key={reason} className="flex gap-2 rounded-lg bg-amber-50/70 p-2.5 text-xs leading-relaxed text-slate-700">
                        <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${projectHealth === 'Red' ? 'text-rose-600' : 'text-amber-600'}`} />
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
                {quotationLoadError && <p role="alert" className="mt-2 text-[10px] text-rose-700">Approval status could not be refreshed: {quotationLoadError}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {delayedTasks.length > 0 && <button onClick={() => setCurrentPage('tasks')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Review tasks</button>}
                  {delayedPurchases.length > 0 && <button onClick={() => setActiveTab('Purchases')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Follow up POs</button>}
                  {overduePayments.length > 0 && <button onClick={() => setActiveTab('Payments')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Review payments</button>}
                  {projectBOQItems.length > approvedBOQCount && <button onClick={() => setActiveTab('BOQ')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Approve BOQ</button>}
                  {pendingQuotationCount > 0 && <button onClick={() => setCurrentPage('quotations')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Review quotations</button>}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: ROOMS */}
      {activeTab === 'Rooms' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Rooms & Space Scope</h3>
                <p className="text-xs text-slate-500">Define budgets, design notes, and track progress per space.</p>
              </div>

              <button
                onClick={handleAddRoom}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Room</span>
              </button>
            </div>

            {rooms.length === 0 ? (
              <EmptyState
                icon={LayoutGrid}
                title="No rooms created yet"
                description="Break down the residence into rooms for granular budget and BOQ tracking."
                actionLabel="+ Add First Room"
                onAction={handleAddRoom}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                {rooms.map((room) => {
                  const roomSpent = calculateRoomSpent(room.id, expenses);
                  const roomBOQ = calculateRoomBOQ(room.id, boqItems);
                  const roomMetrics = calculateBudgetMetrics(room.budget, roomSpent);
                  const roomItems = projectBOQItems.filter(b => b.room_id === room.id);

                  return (
                    <div key={room.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-extrabold text-sm text-slate-900">{room.name}</h4>
                          <Badge status={roomMetrics.health.status} />
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Allocated Budget:</span>
                            <span className="font-bold text-slate-800">{formatINR(room.budget)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">BOQ Items Estimate:</span>
                            <span className="font-bold text-slate-700">{formatINR(roomBOQ)} ({roomItems.length} items)</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Actual Ledger Spent:</span>
                            <span className="font-bold text-brand-600">{formatINR(roomSpent)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Remaining Cushion:</span>
                            <span className={`font-extrabold ${roomMetrics.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatINR(roomMetrics.remaining)}
                            </span>
                          </div>
                        </div>

                        {room.notes && (
                          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mb-4 border border-slate-100">
                            <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                            {room.notes}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setIsBOQModalOpen(true, project.id, room.id)}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add BOQ Item</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Edit Room"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRoomToDelete(room)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* TAB 3: BOQ & COSTING */}
      {activeTab === 'BOQ' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Bill of Quantities (BOQ) & Scope Costing</h3>
                <p className="text-xs text-slate-500">Granular rate analysis, item specifications, and estimated vs actual cost comparison.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleApproveBOQ}
                  disabled={!canApproveBOQ || projectBOQItems.length === 0 || isApprovingBOQ}
                  title={!canApproveBOQ ? 'Only an owner or admin can approve a BOQ.' : undefined}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isApprovingBOQ ? 'Approving…' : approvedBOQCount === projectBOQItems.length && projectBOQItems.length ? 'Re-approve BOQ' : 'Approve BOQ'}</span>
                  <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px]">{approvedBOQCount}/{projectBOQItems.length}</span>
                </button>
                <button
                  onClick={() => setIsBOQModalOpen(true, project.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add BOQ Item</span>
                </button>
              </div>
            </div>
            {boqApprovalError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{boqApprovalError}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item, category, description..."
                  value={boqSearch}
                  onChange={(e) => setBOQSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <select
                  value={boqRoomFilter}
                  onChange={(e) => setBOQRoomFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">Filter by Room: All Rooms</option>
                  <option value="General">General / Site Wide</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={boqCategoryFilter}
                  onChange={(e) => setBOQCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">Filter by Category: All</option>
                  {['Civil Work', 'Carpentry', 'Electrical', 'Painting', 'Lighting', 'Plumbing', 'Decor', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredBOQItems.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No BOQ items match your filter"
                description="Add items to build out detailed rate analysis for false ceiling, woodwork, and civil specs."
                actionLabel="+ Add BOQ Item"
                onAction={() => setIsBOQModalOpen(true, project.id)}
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Item & Category</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3 text-right">Quantity & Unit</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Estimated Cost</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBOQItems.map((item) => {
                        const assignedRoom = rooms.find(r => r.id === item.room_id);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{item.item_name}</div>
                              {item.category && (
                                <span className="text-[10px] text-slate-400 font-semibold">{item.category}</span>
                              )}
                              {item.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 font-medium">
                                {assignedRoom ? assignedRoom.name : 'General'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">
                              {item.quantity} {item.unit || 'units'}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600 font-medium">
                              {formatINR(item.rate)}
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                              {formatINR(item.estimated_cost)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setIsBOQModalOpen(true, project.id, item.room_id, item)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                  title="Edit BOQ Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setBOQToDelete(item)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Delete BOQ Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredBOQItems.map((item) => {
                    const assignedRoom = rooms.find(r => r.id === item.room_id);
                    return (
                      <div key={item.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{item.item_name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                                  {item.category}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 font-medium">
                                {assignedRoom ? assignedRoom.name : 'General Site'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Cost</span>
                            <span className="text-sm font-extrabold text-slate-900">{formatINR(item.estimated_cost)}</span>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <div className="text-slate-600">
                            <span className="font-semibold">{item.quantity} {item.unit || 'units'}</span>
                            <span className="text-slate-400 mx-1.5">@</span>
                            <span>{formatINR(item.rate)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setIsBOQModalOpen(true, project.id, item.room_id, item)}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Edit BOQ Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setBOQToDelete(item)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Delete BOQ Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES */}
      {activeTab === 'Expenses' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Project Expense Ledger</h3>
                <p className="text-xs text-slate-500">Every recorded payment directly recalculates the authoritative project budget.</p>
              </div>

              <button
                onClick={() => setIsAddExpenseModalOpen(true, project.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Expense</span>
              </button>
            </div>

            {projectExpenses.length === 0 ? (
              <EmptyState
                icon={IndianRupee}
                title="No expenses logged for this project"
                description="Record advances, vendor payments, and site expenses to track real-time utilization."
                actionLabel="+ Add First Expense"
                onAction={() => setIsAddExpenseModalOpen(true, project.id)}
              />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Title & Category</th>
                        <th className="px-4 py-3">Room / Area</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectExpenses.map((exp) => {
                        const assignedRoom = rooms.find(r => r.id === exp.room_id);
                        return (
                          <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{exp.title}</div>
                              <span className="text-[10px] text-slate-400 font-semibold">{exp.category}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">
                              {assignedRoom ? assignedRoom.name : 'General Project'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">
                              {exp.vendor || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {formatDate(exp.date)}
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-brand-600">
                              {formatINR(exp.amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge status={exp.paymentStatus} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setIsAddExpenseModalOpen(true, project.id, exp)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                  title="Edit Expense"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setExpenseToDelete(exp)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {projectExpenses.map((exp) => {
                    const assignedRoom = rooms.find(r => r.id === exp.room_id);
                    return (
                      <div key={exp.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{exp.title}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-semibold">
                                {exp.category}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {assignedRoom ? assignedRoom.name : 'General Project'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-brand-600 block">{formatINR(exp.amount)}</span>
                            <div className="mt-1">
                              <Badge status={exp.paymentStatus} size="sm" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                          <div>
                            <span>Vendor: <strong className="text-slate-700">{exp.vendor || '—'}</strong></span>
                            <span className="mx-2">•</span>
                            <span>{formatDate(exp.date)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setIsAddExpenseModalOpen(true, project.id, exp)}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* TAB 5: BUDGET */}
      {activeTab === 'Budget' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-slate-900 pb-2 border-b border-slate-100">
              Category Variance & Budget Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBreakdown.map((cat) => {
                const variance = cat.estimated - cat.spent;
                const isOver = cat.spent > cat.estimated && cat.estimated > 0;

                return (
                  <div key={cat.category} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-bold text-xs text-slate-900">{cat.category}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}`}>
                        {cat.estimated > 0 ? (isOver ? 'Over BOQ Estimate' : 'Within BOQ') : 'Actual Spending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs py-1">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">BOQ Estimate</div>
                        <div className="font-extrabold text-slate-800">{formatINR(cat.estimated)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Actual Spent</div>
                        <div className="font-extrabold text-brand-600">{formatINR(cat.spent)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Variance</div>
                        <div className={`font-extrabold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {variance >= 0 ? `+${formatINR(variance)}` : `-${formatINR(Math.abs(variance))}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MATERIALS & STOCK TRACKING */}
      {activeTab === 'Materials' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Site Materials & Stock Ledger</h3>
                <p className="text-xs text-slate-500">Track material deliveries (IN), on-site consumption (OUT), and live available inventory.</p>
              </div>

              <button
                onClick={() => setIsMaterialModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Material</span>
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search material by name or spec..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <select
                  value={materialCategoryFilter}
                  onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">Filter Category: All</option>
                  {['Plywood & Boards', 'Laminates & Veneer', 'Paints & Primers', 'Electrical & Wire', 'Hardware & Fittings', 'Tiles & Stone', 'Sanitary & Plumbing', 'Civil Materials', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={materialRoomFilter}
                  onChange={(e) => setMaterialRoomFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">Filter Room: All Areas</option>
                  <option value="General">General / Site Wide</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredMaterials.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No materials logged for this site"
                description="Add materials like Plywood sheets, Laminate rolls, and Cement bags to record Stock IN & OUT."
                actionLabel="+ Add First Material"
                onAction={() => setIsMaterialModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredMaterials.map((mat) => {
                  const stockSummary = materialService.calculateStock(mat.id, materialTransactions, mat.minimum_stock);
                  const assignedRoom = rooms.find(r => r.id === mat.room_id);

                  return (
                    <div key={mat.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">{mat.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            stockSummary.is_out_of_stock
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : stockSummary.is_low_stock
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {stockSummary.is_out_of_stock ? 'Out of Stock' : stockSummary.is_low_stock ? 'Low Stock' : 'Available'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                          {mat.category && <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">{mat.category}</span>}
                          {assignedRoom && <span>• {assignedRoom.name}</span>}
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-xs mb-3 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Available</span>
                            <span className={`text-base font-black ${stockSummary.available <= 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                              {stockSummary.available} <span className="text-[10px] font-normal text-slate-500">{mat.unit}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total IN</span>
                            <span className="text-sm font-bold text-emerald-600">
                              +{stockSummary.total_in}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total OUT</span>
                            <span className="text-sm font-bold text-amber-600">
                              -{stockSummary.total_out}
                            </span>
                          </div>
                        </div>

                        {mat.notes && (
                          <p className="text-xs text-slate-500 italic line-clamp-1 mb-3">"{mat.notes}"</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsMaterialTransactionModalOpen(true, mat, 'in')}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                            title="Record Stock IN"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>+ IN</span>
                          </button>
                          <button
                            onClick={() => setIsMaterialTransactionModalOpen(true, mat, 'out')}
                            disabled={stockSummary.available <= 0}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Record Stock OUT"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>- OUT</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setHistoryMaterial(mat)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="View History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setIsMaterialModalOpen(true, mat)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Edit Material"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMaterialToDelete(mat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* TAB 7: MILESTONES */}
      {activeTab === 'Milestones' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Project Execution Milestones</h3>
                <p className="text-xs text-slate-500">Key site checkpoints driving overall deterministic project completion progress.</p>
              </div>

              <button
                onClick={() => setIsMilestoneModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Milestone</span>
              </button>
            </div>

            {/* Overall Progress Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Derived Project Progress</span>
                <div className="text-2xl font-black font-display text-amber-400 mt-0.5">
                  {displayProgressText}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Average progress across {projectMilestones.length} milestone checkpoint{projectMilestones.length !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="sm:w-64">
                <ProgressBar value={progressNumericValue} height="md" />
              </div>
            </div>

            {projectMilestones.length === 0 ? (
              <EmptyState
                icon={Flag}
                title="No milestones configured"
                description="Set up timeline milestones like Design Finalization, Civil Work, Carpentry, and Handover."
                actionLabel="+ Add First Milestone"
                onAction={() => setIsMilestoneModalOpen(true)}
              />
            ) : (
              <div className="space-y-3 pt-2">
                {projectMilestones.map((ms, index) => {
                  const isCompleted = ms.status === 'completed' || ms.progress === 100;
                  const isDelayed = ms.status === 'delayed';

                  return (
                    <div
                      key={ms.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCompleted
                          ? 'bg-emerald-50/40 border-emerald-200/80'
                          : isDelayed
                          ? 'bg-rose-50/40 border-rose-200/80'
                          : 'bg-white border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{ms.title}</h4>
                            {ms.description && <p className="text-xs text-slate-500 line-clamp-1">{ms.description}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge status={ms.status === 'completed' ? 'Completed' : ms.status === 'delayed' ? 'Delayed' : ms.status === 'in_progress' ? 'Needs Attention' : 'Pending'} />
                          <span className="text-xs font-black text-slate-800">{ms.progress}%</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                          <ProgressBar value={ms.progress} height="sm" />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4 text-slate-500 font-medium">
                          {ms.start_date && <span>Start: {formatDate(ms.start_date)}</span>}
                          {ms.due_date && <span>Target: {formatDate(ms.due_date)}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isCompleted && (
                            <button
                              onClick={() => updateMilestone(ms.id, { status: 'completed', progress: 100 })}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Complete</span>
                            </button>
                          )}
                          <button
                            onClick={() => setIsMilestoneModalOpen(true, ms)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Edit Milestone"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMilestoneToDelete(ms)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* TAB 8: DAILY UPDATES / DPR SITE DIARY */}
      {activeTab === 'Daily Updates' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Daily Progress Reports (DPR) & Site Diary</h3>
                <p className="text-xs text-slate-500">Document daily execution logs, worker attendance, site issues, and next-day plans.</p>
              </div>

              <button
                onClick={() => setIsDailyUpdateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Daily Report</span>
              </button>
            </div>

            {projectDailyUpdates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No daily site updates logged yet"
                description="Log site updates daily to maintain a complete operational audit trail and resolve blockers quickly."
                actionLabel="+ Log First DPR"
                onAction={() => setIsDailyUpdateModalOpen(true)}
              />
            ) : (
              <div className="space-y-4 pt-2">
                {projectDailyUpdates.map((dpr) => (
                  <div key={dpr.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(dpr.update_date)}</span>
                        </div>
                        {dpr.workers_count !== undefined && dpr.workers_count > 0 && (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {dpr.workers_count} Workers
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {dpr.progress !== undefined && (
                          <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {dpr.progress}% Site Progress
                          </span>
                        )}
                        <button
                          onClick={() => setIsUploadPhotoModalOpen(true, dpr.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          title="Attach Photo to DPR"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Add Photo</span>
                        </button>
                        <button
                          onClick={() => setIsDailyUpdateModalOpen(true, dpr)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                          title="Edit DPR"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDailyUpdateToDelete(dpr)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Delete DPR"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Work Completed:
                        </span>
                        <p className="text-slate-700 font-medium pl-5 leading-relaxed">{dpr.work_completed}</p>
                      </div>

                      {dpr.work_pending && (
                        <div>
                          <span className="font-semibold text-slate-600 block mb-1 pl-5">Work In Progress / Pending:</span>
                          <p className="text-slate-600 pl-5">{dpr.work_pending}</p>
                        </div>
                      )}

                      {dpr.issues && (
                        <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
                          <span className="font-bold text-rose-800 block mb-0.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Site Issues & Blockers:
                          </span>
                          <p className="text-rose-700 font-medium pl-5">{dpr.issues}</p>
                        </div>
                      )}

                      {dpr.next_day_tasks && (
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <span className="font-bold text-blue-900 block mb-0.5 flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            Tomorrow's Action Plan:
                          </span>
                          <p className="text-blue-800 font-medium pl-5">{dpr.next_day_tasks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 9: PHOTOS (AUTHENTICATED STORAGE & SIGNED URLS) */}
      {activeTab === 'Photos' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Project Photos & Site Gallery</h3>
                <p className="text-xs text-slate-500">Private tenant-isolated photos stored securely in Supabase storage.</p>
              </div>

              <button
                onClick={() => setIsUploadPhotoModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>+ Upload Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['All', 'Site Progress', 'Design', 'Materials', 'Completed Work'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPhotoFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    photoFilter === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredPhotos.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No photos in this category yet"
                description="Upload site progress pictures, marble slab selections, or 3D concept renders."
                actionLabel="+ Upload Photo"
                onAction={() => setIsUploadPhotoModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div
                      onClick={() => setLightboxPhoto(photo)}
                      className="relative h-48 w-full overflow-hidden bg-slate-100 cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                        {photo.category}
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 font-bold text-xs flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5" />
                          View
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 flex items-center justify-between">
                      <div className="overflow-hidden mr-2">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{photo.title}</h4>
                        <span className="text-[11px] text-slate-400">{formatDate(photo.uploadedAt)}</span>
                      </div>

                      <button
                        onClick={() => setPhotoToDelete(photo)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 10: NOTES */}
      {activeTab === 'Notes' && (
        <div className="space-y-6">
          <div className="premium-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Project Notes & Decisions Feed</h3>
                <p className="text-xs text-slate-500">Record client approvals, material color choices, and site instructions.</p>
              </div>

              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>+ Add Note</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No notes logged yet"
                description="Keep track of verbal client approvals, wardrobe laminate codes, and site inspection items."
                actionLabel="+ Add First Note"
                onAction={() => setIsNoteModalOpen(true)}
              />
            ) : (
              <div className="space-y-3 pt-2">
                {notes.map((n) => {
                  let tagBg = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (n.tag === 'Client Decision') tagBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (n.tag === 'Vendor Issue') tagBg = 'bg-amber-50 text-amber-700 border-amber-200';
                  else if (n.tag === 'Site Update') tagBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';

                  return (
                    <div key={n.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tagBg}`}>
                            {n.tag || 'General'}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{n.author}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{n.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 11: TASKS */}
      {activeTab === 'Tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Project Execution Tasks</h3>
              <p className="text-xs text-slate-500">Site milestones, checklist approvals, and designer assignments for {project.name}.</p>
            </div>
            <button
              onClick={() => {
                setProjectTaskToEdit(null);
                setIsProjectTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-400" />
              <span>+ Add Task</span>
            </button>
          </div>

          {projectTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks assigned for this project"
              description="Create checklist items for site supervision, sample selections, or vendor milestones."
              actionLabel="+ Create Project Task"
              onAction={() => {
                setProjectTaskToEdit(null);
                setIsProjectTaskModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {projectTasks.map((t) => {
                const isDone = t.status === 'Completed';
                return (
                  <div
                    key={t.id}
                    className={`bg-white p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDone ? 'border-slate-200 bg-slate-50/40 opacity-75' : 'border-slate-200/90 shadow-xs hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={async () => {
                          const next: TaskStatus = t.status === 'Completed' ? 'To Do' : 'Completed';
                          await updateTask(t.id, { status: next });
                        }}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 hover:border-brand-500 bg-white'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {t.priority}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {t.status}
                          </span>
                        </div>
                        <h4 className={`text-xs sm:text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          {t.due_date && <span>Due: {formatDate(t.due_date)}</span>}
                          {t.assigned_staff_name && <span className="inline-flex items-center gap-1 font-medium text-slate-600"><UserRound className="h-3.5 w-3.5 text-slate-400" />{t.assigned_staff_name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setProjectTaskToEdit(t);
                          setIsProjectTaskModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete task "${t.title}"?`)) deleteTask(t.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 12: DOCUMENTS */}
      {activeTab === 'Documents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Project Documents & Blueprints</h3>
              <p className="text-xs text-slate-500">Contracts, CAD drawings, site measurements, and estimates for {project.name}.</p>
            </div>
            <button
              onClick={() => setIsProjectUploadDocModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-400" />
              <span>+ Upload Document</span>
            </button>
          </div>

          {projectDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents uploaded for this project"
              description="Upload PDF proposals, client agreements, CAD DWG sets, or vendor quotes."
              actionLabel="+ Upload Project Document"
              onAction={() => setIsProjectUploadDocModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectDocuments.map((doc) => (
                <div key={doc.id} className="premium-card p-5 flex flex-col justify-between group hover:border-brand-300">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {doc.category || doc.type || 'Document'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 mb-1 group-hover:text-brand-600 transition-colors">
                      {doc.title}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {doc.size || 'PDF / CAD'} • {formatDate(doc.updatedAt || doc.created_at || '')}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={async () => {
                        setDownloadingDocId(doc.id);
                        try {
                          if (doc.storage_path && !isDemoMode) {
                            const url = await documentService.getSignedUrl(doc.storage_path);
                            window.open(url, '_blank');
                          } else if (doc.fileUrl) {
                            window.open(doc.fileUrl, '_blank');
                          } else {
                            alert(`Downloaded sample blueprint: "${doc.title}"`);
                          }
                        } catch (err: any) {
                          alert(err.message || 'Failed to download document.');
                        } finally {
                          setDownloadingDocId(null);
                        }
                      }}
                      disabled={downloadingDocId === doc.id}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingDocId === doc.id ? 'Loading...' : 'Download'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete document "${doc.title}"?`)) deleteDocument(doc.id, doc.storage_path);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 13: PAYMENTS */}
      {activeTab === 'Payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Client Payment Schedules & Receipts</h3>
              <p className="text-xs text-slate-500">Track milestone billing, installment collections, and outstanding dues.</p>
            </div>
            <button
              onClick={() => {
                setProjectPaymentToEdit(null);
                setIsProjectPaymentModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Payment</span>
            </button>
          </div>

          {/* Payment Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Contract Value</span>
              <div className="text-2xl font-extrabold font-display text-slate-900 mt-2">
                {formatINR(profitability.contractValue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total contract baseline</p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Received</span>
              <div className="text-2xl font-extrabold font-display text-emerald-600 mt-2">
                {formatINR(profitability.revenueReceived)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {profitability.contractValue > 0 
                  ? `${((profitability.revenueReceived / profitability.contractValue) * 100).toFixed(1)}% collected`
                  : 'Actual paid receipts'}
              </p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Outstanding Contract</span>
              <div className="text-2xl font-extrabold font-display text-amber-600 mt-2">
                {formatINR(profitability.outstandingAgainstContract)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Remaining to be collected</p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Scheduled Invoices</span>
              <div className="text-2xl font-extrabold font-display text-indigo-600 mt-2">
                {formatINR(profitability.totalScheduled)}
              </div>
              <p className="text-xs text-slate-400 mt-1">{projectPayments.length} milestones created</p>
            </div>
          </div>

          {/* Payments List Table */}
          {projectPayments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No client payment milestones recorded"
              description="Create payment milestones like Advance Deposit, Structure Handover, or Final Handover."
              actionLabel="+ Record Payment Milestone"
              onAction={() => {
                setProjectPaymentToEdit(null);
                setIsProjectPaymentModalOpen(true);
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Milestone / Title</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Scheduled Amount</th>
                      <th className="py-3.5 px-4 text-right">Paid Amount</th>
                      <th className="py-3.5 px-4">Method / Ref</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {projectPayments.map((p) => {
                      const isOverdue = (p.status === 'overdue' || (p.due_date && new Date(p.due_date) < new Date() && p.status !== 'paid'));
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.title || p.milestone_name || 'Payment Milestone'}</div>
                            {p.notes && <div className="text-[11px] text-slate-400 line-clamp-1">{p.notes}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-600">{p.due_date ? formatDate(p.due_date) : '—'}</span>
                            {isOverdue && (
                              <span className="block text-[10px] font-bold text-rose-500 mt-0.5">Overdue</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatINR(p.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                            {formatINR(p.paid_amount || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {p.payment_method || '—'}
                            {p.reference_number && <div className="text-[10px] text-slate-400 font-mono">Ref: {p.reference_number}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setProjectPaymentToEdit(p);
                                  setIsProjectPaymentModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Payment"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPaymentToDelete(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      )}

      {/* TAB 14: PURCHASES & PROCUREMENT */}
      {activeTab === 'Purchases' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Purchase Orders & Site Procurement</h3>
              <p className="text-xs text-slate-500">Atomic purchase orders, vendor assignments, and line-item fulfillment.</p>
            </div>
            <button
              onClick={() => {
                setProjectPurchaseToEdit(null);
                setIsProjectPurchaseModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Purchase Order</span>
            </button>
          </div>

          {/* Purchases Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Procurement Orders</span>
              <div className="text-2xl font-extrabold font-display text-slate-900 mt-2">
                {projectPurchases.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total POs issued</p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Total Committed POs</span>
              <div className="text-2xl font-extrabold font-display text-indigo-600 mt-2">
                {formatINR(projectPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Server-verified item totals</p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Fulfilled / Received</span>
              <div className="text-2xl font-extrabold font-display text-emerald-600 mt-2">
                {projectPurchases.filter(p => p.status === 'received' || p.status === 'delivered').length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Material on site</p>
            </div>

            <div className="premium-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Delivery</span>
              <div className="text-2xl font-extrabold font-display text-amber-600 mt-2">
                {projectPurchases.filter(p => p.status === 'draft' || p.status === 'ordered').length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Awaiting dispatch</p>
            </div>
          </div>

          {/* Purchases List */}
          {projectPurchases.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No purchase orders created for this project"
              description="Create atomic purchase orders with dynamic line items for plywood, hardware, lighting, or fabric."
              actionLabel="+ Create First Purchase Order"
              onAction={() => {
                setProjectPurchaseToEdit(null);
                setIsProjectPurchaseModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-4">
              {projectPurchases.map((po) => {
                const vendorObj = vendors.find(v => v.id === po.vendor_id);
                const vendorName = vendorObj?.name || po.vendor?.name || 'Vendor';

                return (
                  <div key={po.id} className="premium-card p-5 space-y-4 hover:border-indigo-200 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 font-mono">
                              {po.po_number || 'PO-DRAFT'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              po.status === 'received' || po.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'ordered'
                                ? 'bg-blue-100 text-blue-800'
                                : po.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {po.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              po.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : po.payment_status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                              Pay: {po.payment_status || 'unpaid'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Vendor: <span className="font-bold text-slate-800">{vendorName}</span> • Order Date: {po.order_date ? formatDate(po.order_date) : formatDate(po.created_at || '')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount</span>
                          <span className="text-lg font-black text-slate-900 font-display">
                            {formatINR(po.total_amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setProjectPurchaseToEdit(po);
                              setIsProjectPurchaseModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit PO"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPurchaseToDelete(po)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Preview */}
                    {po.items && po.items.length > 0 && (
                      <div className="bg-slate-50/75 rounded-xl p-3 border border-slate-100 text-xs">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Line Items ({po.items.length})
                        </div>
                        <div className="space-y-1.5">
                          {po.items.map((item, idx) => (
                            <div key={item.id || idx} className="flex items-center justify-between text-slate-700">
                              <span className="font-semibold">
                                {item.item_name} <span className="text-slate-400 font-normal">({item.quantity} {item.unit || 'units'} @ {formatINR(item.rate)})</span>
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatINR(item.total_amount || (item.quantity * item.rate))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALL MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* Project Task Modal */}
      <TaskModal
        isOpen={isProjectTaskModalOpen}
        onClose={() => {
          setIsProjectTaskModalOpen(false);
          setProjectTaskToEdit(null);
        }}
        defaultProjectId={project.id}
        taskToEdit={projectTaskToEdit}
      />

      {/* Project Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isProjectUploadDocModalOpen}
        onClose={() => setIsProjectUploadDocModalOpen(false)}
        defaultProjectId={project.id}
      />

      {/* Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        projectId={project.id}
        roomToEdit={roomToEdit}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={project}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        projectId={project.id}
      />

      {/* Phase 6 Material Modal */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        projectId={project.id}
        rooms={rooms}
        materialToEdit={materialToEdit}
      />

      {/* Phase 6 Material Transaction Modal (Stock IN / OUT) */}
      <MaterialTransactionModal
        isOpen={isMaterialTransactionModalOpen}
        onClose={() => setIsMaterialTransactionModalOpen(false)}
        material={selectedMaterialForTransaction}
        availableStock={
          selectedMaterialForTransaction
            ? materialService.calculateStock(selectedMaterialForTransaction.id, materialTransactions, selectedMaterialForTransaction.minimum_stock).available
            : 0
        }
        rooms={rooms}
        defaultType={materialTransactionType}
      />

      {/* Phase 6 Milestone Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        projectId={project.id}
        milestoneToEdit={milestoneToEdit}
      />

      {/* Phase 6 Daily Update Modal */}
      <DailyUpdateModal
        isOpen={isDailyUpdateModalOpen}
        onClose={() => setIsDailyUpdateModalOpen(false)}
        projectId={project.id}
        updateToEdit={dailyUpdateToEdit}
      />

      {/* Phase 6 Upload Photo Modal */}
      <UploadPhotoModal
        isOpen={isUploadPhotoModalOpen}
        onClose={() => setIsUploadPhotoModalOpen(false)}
        projectId={project.id}
        dailyUpdates={projectDailyUpdates}
        defaultDailyUpdateId={defaultPhotoDailyUpdateId}
      />

      {/* Material Stock Transaction History Drawer / Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock History: {historyMaterial.name}</h3>
                <p className="text-xs text-slate-500">Full audit log of receipts (IN) and consumption (OUT).</p>
              </div>
              <button
                onClick={() => setHistoryMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {materialTransactions.filter(t => t.material_id === historyMaterial.id).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No stock transactions recorded yet for this material.
                </div>
              ) : (
                materialTransactions
                  .filter(t => t.material_id === historyMaterial.id)
                  .map(tx => (
                    <div key={tx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg font-black text-xs ${
                          tx.transaction_type === 'in'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.transaction_type === 'in' ? '+ IN' : '- OUT'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {tx.transaction_type === 'in' ? '+' : '-'}{tx.quantity} {historyMaterial.unit}
                          </div>
                          {tx.notes && <div className="text-[11px] text-slate-500">{tx.notes}</div>}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDate(tx.transaction_date)}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setHistoryMaterial(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.title}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h4 className="font-bold text-sm">{lightboxPhoto.title}</h4>
              <p className="text-xs text-white/60 mt-0.5">{lightboxPhoto.category} • Uploaded {formatDate(lightboxPhoto.uploadedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Room: {roomToDelete.name}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to delete this room scope? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                disabled={isDeletingRoom}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingRoom ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete BOQ Confirmation Modal */}
      {boqToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete BOQ Item: {boqToDelete.item_name}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to remove this estimate line ({formatINR(boqToDelete.estimated_cost)})? This will recalculate project and room BOQ totals immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBOQToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBOQItem}
                disabled={isDeletingBOQ}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingBOQ ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Expense: {expenseToDelete.title}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to remove this ledger entry of {formatINR(expenseToDelete.amount)}? Project, room, and dashboard spending will be recalculated immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExpense}
                disabled={isDeletingExpense}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingExpense ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Material Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Material: {materialToDelete.name}?
            </h3>
            {materialDeleteError ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs mb-4">
                {materialDeleteError}
              </div>
            ) : (
              <p className="text-xs text-slate-600 font-medium mb-4">
                Are you sure you want to delete this material? If transactions exist, deletion will be safely blocked to preserve stock audit logs.
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setMaterialToDelete(null);
                  setMaterialDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                {materialDeleteError ? 'Close' : 'Cancel'}
              </button>
              {!materialDeleteError && (
                <button
                  onClick={confirmDeleteMaterial}
                  disabled={isDeletingMaterial}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isDeletingMaterial ? 'Deleting...' : 'Delete Material'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Milestone Confirmation Modal */}
      {milestoneToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Milestone: {milestoneToDelete.title}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to delete this milestone? Project progress percentage will be recalculated across remaining milestones.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setMilestoneToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMilestone}
                disabled={isDeletingMilestone}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingMilestone ? 'Deleting...' : 'Delete Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Daily Update Confirmation Modal */}
      {dailyUpdateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Daily Report ({formatDate(dailyUpdateToDelete.update_date)})?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to remove this daily site update?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDailyUpdateToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDailyUpdate}
                disabled={isDeletingDailyUpdate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingDailyUpdate ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Photo: {photoToDelete.title}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              This will permanently delete this image from your private storage and project gallery.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePhoto}
                disabled={isDeletingPhoto}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingPhoto ? 'Deleting...' : 'Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Milestone: {paymentToDelete.title || paymentToDelete.milestone_name}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to remove this client payment entry of {formatINR(paymentToDelete.amount)}? Revenue collected and project cash flow calculations will be updated immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPaymentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePayment}
                disabled={isDeletingPayment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingPayment ? 'Deleting...' : 'Delete Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Purchase Order Confirmation Modal */}
      {purchaseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete PO: {purchaseToDelete.po_number || 'Purchase Order'}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to delete this purchase order of {formatINR(purchaseToDelete.total_amount)} and its associated line items?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPurchaseToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePurchase}
                disabled={isDeletingPurchase}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingPurchase ? 'Deleting...' : 'Delete PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Payment Modal */}
      <ClientPaymentModal
        isOpen={isProjectPaymentModalOpen}
        onClose={() => {
          setIsProjectPaymentModalOpen(false);
          setProjectPaymentToEdit(null);
        }}
        defaultProjectId={project.id}
        paymentToEdit={projectPaymentToEdit}
      />

      {/* Purchase Order Modal */}
      <PurchaseModal
        isOpen={isProjectPurchaseModalOpen}
        onClose={() => {
          setIsProjectPurchaseModalOpen(false);
          setProjectPurchaseToEdit(null);
        }}
        defaultProjectId={project.id}
        purchaseToEdit={projectPurchaseToEdit}
      />

      {/* Delete Project Confirmation Modal */}
      {isDeleteProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Project: {project.name}?
            </h3>
            <p className="text-xs text-slate-600 font-medium mb-4">
              Are you sure you want to delete this project? All associated rooms, BOQ lines, expenses, and scope records will also be permanently deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteProjectOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={isDeletingProject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeletingProject ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
