// ==============================================================================
// APNI ESTATE INTERIORS - FINANCIAL METRICS & BUDGET ENGINE
// ==============================================================================

import { Project, Room, Expense, BOQItem, ExpenseCategory, AttentionItem } from '../types';

export type BudgetHealthStatus = 'Healthy' | 'Watch' | 'Risk' | 'Over Budget' | 'No Budget';

export interface BudgetHealthResult {
  status: BudgetHealthStatus;
  color: string;
  badgeBg: string;
  textColor: string;
  label: string;
  percentage: number;
}

export interface BudgetMetrics {
  budget: number;
  spent: number;
  remaining: number; // Can be negative when over budget
  isOverBudget: boolean;
  overBudgetAmount: number;
  utilization: number | null; // null if budget is 0
  health: BudgetHealthResult;
}

export interface CategoryFinancialMetric {
  category: ExpenseCategory;
  estimated: number; // From BOQ
  spent: number;     // From Expense Ledger
  variance: number;  // estimated - spent
  percentageOfTotalSpend: number;
  color: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Materials: '#3b82f6',     // Blue
  Labour: '#8b5cf6',        // Violet
  Furniture: '#f59e0b',     // Amber
  Electrical: '#06b6d4',    // Cyan
  Plumbing: '#10b981',      // Emerald
  Transport: '#ec4899',     // Pink
  Design: '#6366f1',        // Indigo
  'Civil Work': '#f97316',  // Orange
  Painting: '#a855f7',      // Purple
  Lighting: '#eab308',      // Yellow
  Decor: '#14b8a6',         // Teal
  Miscellaneous: '#94a3b8', // Slate
  Other: '#64748b'          // Slate
};

/**
 * Standardized Budget Health Calculator
 * Thresholds:
 * - 0%–70%: HEALTHY
 * - >70%–85%: WATCH
 * - >85%–100%: RISK
 * - >100%: OVER BUDGET
 * - budget <= 0: NO BUDGET
 */
export function getBudgetHealth(utilization: number | null, budget: number): BudgetHealthResult {
  if (budget <= 0 || utilization === null) {
    return {
      status: 'No Budget',
      color: 'bg-slate-400',
      badgeBg: 'bg-slate-100 border-slate-200',
      textColor: 'text-slate-600',
      label: 'No Budget Set',
      percentage: 0
    };
  }

  const rounded = Math.round(utilization * 100) / 100;

  if (rounded > 100) {
    return {
      status: 'Over Budget',
      color: 'bg-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200',
      textColor: 'text-rose-700',
      label: 'Over Budget',
      percentage: rounded
    };
  }

  if (rounded > 85) {
    return {
      status: 'Risk',
      color: 'bg-rose-500',
      badgeBg: 'bg-rose-50 border-rose-200',
      textColor: 'text-rose-700',
      label: 'Budget Risk',
      percentage: rounded
    };
  }

  if (rounded > 70) {
    return {
      status: 'Watch',
      color: 'bg-amber-500',
      badgeBg: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
      label: 'Watch',
      percentage: rounded
    };
  }

  return {
    status: 'Healthy',
    color: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-700',
    label: 'Healthy',
    percentage: rounded
  };
}

/**
 * Core Financial Calculation for Any Budget Entity (Project, Room, Portfolio)
 * Note: remaining = budget - spent (DO NOT CLAMP TO ZERO!)
 */
export function calculateBudgetMetrics(budget: number, spent: number): BudgetMetrics {
  const safeBudget = Number(budget) || 0;
  const safeSpent = Number(spent) || 0;
  const remaining = safeBudget - safeSpent;
  const isOverBudget = safeBudget > 0 && safeSpent > safeBudget;
  const overBudgetAmount = isOverBudget ? safeSpent - safeBudget : 0;
  const utilization = safeBudget > 0 ? (safeSpent / safeBudget) * 100 : null;
  const health = getBudgetHealth(utilization, safeBudget);

  return {
    budget: safeBudget,
    spent: safeSpent,
    remaining,
    isOverBudget,
    overBudgetAmount,
    utilization,
    health
  };
}

/**
 * Aggregate Total Actual Spending for a specific project from the expense ledger
 */
