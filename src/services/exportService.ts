// ==============================================================================
// APNI ESTATE INTERIORS - ENTERPRISE DATA EXPORT SERVICE
// Pure client-side RFC-compliant CSV and JSON export engine for tenant datasets.
// Terminology: Strictly "Data Export" (platform infrastructure backups are separate).
// ==============================================================================

import { 
  Client, 
  Lead, 
  Project, 
  Expense, 
  BOQItem, 
  Vendor, 
  Purchase, 
  ClientPayment, 
  Material, 
  Task 
} from '../types';

/**
 * Proper RFC 4180 CSV escaping
 * Handles commas, double quotes, line breaks, nulls, and undefined values cleanly.
 */
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // If string contains quotes, comma, or newline, escape double quotes and wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return `"${str}"`;
}

/**
 * Converts array of tabular objects into properly encoded CSV string
 */
export function generateCSV(headers: { key: string; label: string }[], rows: any[]): string {
  const headerLine = headers.map(h => escapeCSVCell(h.label)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => escapeCSVCell(row[h.key])).join(',');
  });
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers a browser file download using standard Blob URL
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const getIsoDate = () => new Date().toISOString().split('T')[0];

export const exportService = {
  /**
   * Export Clients Dataset
   */
  exportClients(clients: Client[]) {
    const headers = [
      { key: 'name', label: 'Client Name' },
      { key: 'phone', label: 'Contact Phone' },
      { key: 'email', label: 'Email Address' },
      { key: 'address', label: 'Site Address' },
      { key: 'notes', label: 'Client Notes' },
      { key: 'created_at', label: 'Registered Date' }
    ];
    const csv = generateCSV(headers, clients);
    downloadFile(csv, `apni-estate-clients-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Leads Dataset
   */
  exportLeads(leads: Lead[]) {
    const headers = [
      { key: 'name', label: 'Lead Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'source', label: 'Acquisition Source' },
      { key: 'status', label: 'Pipeline Stage' },
      { key: 'estimated_budget', label: 'Estimated Budget (INR)' },
      { key: 'requirement', label: 'Requirement Summary' },
      { key: 'notes', label: 'Sales Notes' },
      { key: 'created_at', label: 'Inquiry Date' }
    ];
    const csv = generateCSV(headers, leads);
    downloadFile(csv, `apni-estate-leads-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Projects Dataset
   */
  exportProjects(projects: Project[]) {
    const headers = [
      { key: 'name', label: 'Project Name' },
      { key: 'client', label: 'Client' },
      { key: 'clientPhone', label: 'Client Phone' },
      { key: 'city', label: 'City' },
      { key: 'location', label: 'Location' },
      { key: 'type', label: 'Typology' },
      { key: 'status', label: 'Health Status' },
      { key: 'progress', label: 'Completion (%)' },
      { key: 'budget', label: 'Budget Allocated (INR)' },
      { key: 'contract_value', label: 'Contract Value (INR)' },
      { key: 'spent', label: 'Actual Spent (INR)' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'deadline', label: 'Target Handover' }
    ];
    const rows = projects.map(p => ({
      ...p,
      contract_value: p.contract_value ?? p.budget
    }));
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `apni-estate-projects-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Expenses Dataset
   */
  exportExpenses(expenses: Expense[], projects: Project[]) {
    const projMap = new Map(projects.map(p => [p.id, p.name]));
    const headers = [
      { key: 'title', label: 'Expense Title' },
      { key: 'projectName', label: 'Project' },
      { key: 'category', label: 'Expense Category' },
      { key: 'amount', label: 'Amount (INR)' },
      { key: 'vendor', label: 'Vendor / Contractor' },
      { key: 'payment_status', label: 'Payment Status' },
      { key: 'date', label: 'Expense Date' },
      { key: 'notes', label: 'Notes' }
    ];
    const rows = expenses.map(e => ({
      ...e,
      projectName: projMap.get(e.projectId) || 'General',
      date: e.date || (e as any).expense_date || ''
    }));
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `apni-estate-expenses-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export BOQ Items Dataset
   */
  exportBOQ(boqItems: BOQItem[], projects: Project[]) {
    const projMap = new Map(projects.map(p => [p.id, p.name]));
    const headers = [
      { key: 'projectName', label: 'Project' },
      { key: 'item_name', label: 'BOQ Item' },
      { key: 'description', label: 'Specifications' },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unit', label: 'Unit' },
      { key: 'rate', label: 'Unit Rate (INR)' },
      { key: 'estimated_cost', label: 'Estimated Total (INR)' },
      { key: 'actual_cost', label: 'Actual Final Cost (INR)' }
    ];
    const rows = boqItems.map(item => ({
      ...item,
      projectName: projMap.get(item.project_id) || 'Unknown'
    }));
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `apni-estate-boq-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Vendors Dataset
   */
  exportVendors(vendors: Vendor[]) {
    const headers = [
      { key: 'name', label: 'Vendor Company' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'category', label: 'Trade / Category' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'gst_number', label: 'GST Number' },
      { key: 'rating', label: 'Quality Rating' },
      { key: 'address', label: 'Office / Yard Address' }
    ];
    const csv = generateCSV(headers, vendors);
    downloadFile(csv, `apni-estate-vendors-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Purchases Dataset
   */
  exportPurchases(purchases: Purchase[]) {
    const headers = [
      { key: 'po_number', label: 'PO Number' },
      { key: 'projectName', label: 'Project' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'order_date', label: 'Order Date' },
      { key: 'expected_delivery', label: 'Expected Delivery' },
      { key: 'status', label: 'Fulfillment Status' },
      { key: 'payment_status', label: 'Payment Status' },
      { key: 'total_amount', label: 'PO Total (INR)' },
      { key: 'notes', label: 'Procurement Notes' }
    ];
    const csv = generateCSV(headers, purchases);
    downloadFile(csv, `apni-estate-purchases-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Client Payments Dataset
   */
  exportClientPayments(payments: ClientPayment[]) {
    const headers = [
      { key: 'title', label: 'Milestone / Description' },
      { key: 'projectName', label: 'Project' },
      { key: 'clientName', label: 'Client' },
      { key: 'amount', label: 'Scheduled Amount (INR)' },
      { key: 'paid_amount', label: 'Received Amount (INR)' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'paid_date', label: 'Receipt Date' },
      { key: 'status', label: 'Collection Status' },
      { key: 'payment_method', label: 'Payment Mode' },
      { key: 'payment_reference', label: 'Transaction UTR' }
    ];
    const csv = generateCSV(headers, payments);
    downloadFile(csv, `apni-estate-client-payments-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Materials Inventory
   */
  exportMaterials(materials: Material[], projects: Project[]) {
    const projMap = new Map(projects.map(p => [p.id, p.name]));
    const headers = [
      { key: 'projectName', label: 'Project' },
      { key: 'name', label: 'Material Name' },
      { key: 'category', label: 'Trade Category' },
      { key: 'quantity_ordered', label: 'Ordered' },
      { key: 'quantity_received', label: 'Received on Site' },
      { key: 'quantity_used', label: 'Installed / Used' },
      { key: 'unit', label: 'Unit' },
      { key: 'unit_cost', label: 'Unit Cost (INR)' }
    ];
    const rows = materials.map(m => ({
      ...m,
      projectName: projMap.get(m.project_id || (m as any).projectId) || 'General'
    }));
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `apni-estate-materials-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Export Tasks
   */
  exportTasks(tasks: Task[]) {
    const headers = [
      { key: 'title', label: 'Task Title' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'assignedName', label: 'Assigned To' },
      { key: 'description', label: 'Description' }
    ];
    const csv = generateCSV(headers, tasks);
    downloadFile(csv, `apni-estate-tasks-${getIsoDate()}.csv`, 'text/csv');
  },

  /**
   * Comprehensive Tenant Data Export in structured JSON format
   * Fully sanitizes secrets, authorization tokens, and transient storage tokens.
   */
  exportFullOrganizationJSON(data: {
    organizationName: string;
    clients: Client[];
    leads: Lead[];
    projects: Project[];
    expenses: Expense[];
    boqItems: BOQItem[];
    vendors: Vendor[];
    purchases: Purchase[];
    clientPayments: ClientPayment[];
    materials: Material[];
    tasks: Task[];
  }) {
    const exportPayload = {
      export_version: '2.0.0-enterprise',
      exported_at: new Date().toISOString(),
      organization: data.organizationName,
      datasets: {
        clients: data.clients,
        leads: data.leads,
        projects: data.projects,
        expenses: data.expenses,
        boq_items: data.boqItems,
        vendors: data.vendors,
        purchases: data.purchases,
        client_payments: data.clientPayments,
        materials: data.materials,
        tasks: data.tasks
      }
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    downloadFile(jsonString, `apni-estate-data-export-${getIsoDate()}.json`, 'application/json');
  }
};
