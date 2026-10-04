// ==============================================================================
// APNI ESTATE INTERIORS - PROJECT PROFITABILITY & PAYMENT METRICS ENGINE
// Pure, non-fabricated financial calculations for revenue, margins, and cash positions
// ==============================================================================

import { Project, Expense, ClientPayment, ProjectProfitabilitySummary } from '../types';

export interface PaymentScheduleMetrics {
  totalScheduled: number;
  totalReceived: number;
  scheduleOutstanding: number;
  contractOutstanding: number;
  overdueAmount: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
}

/**
 * Calculates authoritative project profitability metrics.
 * - Contract Value = project.contract_value (fallback to project.budget if unassigned)
 * - Revenue Received = sum of actual client payment paid_amount
 * - Actual Cost = sum of recorded project expenses
 * - Gross Profit = Contract Value - Actual Cost
 * - Gross Margin % = (Gross Profit / Contract Value) * 100 (guarded against zero)
 * - Realized Cash Position = Revenue Received - Actual Cost
 */
export function calculateProjectProfitability(
  project: Project,
  expenses: Expense[],
  payments: ClientPayment[]
): ProjectProfitabilitySummary {
  const projectExpenses = expenses.filter(e => e.projectId === project.id);
  const projectPayments = payments.filter(p => p.project_id === project.id);

  const contractValue = Number(project.contract_value ?? project.budget ?? 0);
  
  // Realized revenue strictly from paid amounts
  const revenueReceived = projectPayments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
  
  // Actual spending strictly from recorded project expenses (avoid double-counting POs)
  const actualCost = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  const totalScheduled = projectPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstandingRevenue = Math.max(contractValue - revenueReceived, 0);
  const grossProfit = contractValue - actualCost;
  const grossMarginPct = contractValue > 0 ? (grossProfit / contractValue) * 100 : 0;
  const realizedCashPosition = revenueReceived - actualCost;

  const roundedMargin = Math.round(grossMarginPct * 10) / 10;

  return {
    projectId: project.id,
    projectName: project.name,
    contractValue,
    revenueReceived,
    actualCost,
    outstandingRevenue,
    outstandingAgainstContract: outstandingRevenue,
    totalScheduled,
    grossProfit,
    grossMarginPct: roundedMargin,
    grossMarginPercentage: roundedMargin,
    realizedCashPosition
  };
}

/**
 * Calculates client payment scheduling and overdue metrics.
 * Overdue is dynamically derived from due_date + unpaid balance.
 */
export function calculatePaymentScheduleMetrics(
  payments: ClientPayment[],
  contractValue: number = 0
): PaymentScheduleMetrics {
  const todayStr = new Date().toISOString().split('T')[0];

  let totalScheduled = 0;
  let totalReceived = 0;
  let scheduleOutstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let pendingCount = 0;

  for (const p of payments) {
    const amount = Number(p.amount) || 0;
    const paidAmount = Number(p.paid_amount) || 0;
    const unpaidBalance = Math.max(amount - paidAmount, 0);

    totalScheduled += amount;
    totalReceived += paidAmount;
    scheduleOutstanding += unpaidBalance;

    if (unpaidBalance <= 0 && amount > 0) {
      paidCount++;
    } else {
      pendingCount++;
      const isPastDue = p.due_date && p.due_date < todayStr;
      if (isPastDue && unpaidBalance > 0) {
        overdueAmount += unpaidBalance;
        overdueCount++;
      }
    }
  }

  const contractOutstanding = Math.max(contractValue - totalReceived, 0);

  return {
    totalScheduled,
    totalReceived,
    scheduleOutstanding,
    contractOutstanding,
    overdueAmount,
    overdueCount,
    paidCount,
    pendingCount
  };
}