export function calculateProjectSpent(projectId: string, expenses: Expense[]): number {
  return expenses
    .filter(e => e.projectId === projectId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

/**
 * Aggregate Total Actual Spending for a specific room from the expense ledger
 */
export function calculateRoomSpent(roomId: string, expenses: Expense[]): number {
  return expenses
    .filter(e => e.room_id === roomId)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

/**
 * Aggregate Total BOQ Estimated Cost for a project
 */
export function calculateProjectBOQ(projectId: string, boqItems: BOQItem[]): number {
  return boqItems
    .filter(b => b.project_id === projectId)
    .reduce((sum, b) => sum + (Number(b.estimated_cost) || (Number(b.quantity) * Number(b.rate)) || 0), 0);
}

/**
 * Aggregate Total BOQ Estimated Cost for a room
 */
export function calculateRoomBOQ(roomId: string, boqItems: BOQItem[]): number {
  return boqItems
    .filter(b => b.room_id === roomId)
    .reduce((sum, b) => sum + (Number(b.estimated_cost) || (Number(b.quantity) * Number(b.rate)) || 0), 0);
}

/**
 * Aggregate Category Breakdown comparing BOQ Estimates vs Actual Expense Ledger
 */
export function calculateCategoryBreakdown(
  expenses: Expense[],
  boqItems: BOQItem[] = [],
  projectId?: string
): CategoryFinancialMetric[] {
  const filteredExpenses = projectId ? expenses.filter(e => e.projectId === projectId) : expenses;
  const filteredBOQ = projectId ? boqItems.filter(b => b.project_id === projectId) : boqItems;

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const categoryMap: Record<string, { estimated: number; spent: number }> = {};

  // Sum actual expenses
  filteredExpenses.forEach(e => {
    const cat = e.category || 'Miscellaneous';
    if (!categoryMap[cat]) categoryMap[cat] = { estimated: 0, spent: 0 };
    categoryMap[cat].spent += Number(e.amount) || 0;
  });

  // Sum BOQ estimates
  filteredBOQ.forEach(b => {
    const cat = b.category || 'Miscellaneous';
    if (!categoryMap[cat]) categoryMap[cat] = { estimated: 0, spent: 0 };
    const cost = Number(b.estimated_cost) || (Number(b.quantity) * Number(b.rate)) || 0;
    categoryMap[cat].estimated += cost;
  });

  return Object.entries(categoryMap)
    .map(([cat, data]) => {
      const percentageOfTotalSpend = totalSpent > 0 ? Math.round((data.spent / totalSpent) * 100) : 0;
      return {
        category: cat as ExpenseCategory,
        estimated: data.estimated,
        spent: data.spent,
        variance: data.estimated - data.spent,
        percentageOfTotalSpend,
        color: CATEGORY_COLORS[cat] || '#64748b'
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

/**
 * Generate Deterministic "Needs Your Attention" Alerts from Real Data
 */
export function calculateNeedsAttention(projects: Project[], expenses: Expense[]): AttentionItem[] {
  const alerts: AttentionItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  projects.forEach(project => {
    if (project.status === 'Completed') return;

    const spent = calculateProjectSpent(project.id, expenses);
    const metrics = calculateBudgetMetrics(project.budget, spent);

    // 1. Over Budget Alert (>100%)
    if (metrics.isOverBudget) {
      alerts.push({
        id: `over-budget-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        severity: 'red',
        title: `${project.name} is Over Budget`,
        subtitle: `Spent ₹${metrics.spent.toLocaleString('en-IN')} of ₹${metrics.budget.toLocaleString('en-IN')} budget (${metrics.utilization?.toFixed(1)}%). Over by ₹${metrics.overBudgetAmount.toLocaleString('en-IN')}.`,
        badgeText: 'Over Budget',
        type: 'budget'
      });
    }
    // 2. Budget Risk Alert (>85% to 100%)
    else if (metrics.utilization !== null && metrics.utilization > 85) {
      alerts.push({
        id: `budget-risk-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        severity: 'orange',
        title: `${project.name} Approaching Budget Cap`,
        subtitle: `Utilization has reached ${metrics.utilization.toFixed(1)}%. ₹${metrics.remaining.toLocaleString('en-IN')} cushion remaining.`,
        badgeText: 'Budget Risk',
        type: 'budget'
      });
    }

    // 3. Handover Overdue or Approaching (within 7 days)
    if (project.deadline) {
      try {
        const deadlineDate = new Date(project.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `overdue-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            severity: 'red',
            title: `${project.name} Handover Overdue`,
            subtitle: `Target handover was ${project.deadline} (${Math.abs(diffDays)} days overdue). Current progress: ${project.progress}%.`,
            badgeText: `${Math.abs(diffDays)}d Overdue`,
            type: 'schedule'
          });
        } else if (diffDays <= 7) {
          alerts.push({
            id: `deadline-soon-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            severity: 'yellow',
            title: `${project.name} Handover in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
            subtitle: `Scheduled deadline is ${project.deadline}. Progress is at ${project.progress}%.`,
            badgeText: `${diffDays}d Left`,
            type: 'schedule'
          });
        }
      } catch (e) {}
    }

    // 4. Project Delayed Status
    if (project.status === 'Delayed') {
      alerts.push({
        id: `delayed-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        severity: 'orange',
        title: `${project.name} Marked as Delayed`,
        subtitle: `Project milestone execution requires supervisor review and site acceleration.`,
        badgeText: 'Delayed',
        type: 'schedule'
      });
    }
  });

  return alerts;
}
