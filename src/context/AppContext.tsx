// ==============================================================================
// APNI ESTATE INTERIORS - APP CONTEXT (REAL FINANCIAL ENGINE & MULTI-TENANT STATE)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Project, 
  Client,
  Room,
  Expense, 
  BOQItem, 
  Material, 
  MaterialTransaction, 
  Milestone, 
  DailyUpdate, 
  ProjectPhoto, 
  AttentionItem, 
  CalendarEvent, 
  DocumentItem, 
  NotificationItem, 
  ExpenseCategory, 
  ProjectStatus, 
  ProjectNote,
  Lead,
  Task,
  StaffMember,
  UserRole,
  DocumentCategory,
  Vendor,
  ClientPayment,
  Purchase,
  MaterialWastage
} from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_EXPENSES, 
  INITIAL_BOQ_ITEMS, 
  CALENDAR_EVENTS, 
  INITIAL_DOCUMENTS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_LEADS,
  INITIAL_TASKS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_VENDORS,
  INITIAL_CLIENT_PAYMENTS,
  INITIAL_PURCHASES
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { clientService } from '../services/clientService';
import { projectService } from '../services/projectService';
import { roomService } from '../services/roomService';
import { expenseService } from '../services/expenseService';
import { boqService } from '../services/boqService';
import { materialService, CreateMaterialInput, CreateMaterialTransactionInput } from '../services/materialService';
import { wastageService } from '../services/wastageService';
import { milestoneService, CreateMilestoneInput } from '../services/milestoneService';
import { dailyUpdateService, CreateDailyUpdateInput } from '../services/dailyUpdateService';
import { photoService, UploadPhotoInput } from '../services/photoService';
import { leadService } from '../services/leadService';
import { taskService } from '../services/taskService';
import { documentService } from '../services/documentService';
import { teamService } from '../services/teamService';
import { vendorService } from '../services/vendorService';
import { paymentService } from '../services/paymentService';
import { purchaseService } from '../services/purchaseService';
import { 
  calculateProjectSpent, 
  calculateNeedsAttention, 
  calculateCategoryBreakdown, 
  calculateBudgetMetrics, 
  CATEGORY_COLORS 
} from '../lib/financialMetrics';

export type NavigationPage = 
  | 'overview' 
  | 'projects' 
  | 'clients'
  | 'leads'
  | 'quotations'
  | 'change-requests'
  | 'site-controls'
  | 'client-portal'
  | 'tasks'
  | 'team'
  | 'project-detail' 
  | 'expenses' 
  | 'budget' 
  | 'calendar' 
  | 'workspace' 
  | 'documents'
  | 'vendors'
  | 'payments'
  | 'purchases'
  | 'reports'
  | 'management'
  | 'branches'
  | 'approvals'
  | 'roles'
  | 'export'
  | 'settings';

export type ProjectDetailTab = 
  | 'Overview' 
  | 'Rooms' 
  | 'BOQ' 
  | 'Expenses' 
  | 'Budget' 
  | 'Materials' 
  | 'Milestones' 
  | 'Daily Updates' 
  | 'Photos' 
  | 'Notes'
  | 'Tasks'
  | 'Documents'
  | 'Payments'
  | 'Purchases';

