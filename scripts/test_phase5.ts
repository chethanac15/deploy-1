// ==============================================================================
// APNI ESTATE INTERIORS - PHASE 5 AUTOMATED VERIFICATION SUITE
// ==============================================================================

import { 
  calculateBudgetMetrics, 
  getBudgetHealth, 
  calculateProjectSpent, 
  calculateRoomSpent, 
  calculateProjectBOQ, 
  calculateRoomBOQ, 
  calculateCategoryBreakdown,
  calculateNeedsAttention 
} from '../src/lib/financialMetrics';
import { Project, Room, Expense, BOQItem } from '../src/types';

console.log('====================================================');
console.log('🚀 RUNNING PHASE 5 FINANCIAL ENGINE TEST SUITE');
console.log('====================================================\n');

// 1. Core Financial Engine Unit Tests
console.log('--- 1. FINANCIAL ENGINE CALCULATIONS & OVERRUN TESTS ---');

// Test 1.1: Standard Healthy Budget
const normalMetrics = calculateBudgetMetrics(200000, 25000);
console.log('Test 1.1: Budget ₹2,00,000, Spent ₹25,000');
console.log('Remaining:', normalMetrics.remaining, '(Expected: 175000)');
console.log('Utilization:', normalMetrics.utilization, '% (Expected: 12.5)');
console.log('Health:', normalMetrics.health.status, '(Expected: Healthy)');
if (normalMetrics.remaining !== 175000 || normalMetrics.utilization !== 12.5 || normalMetrics.health.status !== 'Healthy') {
  throw new Error('Test 1.1 failed');
}
console.log('✅ PASS: Normal metrics calculated accurately.\n');

// Test 1.2: Over-Budget Scenario (Remaining MUST NOT be clamped to 0)
const overMetrics = calculateBudgetMetrics(200000, 215000);
console.log('Test 1.2: Over Budget: Budget ₹2,00,000, Spent ₹2,15,000');
console.log('Remaining:', overMetrics.remaining, '(Expected: -15000)');
console.log('Is Over Budget:', overMetrics.isOverBudget, '(Expected: true)');
console.log('Over Budget Amount:', overMetrics.overBudgetAmount, '(Expected: 15000)');
console.log('Utilization:', overMetrics.utilization, '% (Expected: 107.5)');
console.log('Health:', overMetrics.health.status, '(Expected: Over Budget)');
if (overMetrics.remaining !== -15000 || !overMetrics.isOverBudget || overMetrics.overBudgetAmount !== 15000 || overMetrics.health.status !== 'Over Budget') {
  throw new Error('Test 1.2 failed: Remaining budget was wrongly clamped or over budget was not detected!');
}
console.log('✅ PASS: Negative remaining value (-₹15,000) preserved correctly without clamping.\n');

// Test 1.3: Zero Budget Handling (Protection against NaN/Infinity)
const zeroBudgetMetrics = calculateBudgetMetrics(0, 15000);
console.log('Test 1.3: Zero Budget: Budget ₹0, Spent ₹15,000');
console.log('Utilization:', zeroBudgetMetrics.utilization, '(Expected: null)');
console.log('Health Status:', zeroBudgetMetrics.health.status, '(Expected: No Budget)');
if (zeroBudgetMetrics.utilization !== null || zeroBudgetMetrics.health.status !== 'No Budget') {
  throw new Error('Test 1.3 failed: Zero budget produced NaN or invalid health status!');
}
console.log('✅ PASS: Zero budget protected without NaN/Infinity.\n');

// Test 1.4: Budget Health Threshold Verification
console.log('Test 1.4: Health Thresholds');
const h1 = getBudgetHealth(50, 100000);  // 50% -> Healthy
const h2 = getBudgetHealth(78, 100000);  // 78% -> Watch
const h3 = getBudgetHealth(92, 100000);  // 92% -> Risk
const h4 = getBudgetHealth(105, 100000); // 105% -> Over Budget
console.log('50%:', h1.status, '| 78%:', h2.status, '| 92%:', h3.status, '| 105%:', h4.status);
if (h1.status !== 'Healthy' || h2.status !== 'Watch' || h3.status !== 'Risk' || h4.status !== 'Over Budget') {
  throw new Error('Test 1.4 failed: Health thresholds do not match standardized rules');
}
console.log('✅ PASS: Standardized health thresholds verified.\n');

