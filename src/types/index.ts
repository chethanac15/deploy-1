// ==============================================================================
// APNI ESTATE INTERIORS - CORE APPLICATION & DATABASE TYPE DEFINITIONS
// ==============================================================================

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type PlanTier = 'starter' | 'studio' | 'pro' | 'basic' | 'professional' | 'enterprise';
export type UserRole = 'owner' | 'designer' | 'supervisor' | 'admin' | 'member';

export type LeadStatus = 'New' | 'Contacted' | 'Site Visit Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
export type LeadSource = 'Website' | 'Instagram' | 'Referral' | 'Walk-in' | 'Housing Portal' | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';

export type DocumentCategory = 'Proposal' | 'Contract' | 'Moodboard' | 'Drawing' | 'Estimate' | 'Site Plan' | 'Invoice' | 'Other';

export type ProjectStatus = 'On Track' | 'Needs Attention' | 'Budget Alert' | 'Delayed' | 'Completed';
export type ProjectType = 'Residential' | 'Commercial' | 'Hospitality' | 'Retail' | 'Other';

export type ExpenseCategory = 
  | 'Materials' 
  | 'Labour' 
  | 'Furniture' 
  | 'Electrical' 
  | 'Plumbing' 
  | 'Transport' 
  | 'Design' 
  | 'Civil Work'
  | 'Carpentry'
  | 'Painting'
  | 'Lighting'
  | 'Decor'
  | 'Miscellaneous'
  | 'Other';

export type PaymentStatus = 'Paid' | 'Pending' | 'Partially Paid';
export type PhotoCategory = 'Design' | 'Site Progress' | 'Materials' | 'Completed Work';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type MaterialTransactionType = 'in' | 'out';

// ==============================================================================
// 1. MULTI-TENANT & USER SCHEMAS
// ==============================================================================

export interface Organization {
  id: string;
  name: string;
  owner_user_id?: string;
  subscription_status: SubscriptionStatus;
  trial_started_at: string;
  trial_ends_at: string;
  plan: PlanTier;
  logo_url?: string;
  gst_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  company_email?: string;
  company_phone?: string;
  website?: string;
  currency?: string;
  financial_year_start?: string;
  max_users?: number | null;
  max_active_projects?: number | null;
  max_branches?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // references auth.users(id)
  organization_id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  branch_id?: string;
  branchName?: string;
  custom_role_id?: string;
  customRoleName?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// 2. CLIENT & PROJECT ENTITIES
// ==============================================================================

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  organization_id?: string;
  daily_update_id?: string;
  url: string;
  title: string;
  category: PhotoCategory;
  uploadedAt: string;
  uploadedBy: string;
  stage?: string;
  storage_path?: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  organization_id?: string;
  content: string;
  createdAt: string;
  author: string;
  tag?: 'General' | 'Client Decision' | 'Site Update' | 'Vendor Issue';
}

export interface Project {
  id: string;
  organization_id?: string;
  client_id?: string;
  name: string;
  client: string;
  clientPhone?: string;
  location: string;
  city: string;
  type: ProjectType;
  budget: number;
  spent: number;
  progress: number; // 0 to 100
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  coverImage: string;
  contract_value?: number;
  description?: string;
  branch_id?: string;
  branchName?: string;
  categoryBudgets?: CategoryBudget[];
  notes?: ProjectNote[];
  photos?: ProjectPhoto[];
  rooms?: Room[];
  boq_items?: BOQItem[];
}

// ==============================================================================
// 3. ROOMS & BOQ SCOPE SCHEMAS
// ==============================================================================

