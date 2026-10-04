/**
 * Format numbers into Indian Rupee style formatting
 * Examples: 
 * formatINR(1800000) -> "₹18,00,000"
 * formatINRCompact(18400000) -> "₹1.84 Cr"
 * formatINRCompact(8360000) -> "₹83.6L"
 * formatINRCompact(128000) -> "₹1.28L"
 * formatINRCompact(46500) -> "₹46.5K"
 */

export function formatINR(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));
  
  const s = absAmount.toString();
  let result = '';
  
  if (s.length <= 3) {
    result = s;
  } else {
    const lastThree = s.substring(s.length - 3);
    const otherNumbers = s.substring(0, s.length - 3);
    result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  
  return (isNegative ? '-₹' : '₹') + result;
}

export function formatINRCompact(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  
  let formatted = '';
  if (abs >= 10000000) {
    // Crores (1 Cr = 1,00,00,000)
    const cr = abs / 10000000;
    formatted = `${cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.0+$/, '')} Cr`;
  } else if (abs >= 100000) {
    // Lakhs (1 L = 1,00,000)
    const l = abs / 100000;
    formatted = `${l.toFixed(l >= 10 ? 1 : 1).replace(/\.0+$/, '')}L`;
  } else if (abs >= 1000) {
    const k = abs / 1000;
    formatted = `${k.toFixed(1).replace(/\.0+$/, '')}k`;
  } else {
    formatted = abs.toString();
  }
  
  return (isNegative ? '-₹' : '₹') + formatted;
}

export function formatLakhValue(amount: number): string {
  const l = amount / 100000;
  return `₹${l.toFixed(1).replace(/\.0+$/, '')}L`;
}

export function calculateDaysRemaining(deadlineStr: string): { days: number; isOverdue: boolean; text: string } {
  try {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { days: Math.abs(diffDays), isOverdue: true, text: `${Math.abs(diffDays)} days overdue` };
    } else if (diffDays === 0) {
      return { days: 0, isOverdue: false, text: 'Due today' };
    } else {
      return { days: diffDays, isOverdue: false, text: `${diffDays} days left` };
    }
  } catch {
    return { days: 0, isOverdue: false, text: 'Date pending' };
  }
}

export function getBudgetHealth(budget: number, spent: number): {
  status: 'Healthy' | 'Watch' | 'Risk' | 'Over Budget';
  color: string;
  badgeBg: string;
  textColor: string;
  percentage: number;
} {
  if (budget <= 0) return { status: 'Healthy', color: 'bg-emerald-500', badgeBg: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', percentage: 0 };
  
  const percentage = Math.round((spent / budget) * 100);
  
  if (percentage > 100) {
    return { status: 'Over Budget', color: 'bg-rose-600', badgeBg: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700', percentage };
  }
  if (percentage >= 86) {
    return { status: 'Risk', color: 'bg-rose-500', badgeBg: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700', percentage };
  }
  if (percentage >= 71) {
    return { status: 'Watch', color: 'bg-amber-500', badgeBg: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700', percentage };
  }
  return { status: 'Healthy', color: 'bg-emerald-500', badgeBg: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', percentage };
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}