// 2. Snehil Residence Scenario Simulation
console.log('--- 2. SNEHIL RESIDENCE BOQ & EXPENSE FLOW ---');

const testProject: Project = {
  id: 'proj-snehil',
  name: 'Snehil Residence',
  client: 'Snehil Pandey',
  location: 'Bandra West, Mumbai',
  city: 'Mumbai',
  type: 'Residential',
  budget: 200000,
  spent: 0,
  progress: 0,
  status: 'On Track',
  startDate: '2026-09-01',
  deadline: '2026-11-15',
  coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6'
};

const testRooms: Room[] = [
  { id: 'room-living', organization_id: 'org-1', project_id: 'proj-snehil', name: 'Living Room', budget: 70000, progress: 0 },
  { id: 'room-kitchen', organization_id: 'org-1', project_id: 'proj-snehil', name: 'Kitchen', budget: 60000, progress: 0 },
  { id: 'room-master', organization_id: 'org-1', project_id: 'proj-snehil', name: 'Master Bedroom', budget: 70000, progress: 0 }
];

// Create 3 BOQ Items
const testBOQ: BOQItem[] = [
  {
    id: 'boq-1',
    organization_id: 'org-1',
    project_id: 'proj-snehil',
    room_id: 'room-living',
    item_name: 'False Ceiling',
    category: 'Civil Work',
    quantity: 200,
    unit: 'Sq Ft',
    rate: 120,
    estimated_cost: 200 * 120 // ₹24,000
  },
  {
    id: 'boq-2',
    organization_id: 'org-1',
    project_id: 'proj-snehil',
    room_id: 'room-kitchen',
    item_name: 'Kitchen Cabinets',
    category: 'Carpentry',
    quantity: 30,
    unit: 'Running Ft',
    rate: 1500,
    estimated_cost: 30 * 1500 // ₹45,000
  },
  {
    id: 'boq-3',
    organization_id: 'org-1',
    project_id: 'proj-snehil',
    room_id: 'room-master',
    item_name: 'Wardrobe',
    category: 'Carpentry',
    quantity: 24,
    unit: 'Sq Ft',
    rate: 1250,
    estimated_cost: 24 * 1250 // ₹30,000
  }
];

const totalBOQ = calculateProjectBOQ('proj-snehil', testBOQ);
console.log('Project Total BOQ Estimate:', totalBOQ, '(Expected: 99000)');
if (totalBOQ !== 99000) throw new Error('BOQ total mismatch');
console.log('✅ PASS: Total BOQ estimate verified at ₹99,000.\n');

// 3. Expense Ledger & Recalculation Test (₹25,000)
console.log('--- 3. EXPENSE CREATION & DERIVATION TEST ---');
let testExpenses: Expense[] = [
  {
    id: 'exp-1',
    projectId: 'proj-snehil',
    projectName: 'Snehil Residence',
    room_id: 'room-living',
    title: 'Carpentry Advance',
    category: 'Carpentry',
    vendor: 'Demo Vendor',
    date: '2026-09-04',
    amount: 25000,
    paymentStatus: 'Paid'
  }
];

let pSpent = calculateProjectSpent('proj-snehil', testExpenses);
let rLivingSpent = calculateRoomSpent('room-living', testExpenses);
let pMetrics = calculateBudgetMetrics(testProject.budget, pSpent);
let rLivingMetrics = calculateBudgetMetrics(testRooms[0].budget, rLivingSpent);

console.log('Project Spent:', pSpent, '(Expected: 25000)');
console.log('Project Remaining:', pMetrics.remaining, '(Expected: 175000)');
console.log('Project Utilization:', pMetrics.utilization, '% (Expected: 12.5)');
console.log('Project Health:', pMetrics.health.status, '(Expected: Healthy)');

console.log('Living Room Spent:', rLivingSpent, '(Expected: 25000)');
console.log('Living Room Remaining:', rLivingMetrics.remaining, '(Expected: 45000)');
console.log('Living Room Utilization:', rLivingMetrics.utilization?.toFixed(2), '% (Expected: 35.71)');
console.log('Living Room Health:', rLivingMetrics.health.status, '(Expected: Healthy)');