export interface Room {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  room_type?: string;
  budget: number;
  progress: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BOQItem {
  id: string;
  organization_id: string;
  project_id: string;
  room_id?: string;
  item_name: string;
  description?: string;
  category?: string;
  quantity: number;
  unit?: string;
  rate: number;
  estimated_cost: number; // quantity * rate
  material_rate?: number;
  labour_rate?: number;
  selling_rate?: number;
  gst_percent?: number;
  approved_at?: string;
  approved_by?: string;
  actual_cost?: number;
  created_at?: string;
  updated_at?: string;
}

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'expired';

export interface QuotationLine {
  boq_item_id: string;
  item_name: string;
  description?: string;
  category?: string;
  quantity: number;
  unit: string;
  material_rate: number;
  labour_rate: number;
  cost_rate: number;
  selling_rate: number;
  gst_percent: number;
  amount: number;
  gst_amount: number;
}

export interface QuotationEvent {
  id: string;
  action: string;
  actor_name?: string;
  comment?: string;
  created_at: string;
}

export interface Quotation {
  id: string;
  organization_id: string;
  project_id: string;
  client_id?: string;
  project_name: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  quote_number: string;
  status: QuotationStatus;
  currency: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  valid_until?: string;
  terms: string;
  payment_terms: string;
  items: QuotationLine[];
  company_snapshot: Record<string, string>;
  client_snapshot: Record<string, string>;
  project_snapshot: Record<string, string>;
  share_token_hash?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  decision_at?: string;
  decision_comment?: string;
  events: QuotationEvent[];
}

export type ChangeRequestStatus =
  | 'draft'
  | 'submitted'
  | 'internal_review'
  | 'client_approval'
  | 'approved'
  | 'rejected';

export interface ChangeRequestEvent {
  id: string;
  action: string;
  actor_name?: string;
  comment?: string;
  details?: Record<string, number | string>;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  organization_id: string;
  project_id: string;
  project_name: string;
  related_boq_item_id?: string;
  title: string;
  description: string;
  requested_by: string;
  additional_quantity: number;
  unit: string;
  additional_material_cost: number;
  additional_labour_cost: number;
  selling_price: number;
  gst_percent: number;
  valid_until?: string;
  status: ChangeRequestStatus;
  decision_at?: string;
  decision_comment?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  events: ChangeRequestEvent[];
}

export interface ContractorBillEvent {
  id: string;
  action: string;
  previous_status?: string;
  new_status: string;
  actor_name: string;
  comment?: string;
  created_at: string;
}

export type ContractorBillStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';

export interface ContractorBill {
  id: string;
  organization_id: string;
  project_id: string;
  project_name: string;
  vendor_id: string;
  vendor_name: string;
  boq_item_id: string;
  boq_item_name: string;
  invoice_number: string;
  invoice_date: string;
  billed_quantity: number;
  billed_rate: number;
  amount: number;
  status: ContractorBillStatus;
  decision_comment?: string;
  expense_id?: string;
  created_by?: string;
  created_at: string;
  events: ContractorBillEvent[];
}

// ==============================================================================
// 4. FINANCIALS & EXPENSES
// ==============================================================================

export interface Expense {
  id: string;
  organization_id?: string;
  projectId: string;
  projectName: string;
  room_id?: string;
  title: string;
  category: ExpenseCategory;
  vendor: string;
  vendor_id?: string;
  date: string;
  amount: number;
  paymentStatus: PaymentStatus;
  receiptUrl?: string;
  notes?: string;
  paidAmount?: number;
  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// 5. MATERIALS & INVENTORY TRACKING
// ==============================================================================

export interface Material {
  id: string;
  organization_id: string;
  project_id: string;
  room_id?: string;
  name: string;
  category?: string;
  unit: string;
  quantity_ordered: number;
  minimum_stock: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialTransaction {
  id: string;
  organization_id: string;
  material_id: string;
  project_id: string;
  room_id?: string;
  transaction_type: MaterialTransactionType;
  quantity: number;
  transaction_date: string;
  notes?: string;
  created_at?: string;
}

export interface MaterialWastage {
  id: string;
  organization_id: string;
  project_id: string;
  material_id: string;
  material_name: string;
  material_unit: string;
  material_transaction_id: string;
  quantity: number;
  reason: string;
  wastage_date: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface ClientPortalSnapshot {
  project: {
    name: string;
    location?: string;
    project_type?: string;
    status: string;
    start_date?: string;
    deadline?: string;
    contract_value?: number;
    progress: number;
  };
  expires_at: string;
  milestones: Array<{
    title: string;
    due_date?: string;
    status: string;
    progress: number;
  }>;
  updates: Array<{
    update_date: string;
    work_completed?: string;
    next_day_tasks?: string;
    progress?: number;
  }>;
  payments: Array<{
    title: string;
    amount: number;
    paid_amount: number;
    due_date: string;
    status: string;
  }>;
  media: Array<{
    url: string;
    caption: string;
    created_at: string;
  }>;
}

export interface ClientPortalMedia {
  id: string;
  storage_path: string;
  caption: string;
  created_at: string;
  url: string;
}

// ==============================================================================
// 6. MILESTONES & DAILY SITE UPDATES (DPR)
// ==============================================================================

export interface Milestone {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  status: MilestoneStatus;
  progress: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailyUpdate {
  id: string;
  organization_id: string;
  project_id: string;
  update_date: string;
  work_completed?: string;
  work_pending?: string;
  issues?: string;
  next_day_tasks?: string;
  workers_count?: number;
  progress?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  photos?: ProjectPhoto[];
}

// ==============================================================================
// 7. CALENDAR, DOCUMENTS & NOTIFICATIONS
// ==============================================================================

export interface AttentionItem {
  id: string;
  projectId: string;
  projectName: string;
  severity: 'red' | 'orange' | 'yellow' | 'green';
  title: string;
  subtitle: string;
  badgeText: string;
  type: 'budget' | 'schedule' | 'payment' | 'delivery';
}

export interface CalendarEvent {
  id: string;
  organization_id?: string;
  title: string;
  projectId?: string;
  projectName?: string;
  date: string;
  time?: string;
  type: 'deadline' | 'meeting' | 'delivery' | 'site_visit';
  location?: string;
  completed?: boolean;
}

export interface Lead {
  id: string;
  organization_id?: string;
  name: string;
  phone?: string;
  email?: string;
  source?: LeadSource | string;
  requirement?: string;
  estimated_budget?: number;
  status: LeadStatus;
  notes?: string;
  assigned_to?: string;
  assigned_staff_name?: string;
  converted_client_id?: string;
  converted_project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  organization_id?: string;
  project_id?: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_staff_name?: string;
  due_date?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffMember {
  id: string;
  organization_id?: string;
  full_name: string;
  email?: string;
  role: UserRole | string;
  phone?: string;
  avatar_url?: string;
  branch_id?: string;
  branchName?: string;
  custom_role_id?: string;
  customRoleName?: string;
  status: 'Active' | 'Invited' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface DocumentItem {
  id: string;
  organization_id?: string;
  project_id?: string;
  projectId?: string;
  projectName?: string;
  title: string;
  category: DocumentCategory;
  type?: DocumentCategory | string;
  file_name?: string;
  file_size?: number;
  size?: string;
  file_type?: string;
  storage_path?: string;
  created_by?: string;
  created_at?: string;
  updatedAt?: string;
  fileUrl?: string;
}

export interface NotificationItem {
  id: string;
  organization_id?: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'alert' | 'update' | 'payment' | 'milestone';
  projectId?: string;
}

// ==============================================================================
// 6. P1 PROFESSIONAL SUITE ENTITIES
// ==============================================================================

export type VendorCategory = 
  | 'Materials' 
  | 'Furniture' 
  | 'Electrical' 
  | 'Plumbing' 
  | 'Civil' 
  | 'Hardware' 
  | 'Fabric' 
  | 'Lighting' 
  | 'Glass' 
  | 'Paint' 
  | 'Other';

export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  category: VendorCategory;
  gst_number?: string;
  rating?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type ClientPaymentStatus = 
  | 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' 
  | 'pending' | 'partial' | 'paid' | 'overdue';

export interface ClientPayment {
  id: string;
  organization_id: string;
  project_id: string;
  projectId?: string;
  projectName?: string;
  client_id?: string;
  clientId?: string;
  clientName?: string;
  title: string;
  milestone_name?: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  paid_date?: string;
  status: ClientPaymentStatus;
  payment_method?: string;
  paymentMethod?: string;
  payment_reference?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type PurchaseStatus = 
  | 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Delivered' | 'Cancelled'
  | 'draft' | 'ordered' | 'partially_received' | 'received' | 'delivered' | 'cancelled';

export type PurchasePaymentStatus = 
  | 'Pending' | 'Partially Paid' | 'Paid' | 'Unpaid'
  | 'pending' | 'partial' | 'paid' | 'unpaid';

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  organization_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  total?: number; // quantity * rate
  total_amount?: number;
  received_quantity?: number;
  rejected_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Purchase {
  id: string;
  organization_id: string;
  project_id: string;
  projectId?: string;
  projectName?: string;
  vendor_id: string;
  vendorName?: string;
  vendor?: Vendor;
  po_number: string;
  order_date: string;
  expected_delivery?: string;
  status: PurchaseStatus;
  payment_status: PurchasePaymentStatus;
  notes?: string;
  total_amount: number;
  items?: PurchaseItem[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoodsReceiptItem {
  id: string;
  purchase_item_id: string;
  item_name: string;
  unit: string;
  ordered_quantity: number;
  delivered_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  actual_rate?: number;
}

export interface GoodsReceipt {
  id: string;
  organization_id: string;
  project_id: string;
  purchase_id: string;
  grn_number: string;
  received_on: string;
  site_location: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  items: GoodsReceiptItem[];
}

export interface ProjectProfitabilitySummary {
  projectId: string;
  projectName: string;
  contractValue: number;
  revenueReceived: number;
  actualCost: number;
  outstandingRevenue: number;
  outstandingAgainstContract: number;
  totalScheduled: number;
  grossProfit: number;
  grossMarginPct: number;
  grossMarginPercentage: number;
  realizedCashPosition: number;
}

// ==============================================================================
// 7. MULTI-BRANCH MANAGEMENT SCHEMAS
// ==============================================================================

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  managerName?: string;
  is_active: boolean;
  project_count?: number;
  team_count?: number;
  total_contract_value?: number;
  total_expenses?: number;
  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// 8. APPROVAL WORKFLOW SCHEMAS
// ==============================================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalEntityType = 'purchase_order' | 'expense' | 'other';

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  requested_by: string;
  requesterName?: string;
  assigned_to?: string;
  assigneeName?: string;
  status: ApprovalStatus;
  title: string;
  description?: string;
  amount?: number;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewerName?: string;
  review_notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// 9. CUSTOM ROLES & ADVANCED PERMISSIONS SCHEMAS
// ==============================================================================

export type PermissionKey =
  | 'projects.view'
  | 'projects.manage'
  | 'clients.view'
  | 'clients.manage'
  | 'leads.manage'
  | 'boq.manage'
  | 'expenses.view'
  | 'expenses.manage'
  | 'payments.view'
  | 'payments.manage'
  | 'vendors.manage'
  | 'purchases.manage'
  | 'materials.manage'
  | 'tasks.manage'
  | 'documents.manage'
  | 'reports.view'
  | 'approvals.request'
  | 'approvals.review'
  | 'branches.manage'
  | 'team.manage'
  | 'settings.manage'
  | 'exports.manage';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Projects' | 'Sales' | 'Finance' | 'Procurement' | 'Site & Ops' | 'Governance' | 'Administration';
  description: string;
}

export interface CustomRole {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  permissions: PermissionKey[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomRolePermission {
  id?: string;
  organization_id: string;
  custom_role_id: string;
  permission_key: PermissionKey;
  created_at?: string;
}

// ==============================================================================
// 10. COMPANY CONFIGURATION & COMMERCIAL LIMITS
// ==============================================================================

export interface CompanySettings {
  name: string;
  company_email?: string;
  company_phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  currency: string;
  financial_year_start: string;
  logo_url?: string;
  max_users?: number | null;
  max_active_projects?: number | null;
  max_branches?: number | null;
}
