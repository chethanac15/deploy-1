// ==============================================================================
// APNI ESTATE INTERIORS - ENTERPRISE DATA EXPORT CENTER
// Secure CSV and JSON export for current tenant datasets with strict audit isolation
// Note: Application data export is separate from platform infrastructure backups.
// ==============================================================================

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { exportService } from '../services/exportService';
import { 
  Download, 
  FileSpreadsheet, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  FolderKanban, 
  Users, 
  UserPlus, 
  Receipt, 
  Layers, 
  Building, 
  ShoppingBag, 
  IndianRupee, 
  Package, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';

export const DataExportPage: React.FC = () => {
  const { 
    clients, 
    leads, 
    projects, 
    expenses, 
    boqItems, 
    vendors, 
    purchases, 
    clientPayments, 
    materials, 
    tasks 
  } = useApp();
  const { organization, isDemoMode } = useAuth();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const notifyDownload = (name: string) => {
    setDownloadSuccess(`Exported ${name} successfully!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const datasets = [
    {
      id: 'projects',
      title: 'Projects & Sites',
      count: projects.length,
      icon: FolderKanban,
      description: 'Project scopes, locations, status, completion rates, budgets, and contract values.',
      action: () => {
        exportService.exportProjects(projects);
        notifyDownload('Projects');
      }
    },
    {
      id: 'clients',
      title: 'Clients Directory',
      count: clients.length,
      icon: Users,
      description: 'Full client list, primary phone, email, registered site addresses, and contact notes.',
      action: () => {
        exportService.exportClients(clients);
        notifyDownload('Clients');
      }
    },
    {
      id: 'leads',
      title: 'Sales Leads Pipeline',
      count: leads.length,
      icon: UserPlus,
      description: 'Active inquiries, pipeline stages, lead sources, requirements, and estimated budgets.',
      action: () => {
        exportService.exportLeads(leads);
        notifyDownload('Leads');
      }
    },
    {
      id: 'expenses',
      title: 'Project Expenses Ledger',
      count: expenses.length,
      icon: Receipt,
      description: 'Expenditure titles, categories, amounts in INR, linked vendors, and payment dates.',
      action: () => {
        exportService.exportExpenses(expenses, projects);
        notifyDownload('Expenses');
      }
    },
    {
      id: 'boq',
      title: 'Bill of Quantities (BOQ)',
      count: boqItems.length,
      icon: Layers,
      description: 'Detailed estimation specifications, quantity takeoffs, unit rates, and totals.',
      action: () => {
        exportService.exportBOQ(boqItems, projects);
        notifyDownload('BOQ Items');
      }
    },
    {
      id: 'purchases',
      title: 'Purchase Orders (PO)',
      count: purchases.length,
      icon: ShoppingBag,
      description: 'Procurement orders, PO numbers, delivery milestones, status, and vendor commitments.',
      action: () => {
        exportService.exportPurchases(purchases);
        notifyDownload('Purchases');
      }
    },
    {
      id: 'vendors',
      title: 'Vendor Directory',
      count: vendors.length,
      icon: Building,
      description: 'Suppliers, fabricators, contractors, trade categories, phone numbers, and GSTINs.',
      action: () => {
        exportService.exportVendors(vendors);
        notifyDownload('Vendors');
      }
    },
    {
      id: 'payments',
      title: 'Client Payment Collections',
      count: clientPayments.length,
      icon: IndianRupee,
      description: 'Milestone payment schedules, received sums, payment modes, and bank UTRs.',
      action: () => {
        exportService.exportClientPayments(clientPayments);
        notifyDownload('Client Payments');
      }
    },
    {
      id: 'materials',
      title: 'Materials Inventory',
      count: materials.length,
      icon: Package,
      description: 'Stock catalog, ordered quantities, received stock, installed units, and costs.',
      action: () => {
        exportService.exportMaterials(materials, projects);
        notifyDownload('Materials');
      }
    },
    {
      id: 'tasks',
      title: 'Tasks & Deliverables',
      count: tasks.length,
      icon: CheckSquare,
      description: 'Site deliverables, assigned personnel, deadlines, priorities, and status.',
      action: () => {
        exportService.exportTasks(tasks);
        notifyDownload('Tasks');
      }
    }
  ];

  const handleFullJSONExport = () => {
    exportService.exportFullOrganizationJSON({
      organizationName: organization?.name || (isDemoMode ? 'Apni Estate Interiors' : 'My Studio'),
      clients,
      leads,
      projects,
      expenses,
      boqItems,
      vendors,
      purchases,
      clientPayments,
      materials,
      tasks
    });
    notifyDownload('Full Organization JSON');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Enterprise Data Portability
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            <span>Data Export Center</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Download your organization's business records, financial ledgers, and procurement data in RFC-compliant CSV or JSON.
          </p>
        </div>

        {/* Global JSON Export Button */}
        <button
          onClick={handleFullJSONExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer min-h-[42px]"
        >
          <Database className="w-4 h-4" />
          <span>Export All Data (JSON)</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess} Check your browser's download folder.</span>
        </div>
      )}

      {/* Important Infrastructure / Terminology Clarification Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Application Data Export vs. Infrastructure Backups:</strong> This center generates client-side CSV/JSON exports strictly for your tenant organization's records and external reporting. Database replication, automated snapshots, and physical disaster-recovery backups are managed separately at the cloud infrastructure and platform level.
        </div>
      </div>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map(dataset => {
          const Icon = dataset.icon;
          return (
            <div 
              key={dataset.id}
              className="premium-card p-5 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {dataset.count} Records
                  </span>
                </div>

                <h3 className="text-base font-bold font-display text-slate-900 mb-1">
                  {dataset.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {dataset.description}
                </p>
              </div>

              <button
                type="button"
                onClick={dataset.action}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold transition-all duration-200 cursor-pointer group"
              >
                <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                <span>Download CSV</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