if (pSpent !== 25000 || pMetrics.remaining !== 175000 || pMetrics.utilization !== 12.5 || rLivingSpent !== 25000 || rLivingMetrics.remaining !== 45000) {
  throw new Error('Step 3 failed');
}
console.log('✅ PASS: ₹25,000 Expense rollups verified accurately.\n');

// 4. Edit Expense Test (₹25,000 -> ₹30,000)
console.log('--- 4. EDIT EXPENSE TEST (₹25,000 -> ₹30,000) ---');
testExpenses = [
  {
    ...testExpenses[0],
    amount: 30000
  }
];

pSpent = calculateProjectSpent('proj-snehil', testExpenses);
rLivingSpent = calculateRoomSpent('room-living', testExpenses);
pMetrics = calculateBudgetMetrics(testProject.budget, pSpent);
rLivingMetrics = calculateBudgetMetrics(testRooms[0].budget, rLivingSpent);

console.log('Edited Project Spent:', pSpent, '(Expected: 30000)');
console.log('Edited Project Remaining:', pMetrics.remaining, '(Expected: 170000)');
console.log('Edited Project Utilization:', pMetrics.utilization, '% (Expected: 15)');
console.log('Edited Living Room Spent:', rLivingSpent, '(Expected: 30000)');
console.log('Edited Living Room Remaining:', rLivingMetrics.remaining, '(Expected: 40000)');
console.log('Edited Living Room Utilization:', rLivingMetrics.utilization?.toFixed(2), '% (Expected: 42.86)');

if (pSpent !== 30000 || pMetrics.remaining !== 170000 || pMetrics.utilization !== 15 || rLivingSpent !== 30000 || rLivingMetrics.remaining !== 40000) {
  throw new Error('Step 4 failed');
}
console.log('✅ PASS: ₹30,000 Expense edit and rollups verified accurately.\n');

// 5. Delete Expense & Instant Recalculation Test
console.log('--- 5. DELETE EXPENSE & RECALCULATION TEST ---');
testExpenses = [];

pSpent = calculateProjectSpent('proj-snehil', testExpenses);
rLivingSpent = calculateRoomSpent('room-living', testExpenses);
pMetrics = calculateBudgetMetrics(testProject.budget, pSpent);
rLivingMetrics = calculateBudgetMetrics(testRooms[0].budget, rLivingSpent);

console.log('Post-Deletion Project Spent:', pSpent, '(Expected: 0)');
console.log('Post-Deletion Project Remaining:', pMetrics.remaining, '(Expected: 200000)');
console.log('Post-Deletion Room Spent:', rLivingSpent, '(Expected: 0)');
console.log('Post-Deletion Room Remaining:', rLivingMetrics.remaining, '(Expected: 70000)');

if (pSpent !== 0 || pMetrics.remaining !== 200000 || rLivingSpent !== 0 || rLivingMetrics.remaining !== 70000) {
  throw new Error('Step 5 failed: Stale financial totals remained after deletion!');
}
console.log('✅ PASS: Expense deletion immediately restored all financial balances.\n');

// 6. Category Breakdown & Variance Engine Test
console.log('--- 6. CATEGORY BREAKDOWN & VARIANCE ENGINE ---');
testExpenses = [
  {
    id: 'exp-carpentry',
    projectId: 'proj-snehil',
    projectName: 'Snehil Residence',
    title: 'Carpentry Material & Labour',
    category: 'Carpentry',
    vendor: 'Wood Tech',
    date: '2026-09-04',
    amount: 50000,
    paymentStatus: 'Paid'
  }
];

const catBreakdown = calculateCategoryBreakdown(testExpenses, testBOQ, 'proj-snehil');
const carpentryCat = catBreakdown.find(c => c.category === 'Carpentry');
console.log('Carpentry BOQ Estimated:', carpentryCat?.estimated, '(Expected: 75000 [45k + 30k])');
console.log('Carpentry Actual Spent:', carpentryCat?.spent, '(Expected: 50000)');
console.log('Carpentry Variance:', carpentryCat?.variance, '(Expected: +25000)');

if (carpentryCat?.estimated !== 75000 || carpentryCat?.spent !== 50000 || carpentryCat?.variance !== 25000) {
  throw new Error('Category variance calculation mismatch');
}
console.log('✅ PASS: Category breakdown and variance engine verified.\n');

console.log('====================================================');
console.log('🎉 ALL PHASE 5 FINANCIAL ENGINE TESTS PASSED!');
console.log('====================================================');