interface AppContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  openProjectDetail: (projectId: string, initialTab?: ProjectDetailTab) => void;
  initialProjectDetailTab?: ProjectDetailTab;
  
  // Search & Filters
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  
  // Data
  clients: Client[];
  leads: Lead[];
  tasks: Task[];
  teamMembers: StaffMember[];
  vendors: Vendor[];
  clientPayments: ClientPayment[];
  purchases: Purchase[];
  projects: Project[];
  expenses: Expense[];
  boqItems: BOQItem[];
  materials: Material[];
  materialTransactions: MaterialTransaction[];
  milestones: Milestone[];
  dailyUpdates: DailyUpdate[];
  projectPhotos: ProjectPhoto[];
  attentionItems: AttentionItem[];
  calendarEvents: CalendarEvent[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  loadingData: boolean;
  
  // Modals state
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
  isAddExpenseModalOpen: boolean;
  setIsAddExpenseModalOpen: (open: boolean, defaultProjectId?: string, expenseToEdit?: Expense | null) => void;
  expenseToEdit: Expense | null;
  defaultExpenseProjectId: string | null;
  isBOQModalOpen: boolean;
  setIsBOQModalOpen: (open: boolean, projectId?: string, defaultRoomId?: string, itemToEdit?: BOQItem | null) => void;
  boqModalProjectId: string;
  boqModalDefaultRoomId?: string;
  boqItemToEdit: BOQItem | null;
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Material Modals
  isMaterialModalOpen: boolean;
  setIsMaterialModalOpen: (open: boolean, matToEdit?: Material | null) => void;
  materialToEdit: Material | null;
  isMaterialTransactionModalOpen: boolean;
  setIsMaterialTransactionModalOpen: (open: boolean, mat?: Material | null, type?: 'in' | 'out') => void;
  selectedMaterialForTransaction: Material | null;
  materialTransactionType: 'in' | 'out';

  // Milestone Modals
  isMilestoneModalOpen: boolean;
  setIsMilestoneModalOpen: (open: boolean, msToEdit?: Milestone | null) => void;
  milestoneToEdit: Milestone | null;

  // DPR Modals
  isDailyUpdateModalOpen: boolean;
  setIsDailyUpdateModalOpen: (open: boolean, dprToEdit?: DailyUpdate | null) => void;
  dailyUpdateToEdit: DailyUpdate | null;

  // Photo Modals
  isUploadPhotoModalOpen: boolean;
  setIsUploadPhotoModalOpen: (open: boolean, defaultDprId?: string) => void;
  defaultPhotoDailyUpdateId?: string;
  
  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;

  // Lead Actions
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  convertLeadToClient: (leadId: string) => Promise<{ client: Client; updatedLead: Lead }>;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  // Document Actions
  addDocument: (input: { organizationId: string; projectId?: string; projectName?: string; title: string; category: DocumentCategory; file: File; userId?: string }) => Promise<DocumentItem>;
  deleteDocument: (id: string, storagePath?: string) => Promise<void>;

  // Team Actions
  updateMemberRole: (profileId: string, newRole: UserRole) => Promise<void>;

  // Vendor Actions
  addVendor: (vendor: Partial<Vendor>) => Promise<Vendor>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<Vendor>;
  deleteVendor: (id: string) => Promise<void>;

  // Client Payment Actions
  addClientPayment: (payment: Partial<ClientPayment>) => Promise<ClientPayment>;
  updateClientPayment: (id: string, updates: Partial<ClientPayment>) => Promise<ClientPayment>;
  deleteClientPayment: (id: string) => Promise<void>;

  // Purchase Actions
  addPurchase: (purchase: any) => Promise<Purchase>;
  updatePurchase: (id: string, updates: any) => Promise<Purchase>;
  deletePurchase: (id: string) => Promise<void>;
  
  // Project Actions
  addProject: (newProject: Omit<Project, 'id' | 'spent' | 'progress'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Room Actions
  addRoom: (roomData: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => Promise<Room>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<Room>;
  deleteRoom: (id: string) => Promise<void>;
  
  // BOQ Actions
  addBOQItem: (itemData: {
    project_id: string;
    room_id?: string;
    item_name: string;
    description?: string;
    category?: string;
    quantity: number;
    unit?: string;
    rate: number;
    estimated_cost?: number;
    material_rate?: number;
    labour_rate?: number;
    selling_rate?: number;
    gst_percent?: number;
  }) => Promise<BOQItem>;
  updateBOQItem: (id: string, updates: Partial<BOQItem>) => Promise<BOQItem>;
  deleteBOQItem: (id: string) => Promise<void>;
  approveProjectBOQ: (projectId: string) => Promise<void>;

  // Expense Actions
  addExpense: (newExpense: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;

  // Material Actions
  addMaterial: (input: CreateMaterialInput) => Promise<Material>;
  updateMaterial: (id: string, updates: Partial<CreateMaterialInput>) => Promise<Material>;
  deleteMaterial: (id: string) => Promise<void>;
  addMaterialTransaction: (input: CreateMaterialTransactionInput) => Promise<MaterialTransaction>;
  recordMaterialWastage: (input: { materialId: string; quantity: number; reason: string; wastageDate: string }) => Promise<MaterialWastage>;

  // Milestone Actions
  addMilestone: (input: CreateMilestoneInput) => Promise<Milestone>;
  updateMilestone: (id: string, updates: Partial<CreateMilestoneInput>) => Promise<Milestone>;
  deleteMilestone: (id: string) => Promise<void>;

  // Daily Update Actions
  addDailyUpdate: (input: CreateDailyUpdateInput) => Promise<DailyUpdate>;
  updateDailyUpdate: (id: string, updates: Partial<CreateDailyUpdateInput>) => Promise<DailyUpdate>;
  deleteDailyUpdate: (id: string) => Promise<void>;

  // Photo Actions
  uploadProjectPhoto: (projectId: string, file: File, metadata?: { title?: string; category?: any; daily_update_id?: string }) => Promise<ProjectPhoto>;
  deleteProjectPhoto: (photoId: string, storagePath?: string) => Promise<void>;

  // Aux Actions
  addProjectNote: (projectId: string, content: string, tag?: ProjectNote['tag']) => void;
  addProjectPhoto: (projectId: string, photo: Omit<ProjectPhoto, 'id' | 'projectId' | 'uploadedAt'>) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDemoData: () => void;
  refreshData: () => Promise<void>;
  
  // Computed stats
  stats: {
    activeProjectsCount: number;
    needAttentionCount: number;
    totalProjectValue: number;
    totalBudget: number;
    totalBOQEstimate: number;
    totalSpent: number;
    totalRemaining: number;
    spentPercentage: number;
    categorySpending: { category: ExpenseCategory; amount: number; percentage: number; color: string }[];
    recentExpenses: Expense[];
    selectedProject: Project | null;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial mock clients for demo mode
const INITIAL_DEMO_CLIENTS: Client[] = [
  {
    id: 'client-1',
    organization_id: 'demo-org',
    name: 'Vikram & Ananya Kapoor',
    phone: '+91 98201 44521',
    email: 'vikram.kapoor@gmail.com',
    address: 'Worli Sea Face, Mumbai',
    notes: 'Prefers contemporary Italian aesthetics, minimal clutter.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'client-2',
    organization_id: 'demo-org',
    name: 'Siddharth Roy',
    phone: '+91 98450 11234',
    email: 'siddharth.roy@nexustech.io',
    address: 'Koramangala 4th Block, Bangalore',
    notes: 'Fast turnaround needed for 50-seater engineering office.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'client-3',
    organization_id: 'demo-org',
    name: 'Kavita Singhania',
    phone: '+91 99100 88765',
    email: 'kavita.singhania@heritage.in',
    address: 'Golf Course Road, Gurgaon',
    notes: 'Warm natural tones, brass hardware, custom veneer finishes.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, profile, isAuthenticated, isDemoMode } = useAuth();

  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [initialProjectDetailTab, setInitialProjectDetailTab] = useState<ProjectDetailTab>('Overview');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [loadingData, setLoadingData] = useState<boolean>(false);
  
  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpenState] = useState<boolean>(false);
  const [defaultExpenseProjectId, setDefaultExpenseProjectId] = useState<string | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // BOQ Modal state
  const [isBOQModalOpen, setIsBOQModalOpenState] = useState<boolean>(false);
  const [boqModalProjectId, setBOQModalProjectId] = useState<string>('');
  const [boqModalDefaultRoomId, setBOQModalDefaultRoomId] = useState<string | undefined>(undefined);
  const [boqItemToEdit, setBOQItemToEdit] = useState<BOQItem | null>(null);

  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Phase 6 Modals State
  const [isMaterialModalOpen, setIsMaterialModalOpenState] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  const [isMaterialTransactionModalOpen, setIsMaterialTransactionModalOpenState] = useState(false);
  const [selectedMaterialForTransaction, setSelectedMaterialForTransaction] = useState<Material | null>(null);
  const [materialTransactionType, setMaterialTransactionType] = useState<'in' | 'out'>('in');

  const [isMilestoneModalOpen, setIsMilestoneModalOpenState] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<Milestone | null>(null);

  const [isDailyUpdateModalOpen, setIsDailyUpdateModalOpenState] = useState(false);
  const [dailyUpdateToEdit, setDailyUpdateToEdit] = useState<DailyUpdate | null>(null);

  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpenState] = useState(false);
  const [defaultPhotoDailyUpdateId, setDefaultPhotoDailyUpdateId] = useState<string | undefined>(undefined);

  // Core Data States
  const [clients, setClients] = useState<Client[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_clients');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_CLIENTS;
    }
    return [];
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_leads');
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    }
    return [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    }
    return [];
  });

  const [teamMembers, setTeamMembers] = useState<StaffMember[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_team');
      return saved ? JSON.parse(saved) : INITIAL_STAFF_MEMBERS;
    }
    return [];
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_vendors');
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    }
    return [];
  });

  const [clientPayments, setClientPayments] = useState<ClientPayment[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_client_payments');
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_PAYMENTS;
    }
    return [];
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_purchases');
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    }
    return [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    }
    return [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    }
    return [];
  });

  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_boq_items');
      return saved ? JSON.parse(saved) : (INITIAL_BOQ_ITEMS as BOQItem[]);
    }
    return [];
  });

  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialTransactions, setMaterialTransactions] = useState<MaterialTransaction[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);
  const [projectPhotos, setProjectPhotos] = useState<ProjectPhoto[]>([]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_calendar');
      return saved ? JSON.parse(saved) : CALENDAR_EVENTS;
    }
    return [];
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_documents');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (isDemoMode) {
      const saved = localStorage.getItem('apni_estate_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    }
    return [];
  });

  // Load Remote Data from Supabase when in Authenticated Mode
  const loadRemoteData = useCallback(async () => {
    if (isDemoMode || !isAuthenticated || !organization?.id) {
      return;
    }

    setLoadingData(true);
    try {
      const [
        remoteClients, 
        remoteProjects, 
        remoteExpenses, 
        remoteBOQ, 
        remoteLeads, 
        remoteTasks, 
        remoteTeam, 
        remoteDocs,
        remoteVendors,
        remotePayments,
        remotePurchases
      ] = await Promise.all([
        clientService.getClients(organization.id),
        projectService.getProjects(organization.id),
        expenseService.getExpenses(organization.id),
        boqService.getBOQItems(organization.id),
        leadService.getLeads(organization.id).catch(() => []),
        taskService.getTasks({ organizationId: organization.id }).catch(() => []),
        teamService.getTeamMembers(organization.id).catch(() => []),
        documentService.getDocuments({ organizationId: organization.id }).catch(() => []),
        vendorService.getVendors(organization.id).catch(() => []),
        paymentService.getPayments(organization.id).catch(() => []),
        purchaseService.getPurchases(organization.id).catch(() => [])
      ]);

      // Calculate authoritative spending for projects and rooms directly from expense ledger
      const projectsWithAuthoritativeFinancials = remoteProjects.map(p => {
        const spent = calculateProjectSpent(p.id, remoteExpenses);
        
        // Compute room-level spending
        const updatedRooms = (p.rooms || []).map(r => {
          const roomSpent = remoteExpenses
            .filter(e => e.room_id === r.id)
            .reduce((sum, e) => sum + e.amount, 0);
          return {
            ...r,
            spent: roomSpent
          };
        });

        return {
          ...p,
          spent,
          rooms: updatedRooms,
          boq_items: remoteBOQ.filter(b => b.project_id === p.id)
        };
      });

      setClients(remoteClients);
      setProjects(projectsWithAuthoritativeFinancials);
      setExpenses(remoteExpenses);
      setBoqItems(remoteBOQ);
      setLeads(remoteLeads);
      setTasks(remoteTasks);
      setTeamMembers(remoteTeam);
      setDocuments(remoteDocs);
      setVendors(remoteVendors);
      setClientPayments(remotePayments);
      setPurchases(remotePurchases);

      const activeProjId = selectedProjectId || (projectsWithAuthoritativeFinancials.length > 0 ? projectsWithAuthoritativeFinancials[0].id : null);
      if (activeProjId) {
        try {
          const [remoteMats, remoteTx, remoteMilestones, remoteDpr, remotePhotos] = await Promise.all([
            materialService.getMaterials(activeProjId),
            materialService.getMaterialTransactions(activeProjId),
            milestoneService.getMilestones(activeProjId),
            dailyUpdateService.getDailyUpdates(activeProjId),
            photoService.getProjectPhotos(activeProjId)
          ]);
          setMaterials(remoteMats);
          setMaterialTransactions(remoteTx);
          setMilestones(remoteMilestones);
          setDailyUpdates(remoteDpr);
          setProjectPhotos(remotePhotos);
        } catch (opErr) {
          console.warn('[AppContext] Operational data load note:', opErr);
        }
      }

      if (projectsWithAuthoritativeFinancials.length > 0 && (!selectedProjectId || !projectsWithAuthoritativeFinancials.some(p => p.id === selectedProjectId))) {
        setSelectedProjectId(projectsWithAuthoritativeFinancials[0].id);
      } else if (projectsWithAuthoritativeFinancials.length === 0) {
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error('[AppContext] Failed to load remote tenant data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [isDemoMode, isAuthenticated, organization?.id, selectedProjectId]);

  useEffect(() => {
    if (!isDemoMode && isAuthenticated && organization?.id) {
      loadRemoteData();
    } else if (isDemoMode) {
      // Restore demo state
      const savedClients = localStorage.getItem('apni_estate_clients');
      setClients(savedClients ? JSON.parse(savedClients) : INITIAL_DEMO_CLIENTS);

      const savedProjects = localStorage.getItem('apni_estate_projects');
      const parsedProjects = savedProjects ? JSON.parse(savedProjects) : INITIAL_PROJECTS;
      setProjects(parsedProjects);

      const savedExpenses = localStorage.getItem('apni_estate_expenses');
      setExpenses(savedExpenses ? JSON.parse(savedExpenses) : INITIAL_EXPENSES);

      const savedBOQ = localStorage.getItem('apni_estate_boq_items');
      setBoqItems(savedBOQ ? JSON.parse(savedBOQ) : (INITIAL_BOQ_ITEMS as BOQItem[]));

      const savedVendors = localStorage.getItem('apni_estate_vendors');
      setVendors(savedVendors ? JSON.parse(savedVendors) : INITIAL_VENDORS);

      const savedPayments = localStorage.getItem('apni_estate_client_payments');
      setClientPayments(savedPayments ? JSON.parse(savedPayments) : INITIAL_CLIENT_PAYMENTS);

      const savedPurchases = localStorage.getItem('apni_estate_purchases');
      setPurchases(savedPurchases ? JSON.parse(savedPurchases) : INITIAL_PURCHASES);

      if (parsedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(parsedProjects[0].id);
      }
    }
  }, [isDemoMode, isAuthenticated, organization?.id]);

  // Sync to local storage only when in Demo mode
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_clients', JSON.stringify(clients));
    }
  }, [clients, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_projects', JSON.stringify(projects));
    }
  }, [projects, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_boq_items', JSON.stringify(boqItems));
    }
  }, [boqItems, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_calendar', JSON.stringify(calendarEvents));
    }
  }, [calendarEvents, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_documents', JSON.stringify(documents));
    }
  }, [documents, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_leads', JSON.stringify(leads));
    }
  }, [leads, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_team', JSON.stringify(teamMembers));
    }
  }, [teamMembers, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_vendors', JSON.stringify(vendors));
    }
  }, [vendors, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_client_payments', JSON.stringify(clientPayments));
    }
  }, [clientPayments, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_purchases', JSON.stringify(purchases));
    }
  }, [purchases, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_team', JSON.stringify(teamMembers));
    }
  }, [teamMembers, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('apni_estate_notifications', JSON.stringify(notifications));
    }
  }, [notifications, isDemoMode]);

  // Open Project Detail Page
  const openProjectDetail = (
    projectId: string, 
    initialTab: ProjectDetailTab = 'Overview'
  ) => {
    setSelectedProjectId(projectId);
    setInitialProjectDetailTab(initialTab);
    setCurrentPage('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddExpense = (open: boolean, defaultProjId?: string, editExp?: Expense | null) => {
    setDefaultExpenseProjectId(defaultProjId || null);
    setExpenseToEdit(editExp || null);
    setIsAddExpenseModalOpenState(open);
  };

  const handleOpenBOQModal = (open: boolean, projId?: string, defaultRoomId?: string, itemToEdit?: BOQItem | null) => {
    setBOQModalProjectId(projId || selectedProjectId || (projects.length > 0 ? projects[0].id : ''));
    setBOQModalDefaultRoomId(defaultRoomId);
    setBOQItemToEdit(itemToEdit || null);
    setIsBOQModalOpenState(open);
  };

  // ============================================================================
  // CLIENT CRUD
  // ============================================================================
  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
    if (!isDemoMode && organization?.id) {
      const created = await clientService.createClient({
        organization_id: organization.id,
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address,
        notes: clientData.notes
      });
      setClients(prev => [created, ...prev]);
      return created;
    } else {
      const newClient: Client = {
        ...clientData,
        id: `client-${Date.now()}`,
        organization_id: 'demo-org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setClients(prev => [newClient, ...prev]);
      return newClient;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
    if (!isDemoMode && organization?.id) {
      const updated = await clientService.updateClient(id, updates);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      return updated;
    } else {
      let updatedClient: Client | undefined;
      setClients(prev => prev.map(c => {
        if (c.id === id) {
          updatedClient = { ...c, ...updates, updated_at: new Date().toISOString() };
          return updatedClient;
        }
        return c;
      }));
      return updatedClient!;
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await clientService.deleteClient(id);
    }
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // ============================================================================
  // LEAD CRUD & CONVERSION
  // ============================================================================
  const addLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> => {
    if (!isDemoMode && organization?.id) {
      const created = await leadService.createLead({
        organization_id: organization.id,
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        source: leadData.source,
        requirement: leadData.requirement,
        estimated_budget: leadData.estimated_budget,
        status: leadData.status,
        notes: leadData.notes,
        assigned_to: leadData.assigned_to
      });
      setLeads(prev => [created, ...prev]);
      return created;
    } else {
      const newLead: Lead = {
        ...leadData,
        id: `lead-${Date.now()}`,
        organization_id: 'demo-org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    if (!isDemoMode && organization?.id) {
      const updated = await leadService.updateLead(id, updates);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
      return updated;
    } else {
      let updatedLead: Lead | undefined;
      setLeads(prev => prev.map(l => {
        if (l.id === id) {
          updatedLead = { ...l, ...updates, updated_at: new Date().toISOString() };
          return updatedLead;
        }
        return l;
      }));
      return updatedLead!;
    }
  };

  const deleteLead = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await leadService.deleteLead(id);
    }
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const convertLeadToClient = async (leadId: string): Promise<{ client: Client; updatedLead: Lead }> => {
    if (!isDemoMode && organization?.id) {
      const result = await leadService.convertToClient(leadId, organization.id);
      setClients(prev => [result.client, ...prev]);
      setLeads(prev => prev.map(l => l.id === leadId ? result.updatedLead : l));
      return result;
    } else {
      const targetLead = leads.find(l => l.id === leadId);
      if (!targetLead) throw new Error('Lead not found.');
      if (targetLead.converted_client_id) throw new Error('Lead already converted.');

      const newClient: Client = {
        id: `client-${Date.now()}`,
        organization_id: 'demo-org',
        name: targetLead.name,
        phone: targetLead.phone || '',
        email: targetLead.email || '',
        notes: `Converted from Lead (Requirement: ${targetLead.requirement || 'N/A'})${targetLead.notes ? `\n\nNotes: ${targetLead.notes}` : ''}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedLead: Lead = {
        ...targetLead,
        status: 'Won',
        converted_client_id: newClient.id,
        updated_at: new Date().toISOString()
      };

      setClients(prev => [newClient, ...prev]);
      setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
      return { client: newClient, updatedLead };
    }
  };

  // ============================================================================
  // TASK CRUD
  // ============================================================================
  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    if (!isDemoMode && organization?.id) {
      const created = await taskService.createTask({
        organization_id: organization.id,
        project_id: taskData.project_id || taskData.projectId,
        title: taskData.title,
        description: taskData.description,
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date || taskData.dueDate,
        priority: taskData.priority,
        status: taskData.status
      });
      setTasks(prev => [created, ...prev]);
      return created;
    } else {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        organization_id: 'demo-org',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    if (!isDemoMode && organization?.id) {
      const updated = await taskService.updateTask(id, {
        project_id: updates.project_id || updates.projectId,
        title: updates.title,
        description: updates.description,
        assigned_to: updates.assigned_to,
        due_date: updates.due_date || updates.dueDate,
        priority: updates.priority,
        status: updates.status
      });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      return updated;
    } else {
      let updatedTask: Task | undefined;
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          updatedTask = { ...t, ...updates, updated_at: new Date().toISOString() };
          return updatedTask;
        }
        return t;
      }));
      return updatedTask!;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await taskService.deleteTask(id);
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // ============================================================================
  // DOCUMENT ACTIONS
  // ============================================================================
  const addDocument = async (input: {
    organizationId: string;
    projectId?: string;
    projectName?: string;
    title: string;
    category: DocumentCategory;
    file: File;
    userId?: string;
  }): Promise<DocumentItem> => {
    if (!isDemoMode && organization?.id) {
      const created = await documentService.uploadDocument({
        organizationId: organization.id,
        projectId: input.projectId,
        title: input.title,
        category: input.category,
        file: input.file,
        userId: input.userId
      });
      setDocuments(prev => [created, ...prev]);
      return created;
    } else {
      const mockDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: input.projectId,
        projectId: input.projectId || '',
        projectName: input.projectName || 'General Studio Vault',
        title: input.title,
        category: input.category,
        type: input.category,
        file_name: input.file.name,
        file_size: input.file.size,
        size: `${(input.file.size / (1024 * 1024)).toFixed(1)} MB`,
        file_type: input.file.type,
        updatedAt: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      setDocuments(prev => [mockDoc, ...prev]);
      return mockDoc;
    }
  };

  const deleteDocument = async (id: string, storagePath?: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await documentService.deleteDocument(id, storagePath);
    }
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // ============================================================================
  // TEAM ROLE ACTIONS
  // ============================================================================
  const updateMemberRole = async (profileId: string, newRole: UserRole): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await teamService.updateMemberRole(profileId, newRole);
    }
    setTeamMembers(prev => prev.map(m => m.id === profileId ? { ...m, role: newRole } : m));
  };

  // ============================================================================
  // VENDOR CRUD ACTIONS
  // ============================================================================
  const addVendor = async (vendorData: Partial<Vendor>): Promise<Vendor> => {
    if (!isDemoMode && organization?.id) {
      const created = await vendorService.createVendor(organization.id, vendorData as any);
      setVendors(prev => [created, ...prev]);
      return created;
    } else {
      const mockVendor: Vendor = {
        id: `ven-${Date.now()}`,
        organization_id: 'demo-org',
        name: vendorData.name || 'New Supplier',
        contact_person: vendorData.contact_person,
        phone: vendorData.phone,
        email: vendorData.email,
        address: vendorData.address,
        category: vendorData.category || 'Materials',
        gst_number: vendorData.gst_number,
        rating: vendorData.rating || 5,
        notes: vendorData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setVendors(prev => [mockVendor, ...prev]);
      return mockVendor;
    }
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>): Promise<Vendor> => {
    if (!isDemoMode && organization?.id) {
      const updated = await vendorService.updateVendor(id, updates as any);
      setVendors(prev => prev.map(v => v.id === id ? updated : v));
      return updated;
    } else {
      let updatedVendor: Vendor | undefined;
      setVendors(prev => prev.map(v => {
        if (v.id === id) {
          updatedVendor = { ...v, ...updates, updated_at: new Date().toISOString() };
          return updatedVendor;
        }
        return v;
      }));
      return updatedVendor!;
    }
  };

  const deleteVendor = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await vendorService.deleteVendor(id);
    }
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  // ============================================================================
  // CLIENT PAYMENT CRUD ACTIONS
  // ============================================================================
  const addClientPayment = async (paymentData: Partial<ClientPayment>): Promise<ClientPayment> => {
    if (!isDemoMode && organization?.id) {
      const created = await paymentService.createPayment(organization.id, paymentData as any);
      setClientPayments(prev => [created, ...prev]);
      return created;
    } else {
      const foundProj = projects.find(p => p.id === paymentData.project_id);
      const foundCli = clients.find(c => c.id === paymentData.client_id || c.id === foundProj?.client_id);
      
      const mockPayment: ClientPayment = {
        id: `pay-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: paymentData.project_id || '',
        projectName: foundProj?.name || 'Interior Project',
        client_id: paymentData.client_id || foundProj?.client_id,
        clientName: foundCli?.name || foundProj?.client || 'Client',
        title: paymentData.title || 'Milestone Payment',
        amount: Number(paymentData.amount) || 0,
        due_date: paymentData.due_date || new Date().toISOString().split('T')[0],
        paid_amount: Number(paymentData.paid_amount) || 0,
        paid_date: paymentData.paid_date,
        status: paymentData.status || 'Pending',
        payment_method: paymentData.payment_method || 'Bank Transfer / NEFT',
        payment_reference: paymentData.payment_reference,
        notes: paymentData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setClientPayments(prev => [mockPayment, ...prev]);
      return mockPayment;
    }
  };

  const updateClientPayment = async (id: string, updates: Partial<ClientPayment>): Promise<ClientPayment> => {
    if (!isDemoMode && organization?.id) {
      const updated = await paymentService.updatePayment(id, updates as any);
      setClientPayments(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } else {
      let updatedPayment: ClientPayment | undefined;
      setClientPayments(prev => prev.map(p => {
        if (p.id === id) {
          updatedPayment = { ...p, ...updates, updated_at: new Date().toISOString() };
          return updatedPayment;
        }
        return p;
      }));
      return updatedPayment!;
    }
  };

  const deleteClientPayment = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await paymentService.deletePayment(id);
    }
    setClientPayments(prev => prev.filter(p => p.id !== id));
  };

  // ============================================================================
  // PURCHASE CRUD ACTIONS
  // ============================================================================
  const addPurchase = async (purchaseData: any): Promise<Purchase> => {
    if (!isDemoMode && organization?.id) {
      const created = await purchaseService.savePurchaseOrder(organization.id, purchaseData);
      setPurchases(prev => [created, ...prev]);
      return created;
    } else {
      const foundProj = projects.find(p => p.id === purchaseData.project_id);
      const foundVen = vendors.find(v => v.id === purchaseData.vendor_id);
      
      const items = (purchaseData.items || []).map((it: any, idx: number) => ({
        id: `poi-${Date.now()}-${idx}`,
        purchase_id: `po-${Date.now()}`,
        organization_id: 'demo-org',
        item_name: it.item_name,
        description: it.description || '',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'pcs',
        rate: Number(it.rate) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.rate) || 0),
        created_at: new Date().toISOString()
      }));

      const derivedTotal = items.reduce((sum: number, it: any) => sum + it.total, 0);

      const mockPurchase: Purchase = {
        id: `po-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: purchaseData.project_id,
        projectName: foundProj?.name || 'Project Site',
        vendor_id: purchaseData.vendor_id,
        vendorName: foundVen?.name || 'Supplier',
        po_number: purchaseData.po_number || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        order_date: purchaseData.order_date || new Date().toISOString().split('T')[0],
        expected_delivery: purchaseData.expected_delivery,
        status: purchaseData.status || 'Draft',
        payment_status: purchaseData.payment_status || 'Pending',
        notes: purchaseData.notes,
        total_amount: derivedTotal,
        items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setPurchases(prev => [mockPurchase, ...prev]);
      return mockPurchase;
    }
  };

  const updatePurchase = async (id: string, updates: any): Promise<Purchase> => {
    if (!isDemoMode && organization?.id) {
      const updated = await purchaseService.savePurchaseOrder(organization.id, { ...updates, id });
      setPurchases(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } else {
      let resultPurchase: Purchase | null = null;
      setPurchases(prev => prev.map(p => {
        if (p.id === id) {
          const items = updates.items ? updates.items.map((it: any, idx: number) => ({
            id: it.id || `poi-${Date.now()}-${idx}`,
            purchase_id: id,
            item_name: it.item_name,
            description: it.description || '',
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'pcs',
            rate: Number(it.rate) || 0,
            total: (Number(it.quantity) || 1) * (Number(it.rate) || 0)
          })) : p.items;

          const total = items ? items.reduce((sum: number, it: any) => sum + it.total, 0) : p.total_amount;

          const updated: Purchase = {
            ...p,
            ...updates,
            items,
            total_amount: total,
            updated_at: new Date().toISOString()
          };
          resultPurchase = updated;
          return updated;
        }
        return p;
      }));
      return resultPurchase || { ...updates, id } as Purchase;
    }
  };

  const deletePurchase = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await purchaseService.deletePurchase(id);
    }
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  // ============================================================================
  // PROJECT CRUD
  // ============================================================================
  const addProject = async (newProjectData: Omit<Project, 'id' | 'spent' | 'progress'>): Promise<Project> => {
    const budget = Number(newProjectData.budget) || 0;
    
    if (!isDemoMode && organization?.id) {
      const createdDbProject = await projectService.createProject({
        organization_id: organization.id,
        client_id: newProjectData.client_id,
        name: newProjectData.name,
        location: newProjectData.location,
        project_type: newProjectData.type,
        budget,
        contract_value: newProjectData.contract_value,
        start_date: newProjectData.startDate,
        deadline: newProjectData.deadline,
        description: newProjectData.description,
        cover_image_url: newProjectData.coverImage
      });

      const newProject: Project = {
        id: createdDbProject.id,
        organization_id: organization.id,
        client_id: createdDbProject.client_id,
        name: createdDbProject.name,
        client: createdDbProject.client?.name || newProjectData.client || 'Private Client',
        clientPhone: createdDbProject.client?.phone || newProjectData.clientPhone || '',
        location: createdDbProject.location || 'Site Location',
        city: createdDbProject.location || 'Mumbai',
        type: newProjectData.type || 'Residential',
        budget,
        spent: 0,
        progress: 0,
        status: 'On Track',
        startDate: createdDbProject.start_date || newProjectData.startDate || new Date().toISOString().split('T')[0],
        deadline: createdDbProject.deadline || newProjectData.deadline || new Date().toISOString().split('T')[0],
        coverImage: createdDbProject.cover_image_url || newProjectData.coverImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        contract_value: createdDbProject.contract_value ? Number(createdDbProject.contract_value) : newProjectData.contract_value,
        description: createdDbProject.description || newProjectData.description,
        rooms: [],
        boq_items: [],
        notes: [],
        photos: []
      };

      setProjects(prev => [newProject, ...prev]);
      setSelectedProjectId(newProject.id);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      return newProject;
    } else {
      const id = `proj-${Date.now()}`;
      const project: Project = {
        ...newProjectData,
        id,
        spent: 0,
        progress: 0,
        status: 'On Track',
        rooms: [],
        boq_items: [],
        notes: [],
        photos: []
      };

      setProjects(prev => [project, ...prev]);
      setSelectedProjectId(id);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      return project;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await projectService.updateProject(id, {
        name: updates.name,
        client_id: updates.client_id,
        location: updates.location,
        project_type: updates.type,
        budget: updates.budget,
        contract_value: updates.contract_value,
        start_date: updates.startDate,
        deadline: updates.deadline,
        progress: updates.progress,
        status: updates.status,
        description: updates.description,
        cover_image_url: updates.coverImage
      });
    }

    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await projectService.deleteProject(id);
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    setExpenses(prev => prev.filter(e => e.projectId !== id));
    setBoqItems(prev => prev.filter(b => b.project_id !== id));

    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      setCurrentPage('projects');
    }
  };

  // ============================================================================
  // ROOM CRUD
  // ============================================================================
  const addRoom = async (roomData: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> => {
    let createdRoom: Room;

    if (!isDemoMode && organization?.id) {
      createdRoom = await roomService.createRoom({
        organization_id: organization.id,
        project_id: roomData.project_id,
        name: roomData.name,
        room_type: roomData.room_type,
        budget: roomData.budget,
        progress: roomData.progress,
        notes: roomData.notes
      });
    } else {
      createdRoom = {
        ...roomData,
        id: `room-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    setProjects(prev => prev.map(p => {
      if (p.id === roomData.project_id) {
        return {
          ...p,
          rooms: [...(p.rooms || []), createdRoom]
        };
      }
      return p;
    }));

    return createdRoom;
  };

  const updateRoom = async (id: string, updates: Partial<Room>): Promise<Room> => {
    let updatedRoom: Room;

    if (!isDemoMode && organization?.id) {
      updatedRoom = await roomService.updateRoom(id, {
        name: updates.name,
        room_type: updates.room_type,
        budget: updates.budget,
        progress: updates.progress,
        notes: updates.notes
      });
    } else {
      updatedRoom = {
        ...updates,
        id,
        updated_at: new Date().toISOString()
      } as Room;
    }

    setProjects(prev => prev.map(p => {
      if (p.rooms?.some(r => r.id === id)) {
        return {
          ...p,
          rooms: p.rooms.map(r => r.id === id ? { ...r, ...updatedRoom } : r)
        };
      }
      return p;
    }));

    return updatedRoom;
  };

  const deleteRoom = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await roomService.deleteRoom(id);
    }

    setProjects(prev => prev.map(p => {
      if (p.rooms?.some(r => r.id === id)) {
        return {
          ...p,
          rooms: p.rooms.filter(r => r.id !== id)
        };
      }
      return p;
    }));

    // Update affected BOQ and expenses that had this room_id to null
    setBoqItems(prev => prev.map(b => b.room_id === id ? { ...b, room_id: undefined } : b));
    setExpenses(prev => prev.map(e => e.room_id === id ? { ...e, room_id: undefined } : e));
  };

  // ============================================================================
  // BOQ CRUD
  // ============================================================================
  const addBOQItem = async (itemData: {
    project_id: string;
    room_id?: string;
    item_name: string;
    description?: string;
    category?: string;
    quantity: number;
    unit?: string;
    rate: number;
    estimated_cost?: number;
    material_rate?: number;
    labour_rate?: number;
    selling_rate?: number;
    gst_percent?: number;
  }): Promise<BOQItem> => {
    let createdItem: BOQItem;

    if (!isDemoMode && organization?.id) {
      createdItem = await boqService.createBOQItem({
        organization_id: organization.id,
        project_id: itemData.project_id,
        room_id: itemData.room_id,
        item_name: itemData.item_name,
        description: itemData.description,
        category: itemData.category,
        quantity: itemData.quantity,
        unit: itemData.unit,
        rate: itemData.rate,
        estimated_cost: itemData.estimated_cost,
        material_rate: itemData.material_rate,
        labour_rate: itemData.labour_rate,
        selling_rate: itemData.selling_rate,
        gst_percent: itemData.gst_percent
      });
    } else {
      const qty = Number(itemData.quantity) || 0;
      const rate = Number(itemData.rate) || 0;
      createdItem = {
        id: `boq-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: itemData.project_id,
        room_id: itemData.room_id,
        item_name: itemData.item_name,
        description: itemData.description,
        category: itemData.category || 'Civil Work',
        quantity: qty,
        unit: itemData.unit || 'Nos',
        rate: rate,
        estimated_cost: itemData.estimated_cost !== undefined ? itemData.estimated_cost : qty * rate,
        material_rate: itemData.material_rate,
        labour_rate: itemData.labour_rate,
        selling_rate: itemData.selling_rate,
        gst_percent: itemData.gst_percent ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    setBoqItems(prev => [...prev, createdItem]);
    return createdItem;
  };

  const updateBOQItem = async (id: string, updates: Partial<BOQItem>): Promise<BOQItem> => {
    let updatedItem: BOQItem;

    if (!isDemoMode && organization?.id) {
      updatedItem = await boqService.updateBOQItem(id, updates);
    } else {
      const existing = boqItems.find(b => b.id === id);
      const qty = updates.quantity !== undefined ? Number(updates.quantity) : (existing?.quantity || 0);
      const rate = updates.rate !== undefined ? Number(updates.rate) : (existing?.rate || 0);
      updatedItem = {
        ...(existing || {}),
        ...updates,
        id,
        quantity: qty,
        rate: rate,
        estimated_cost: updates.estimated_cost !== undefined ? updates.estimated_cost : qty * rate,
        approved_at: undefined,
        approved_by: undefined,
        updated_at: new Date().toISOString()
      } as BOQItem;
    }

    setBoqItems(prev => prev.map(b => b.id === id ? updatedItem : b));
    return updatedItem;
  };

  const deleteBOQItem = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await boqService.deleteBOQItem(id);
    }
    setBoqItems(prev => prev.filter(b => b.id !== id));
  };

  const approveProjectBOQ = async (projectId: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      const approvedItems = await boqService.approveProjectBOQ(projectId);
      setBoqItems(prev => prev.map(item =>
        item.project_id === projectId
          ? approvedItems.find(approved => approved.id === item.id) || item
          : item
      ));
      return;
    }
    const approvedAt = new Date().toISOString();
    setBoqItems(prev => prev.map(item => item.project_id === projectId
      ? { ...item, approved_at: approvedAt, approved_by: profile?.id || 'demo-approver' }
      : item
    ));
  };

  // ============================================================================
  // EXPENSE CRUD (REAL FINANCIAL LEDGER)
  // ============================================================================
  const addExpense = async (newExpenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    let createdExpense: Expense;

    const targetProj = projects.find(p => p.id === newExpenseData.projectId);
    const projectName = targetProj ? targetProj.name : newExpenseData.projectName || 'Project';

    if (!isDemoMode && organization?.id) {
      createdExpense = await expenseService.createExpense({
        organization_id: organization.id,
        project_id: newExpenseData.projectId,
        room_id: newExpenseData.room_id,
        title: newExpenseData.title,
        category: newExpenseData.category,
        amount: Number(newExpenseData.amount),
        vendor: newExpenseData.vendor,
        expense_date: newExpenseData.date,
        payment_status: newExpenseData.paymentStatus,
        notes: newExpenseData.notes,
        receipt_url: newExpenseData.receiptUrl
      });
      createdExpense.projectName = projectName;
    } else {
      createdExpense = {
        ...newExpenseData,
        id: `exp-${Date.now()}`,
        projectName,
        amount: Number(newExpenseData.amount) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Update expense ledger in state
    setExpenses(prev => {
      const nextExpenses = [createdExpense, ...prev];

      // Update project and room totals immediately
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === createdExpense.projectId) {
          const newSpent = calculateProjectSpent(p.id, nextExpenses);
          return {
            ...p,
            spent: newSpent
          };
        }
        return p;
      }));

      return nextExpenses;
    });

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Expense Added: ${createdExpense.title}`,
        description: `₹${createdExpense.amount.toLocaleString('en-IN')} added under ${createdExpense.category} for ${projectName}.`,
        time: 'Just now',
        read: false,
        type: 'update',
        projectId: createdExpense.projectId
      },
      ...prev
    ]);

    return createdExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
    let updatedExpense: Expense;

    const targetProj = projects.find(p => p.id === (updates.projectId || selectedProjectId));
    const projectName = targetProj ? targetProj.name : updates.projectName || 'Project';

    if (!isDemoMode && organization?.id) {
      updatedExpense = await expenseService.updateExpense(id, {
        project_id: updates.projectId,
        room_id: updates.room_id,
        title: updates.title,
        category: updates.category,
        amount: updates.amount,
        vendor: updates.vendor,
        expense_date: updates.date,
        payment_status: updates.paymentStatus,
        notes: updates.notes,
        receipt_url: updates.receiptUrl
      });
      updatedExpense.projectName = projectName;
    } else {
      const existing = expenses.find(e => e.id === id);
      updatedExpense = {
        ...(existing || {}),
        ...updates,
        id,
        projectName,
        amount: updates.amount !== undefined ? Number(updates.amount) : (existing?.amount || 0),
        updated_at: new Date().toISOString()
      } as Expense;
    }

    setExpenses(prev => {
      const nextExpenses = prev.map(e => e.id === id ? updatedExpense : e);

      // Recalculate project spending totals immediately
      setProjects(prevProjects => prevProjects.map(p => {
        const newSpent = calculateProjectSpent(p.id, nextExpenses);
        return {
          ...p,
          spent: newSpent
        };
      }));

      return nextExpenses;
    });

    return updatedExpense;
  };

  const deleteExpense = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await expenseService.deleteExpense(id);
    }

    setExpenses(prev => {
      const nextExpenses = prev.filter(e => e.id !== id);

      // Recalculate project spending totals immediately
      setProjects(prevProjects => prevProjects.map(p => {
        const newSpent = calculateProjectSpent(p.id, nextExpenses);
        return {
          ...p,
          spent: newSpent
        };
      }));

      return nextExpenses;
    });
  };

  // ============================================================================
  // MATERIAL ACTIONS
  // ============================================================================
  const handleOpenMaterialModal = (open: boolean, matToEdit?: Material | null) => {
    setMaterialToEdit(matToEdit || null);
    setIsMaterialModalOpenState(open);
  };

  const handleOpenMaterialTxModal = (open: boolean, mat?: Material | null, type: 'in' | 'out' = 'in') => {
    setSelectedMaterialForTransaction(mat || null);
    setMaterialTransactionType(type);
    setIsMaterialTransactionModalOpenState(open);
  };

  const addMaterial = async (input: CreateMaterialInput): Promise<Material> => {
    if (!isDemoMode && organization?.id) {
      const { material, initialTransaction } = await materialService.createMaterial(input);
      setMaterials(prev => [...prev, material]);
      if (initialTransaction) {
        setMaterialTransactions(prev => [initialTransaction, ...prev]);
      }
      return material;
    } else {
      const newMat: Material = {
        id: `mat-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: input.project_id,
        room_id: input.room_id,
        name: input.name,
        category: input.category,
        unit: input.unit || 'pcs',
        quantity_ordered: input.quantity_ordered || 0,
        minimum_stock: input.minimum_stock || 0,
        notes: input.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMaterials(prev => [...prev, newMat]);

      if (input.initial_quantity && input.initial_quantity > 0) {
        const initialTx: MaterialTransaction = {
          id: `tx-${Date.now()}`,
          organization_id: 'demo-org',
          material_id: newMat.id,
          project_id: input.project_id,
          room_id: input.room_id,
          transaction_type: 'in',
          quantity: input.initial_quantity,
          transaction_date: new Date().toISOString().split('T')[0],
          notes: 'Initial / Opening Stock',
          created_at: new Date().toISOString()
        };
        setMaterialTransactions(prev => [initialTx, ...prev]);
      }
      return newMat;
    }
  };

  const updateMaterial = async (id: string, updates: Partial<CreateMaterialInput>): Promise<Material> => {
    if (!isDemoMode && organization?.id) {
      const updated = await materialService.updateMaterial(id, updates);
      setMaterials(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } else {
      const existing = materials.find(m => m.id === id);
      const updated: Material = {
        ...(existing || {}),
        ...updates,
        id,
        updated_at: new Date().toISOString()
      } as Material;
      setMaterials(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    }
  };

  const deleteMaterial = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await materialService.deleteMaterial(id);
    } else {
      const hasTx = materialTransactions.some(t => t.material_id === id);
      if (hasTx) {
        throw new Error('Cannot delete material with existing stock transaction history. Use Stock OUT to adjust balance.');
      }
    }
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const addMaterialTransaction = async (input: CreateMaterialTransactionInput): Promise<MaterialTransaction> => {
    if (!isDemoMode && organization?.id) {
      const newTx = await materialService.createTransaction(input);
      setMaterialTransactions(prev => [newTx, ...prev]);
      return newTx;
    } else {
      // Local stock calculation & validation
      const summary = materialService.calculateStock(input.material_id, materialTransactions, 0);
      if (input.transaction_type === 'out' && input.quantity > summary.available) {
        throw new Error(`Only ${summary.available} available. Cannot stock out ${input.quantity}.`);
      }
      const newTx: MaterialTransaction = {
        id: `tx-${Date.now()}`,
        organization_id: 'demo-org',
        material_id: input.material_id,
        project_id: input.project_id,
        room_id: input.room_id,
        transaction_type: input.transaction_type,
        quantity: input.quantity,
        transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
        notes: input.notes,
        created_at: new Date().toISOString()
      };
      setMaterialTransactions(prev => [newTx, ...prev]);
      return newTx;
    }
  };

  const recordMaterialWastage = async (input: {
    materialId: string;
    quantity: number;
    reason: string;
    wastageDate: string;
  }): Promise<MaterialWastage> => {
    const material = materials.find(item => item.id === input.materialId);
    if (!material) throw new Error('Select a material that belongs to a project in this workspace.');

    if (!isDemoMode && organization?.id) {
      const recorded = await wastageService.recordWastage(input);
      const transaction: MaterialTransaction = {
        id: recorded.material_transaction_id,
        organization_id: recorded.organization_id,
        material_id: recorded.material_id,
        project_id: recorded.project_id,
        room_id: material.room_id,
        transaction_type: 'out',
        quantity: recorded.quantity,
        transaction_date: recorded.wastage_date,
        notes: `Wastage: ${recorded.reason}`,
        created_at: recorded.created_at
      };
      setMaterialTransactions(previous => [transaction, ...previous]);
      return {
        ...recorded,
        material_name: material.name,
        material_unit: material.unit,
        recorded_by_name: profile?.full_name
      };
    }

    const stock = materialService.calculateStock(input.materialId, materialTransactions);
    if (input.quantity > stock.available) {
      throw new Error(`Only ${stock.available} ${material.unit} is available; wastage cannot exceed stock on hand.`);
    }
    if (!input.reason.trim()) throw new Error('A reason is required to record wastage.');
    const now = new Date().toISOString();
    const transaction: MaterialTransaction = {
      id: `wastage-tx-${Date.now()}`,
      organization_id: 'demo-org',
      material_id: material.id,
      project_id: material.project_id,
      room_id: material.room_id,
      transaction_type: 'out',
      quantity: input.quantity,
      transaction_date: input.wastageDate,
      notes: `Wastage: ${input.reason.trim()}`,
      created_at: now
    };
    setMaterialTransactions(previous => [transaction, ...previous]);
    return {
      id: `wastage-${Date.now()}`,
      organization_id: material.organization_id,
      project_id: material.project_id,
      material_id: material.id,
      material_name: material.name,
      material_unit: material.unit,
      material_transaction_id: transaction.id,
      quantity: input.quantity,
      reason: input.reason.trim(),
      wastage_date: input.wastageDate,
      recorded_by: profile?.id,
      recorded_by_name: profile?.full_name || 'Demo user',
      created_at: now
    };
  };

  // ============================================================================
  // MILESTONE ACTIONS
  // ============================================================================
  const handleOpenMilestoneModal = (open: boolean, msToEdit?: Milestone | null) => {
    setMilestoneToEdit(msToEdit || null);
    setIsMilestoneModalOpenState(open);
  };

  const addMilestone = async (input: CreateMilestoneInput): Promise<Milestone> => {
    if (!isDemoMode && organization?.id) {
      const created = await milestoneService.createMilestone(input);
      setMilestones(prev => [...prev, created]);
      return created;
    } else {
      let status = input.status || 'pending';
      let progress = Math.min(100, Math.max(0, input.progress ?? 0));
      if (status === 'completed') progress = 100;
      else if (progress === 100) status = 'completed';

      const newMs: Milestone = {
        id: `ms-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: input.project_id,
        title: input.title,
        description: input.description,
        start_date: input.start_date,
        due_date: input.due_date,
        status,
        progress,
        sort_order: input.sort_order || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMilestones(prev => [...prev, newMs]);
      return newMs;
    }
  };

  const updateMilestone = async (id: string, updates: Partial<CreateMilestoneInput>): Promise<Milestone> => {
    if (!isDemoMode && organization?.id) {
      const updated = await milestoneService.updateMilestone(id, updates);
      setMilestones(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    } else {
      const existing = milestones.find(m => m.id === id);
      const updated: Milestone = {
        ...(existing || {}),
        ...updates,
        id,
        updated_at: new Date().toISOString()
      } as Milestone;
      setMilestones(prev => prev.map(m => m.id === id ? updated : m));
      return updated;
    }
  };

  const deleteMilestone = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await milestoneService.deleteMilestone(id);
    }
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // ============================================================================
  // DAILY SITE UPDATES (DPR) ACTIONS
  // ============================================================================
  const handleOpenDailyUpdateModal = (open: boolean, dprToEdit?: DailyUpdate | null) => {
    setDailyUpdateToEdit(dprToEdit || null);
    setIsDailyUpdateModalOpenState(open);
  };

  const addDailyUpdate = async (input: CreateDailyUpdateInput): Promise<DailyUpdate> => {
    if (!isDemoMode && organization?.id) {
      const created = await dailyUpdateService.createDailyUpdate(input);
      setDailyUpdates(prev => [created, ...prev]);
      return created;
    } else {
      const newDpr: DailyUpdate = {
        id: `dpr-${Date.now()}`,
        organization_id: 'demo-org',
        project_id: input.project_id,
        update_date: input.update_date || new Date().toISOString().split('T')[0],
        work_completed: input.work_completed,
        work_pending: input.work_pending,
        issues: input.issues,
        next_day_tasks: input.next_day_tasks,
        workers_count: input.workers_count,
        progress: input.progress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setDailyUpdates(prev => [newDpr, ...prev]);
      return newDpr;
    }
  };

  const updateDailyUpdate = async (id: string, updates: Partial<CreateDailyUpdateInput>): Promise<DailyUpdate> => {
    if (!isDemoMode && organization?.id) {
      const updated = await dailyUpdateService.updateDailyUpdate(id, updates);
      setDailyUpdates(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    } else {
      const existing = dailyUpdates.find(d => d.id === id);
      const updated: DailyUpdate = {
        ...(existing || {}),
        ...updates,
        id,
        updated_at: new Date().toISOString()
      } as DailyUpdate;
      setDailyUpdates(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    }
  };

  const deleteDailyUpdate = async (id: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await dailyUpdateService.deleteDailyUpdate(id);
    }
    setDailyUpdates(prev => prev.filter(d => d.id !== id));
  };

  // ============================================================================
  // PROJECT PHOTO ACTIONS
  // ============================================================================
  const handleOpenUploadPhotoModal = (open: boolean, defaultDprId?: string) => {
    setDefaultPhotoDailyUpdateId(defaultDprId);
    setIsUploadPhotoModalOpenState(open);
  };

  const uploadProjectPhoto = async (
    projectId: string, 
    file: File, 
    metadata?: { title?: string; category?: any; daily_update_id?: string }
  ): Promise<ProjectPhoto> => {
    if (!isDemoMode && organization?.id) {
      const photo = await photoService.uploadPhoto({
        projectId,
        file,
        title: metadata?.title,
        category: metadata?.category,
        daily_update_id: metadata?.daily_update_id
      });
      setProjectPhotos(prev => [photo, ...prev]);
      return photo;
    } else {
      const previewUrl = URL.createObjectURL(file);
      const newPhoto: ProjectPhoto = {
        id: `photo-${Date.now()}`,
        projectId,
        daily_update_id: metadata?.daily_update_id,
        url: previewUrl,
        title: metadata?.title || file.name,
        category: metadata?.category || 'Site Progress',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: 'Demo Designer'
      };
      setProjectPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    }
  };

  const deleteProjectPhoto = async (photoId: string, storagePath?: string): Promise<void> => {
    if (!isDemoMode && organization?.id) {
      await photoService.deletePhoto(photoId, storagePath);
    }
    setProjectPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // ============================================================================
  // AUXILIARY ACTIONS
  // ============================================================================
  const addProjectNote = (projectId: string, content: string, tag: ProjectNote['tag'] = 'General') => {
    const newNote: ProjectNote = {
      id: `note-${Date.now()}`,
      projectId,
      content,
      createdAt: new Date().toISOString(),
      author: 'Studio Member',
      tag
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          notes: [newNote, ...(p.notes || [])]
        };
      }
      return p;
    }));
  };

  const addProjectPhoto = (projectId: string, photoData: Omit<ProjectPhoto, 'id' | 'projectId' | 'uploadedAt'>) => {
    const newPhoto: ProjectPhoto = {
      ...photoData,
      id: `photo-${Date.now()}`,
      projectId,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          photos: [newPhoto, ...(p.photos || [])]
        };
      }
      return p;
    }));
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `ev-${Date.now()}`
    };
    setCalendarEvents(prev => [newEvent, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const resetToDemoData = () => {
    localStorage.removeItem('apni_estate_clients');
    localStorage.removeItem('apni_estate_projects');
    localStorage.removeItem('apni_estate_expenses');
    localStorage.removeItem('apni_estate_boq_items');
    localStorage.removeItem('apni_estate_calendar');
    localStorage.removeItem('apni_estate_documents');
    localStorage.removeItem('apni_estate_notifications');
    localStorage.removeItem('apni_estate_leads');
    localStorage.removeItem('apni_estate_tasks');
    localStorage.removeItem('apni_estate_team');
    setClients(INITIAL_DEMO_CLIENTS);
    setProjects(INITIAL_PROJECTS);
    setExpenses(INITIAL_EXPENSES);
    setBoqItems(INITIAL_BOQ_ITEMS as BOQItem[]);
    setCalendarEvents(CALENDAR_EVENTS);
    setDocuments(INITIAL_DOCUMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLeads(INITIAL_LEADS);
    setTasks(INITIAL_TASKS);
    setTeamMembers(INITIAL_STAFF_MEMBERS);
    setSelectedProjectId('proj-1');
  };

  // Dynamic Attention Items derived deterministically from real project & financial data
  const attentionItems = useMemo(() => {
    return calculateNeedsAttention(projects, expenses);
  }, [projects, expenses]);

  // ============================================================================
  // COMPUTED STATS (AUTHENTICATED & ACCURATE FINANCIALS)
  // ============================================================================
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status !== 'Completed');
    const activeProjectsCount = activeProjects.length;
    const needAttentionCount = attentionItems.length;

    // Total Project Value: Sum of contract_value or budget (authoritative real values)
    const totalProjectValue = activeProjects.reduce(
      (acc, p) => acc + (p.contract_value !== undefined && p.contract_value !== null ? Number(p.contract_value) : Number(p.budget)),
      0
    );

    const totalBudget = activeProjects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
    
    // Total spent is derived authoritative sum of all expense records
    const totalSpent = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    
    // Total BOQ estimate sum
    const totalBOQEstimate = boqItems.reduce((acc, b) => acc + (Number(b.estimated_cost) || (Number(b.quantity) * Number(b.rate)) || 0), 0);

    // Remaining budget CAN be negative when over budget (Do NOT clamp to 0)
    const totalRemaining = totalBudget - totalSpent;
    const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Spending breakdown by Category
    const categorySpending = calculateCategoryBreakdown(expenses, boqItems).map(item => ({
      category: item.category,
      amount: item.spent,
      percentage: item.percentageOfTotalSpend,
      color: item.color
    })).filter(i => i.amount > 0);

    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    const selectedProject = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);

    return {
      activeProjectsCount,
      needAttentionCount,
      totalProjectValue: isDemoMode && totalProjectValue === 0 ? 18400000 : totalProjectValue,
      totalBudget: isDemoMode && totalBudget === 0 ? 12900000 : totalBudget,
      totalBOQEstimate,
      totalSpent: isDemoMode && totalSpent === 0 ? 8360000 : totalSpent,
      totalRemaining: isDemoMode && totalRemaining === 0 ? 4540000 : totalRemaining,
      spentPercentage: isDemoMode && spentPercentage === 0 ? 64.8 : spentPercentage,
      categorySpending,
      recentExpenses,
      selectedProject
    };
  }, [projects, expenses, boqItems, attentionItems, selectedProjectId, isDemoMode]);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        selectedProjectId,
        setSelectedProjectId,
        openProjectDetail,
        initialProjectDetailTab,
        globalSearch,
        setGlobalSearch,
        clients,
        leads,
        tasks,
        teamMembers,
        vendors,
        clientPayments,
        purchases,
        projects,
        expenses,
        boqItems,
        materials,
        materialTransactions,
        milestones,
        dailyUpdates,
        projectPhotos,
        attentionItems,
        calendarEvents,
        documents,
        notifications,
        loadingData,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
        isAddExpenseModalOpen,
        setIsAddExpenseModalOpen: handleOpenAddExpense,
        expenseToEdit,
        defaultExpenseProjectId,
        isBOQModalOpen,
        setIsBOQModalOpen: handleOpenBOQModal,
        boqModalProjectId,
        boqModalDefaultRoomId,
        boqItemToEdit,
        isPricingModalOpen,
        setIsPricingModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isMaterialModalOpen,
        setIsMaterialModalOpen: handleOpenMaterialModal,
        materialToEdit,
        isMaterialTransactionModalOpen,
        setIsMaterialTransactionModalOpen: handleOpenMaterialTxModal,
        selectedMaterialForTransaction,
        materialTransactionType,
        isMilestoneModalOpen,
        setIsMilestoneModalOpen: handleOpenMilestoneModal,
        milestoneToEdit,
        isDailyUpdateModalOpen,
        setIsDailyUpdateModalOpen: handleOpenDailyUpdateModal,
        dailyUpdateToEdit,
        isUploadPhotoModalOpen,
        setIsUploadPhotoModalOpen: handleOpenUploadPhotoModal,
        defaultPhotoDailyUpdateId,
        addClient,
        updateClient,
        deleteClient,
        addLead,
        updateLead,
        deleteLead,
        convertLeadToClient,
        addTask,
        updateTask,
        deleteTask,
        addDocument,
        deleteDocument,
        updateMemberRole,
        addVendor,
        updateVendor,
        deleteVendor,
        addClientPayment,
        updateClientPayment,
        deleteClientPayment,
        addPurchase,
        updatePurchase,
        deletePurchase,
        addProject,
        updateProject,
        deleteProject,
        addRoom,
        updateRoom,
        deleteRoom,
        addBOQItem,
        updateBOQItem,
        deleteBOQItem,
        approveProjectBOQ,
        addExpense,
        updateExpense,
        deleteExpense,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addMaterialTransaction,
        recordMaterialWastage,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        addDailyUpdate,
        updateDailyUpdate,
        deleteDailyUpdate,
        uploadProjectPhoto,
        deleteProjectPhoto,
        addProjectNote,
        addProjectPhoto,
        addCalendarEvent,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
        refreshData: loadRemoteData,
        stats
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
