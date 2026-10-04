import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Package, Plus, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BOQItem, ContractorBill, ContractorBillStatus, MaterialWastage } from '../types';
import { contractorBillService } from '../services/contractorBillService';
import { wastageService } from '../services/wastageService';
import { materialService } from '../services/materialService';
import { formatINR } from '../utils/formatters';

const BILL_STORAGE_KEY = 'apni_estate_demo_contractor_bills';
const WASTAGE_STORAGE_KEY = 'apni_estate_demo_material_wastage';
const BILL_STATUS_LABEL: Record<ContractorBillStatus, string> = {
  draft: 'Draft',
  submitted: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid'
};

function expectedCostRate(item: BOQItem): number {
  return item.material_rate !== undefined || item.labour_rate !== undefined
    ? (item.material_rate || 0) + (item.labour_rate || 0)
    : item.rate;
}

function loadDemoRows<T>(key: string): T[] {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) as T[] : [];
}

export const SiteControlsPage: React.FC = () => {
  const {
    projects, vendors, boqItems, materials, materialTransactions, selectedProjectId,
    recordMaterialWastage
  } = useApp();
  const { isDemoMode, organization, profile } = useAuth();
  const [tab, setTab] = useState<'bills' | 'wastage'>('bills');
  const [bills, setBills] = useState<ContractorBill[]>([]);
  const [wastage, setWastage] = useState<MaterialWastage[]>([]);
  const [projectId, setProjectId] = useState(selectedProjectId || projects[0]?.id || '');
  const [vendorId, setVendorId] = useState('');
  const [boqItemId, setBOQItemId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [billQuantity, setBillQuantity] = useState('1');
  const [billRate, setBillRate] = useState('');
  const [wastageMaterialId, setWastageMaterialId] = useState('');
  const [wastageQuantity, setWastageQuantity] = useState('');
  const [wastageReason, setWastageReason] = useState('');
  const [wastageDate, setWastageDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(!isDemoMode);
  const [demoBillsLoaded, setDemoBillsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const projectBOQ = boqItems.filter(item => item.project_id === projectId && Boolean(item.approved_at));
  const projectMaterials = materials.filter(item => item.project_id === projectId);
  const selectedBOQItem = projectBOQ.find(item => item.id === boqItemId);
  const selectedMaterial = projectMaterials.find(item => item.id === wastageMaterialId);
  const isReviewer = isDemoMode || ['owner', 'admin', 'supervisor'].includes(profile?.role || '');
  const canMarkPaid = isDemoMode || profile?.role === 'owner' || profile?.role === 'admin';
  const billAmount = (Number(billQuantity) || 0) * (Number(billRate) || 0);
  const baselineRate = selectedBOQItem ? expectedCostRate(selectedBOQItem) : 0;
  const billQtyAlreadyClaimed = bills
    .filter(bill => bill.boq_item_id === boqItemId && ['submitted', 'approved', 'paid'].includes(bill.status))
    .reduce((sum, bill) => sum + bill.billed_quantity, 0);
  const availableBOQQty = Math.max(0, (selectedBOQItem?.quantity || 0) - billQtyAlreadyClaimed);
  const selectedStock = selectedMaterial
    ? materialService.calculateStock(selectedMaterial.id, materialTransactions).available
    : 0;

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  useEffect(() => {
    if (isDemoMode) {
      try {
        setBills(loadDemoRows<ContractorBill>(BILL_STORAGE_KEY));
        setDemoBillsLoaded(true);
        setLoading(false);
        setError('');
      } catch (err) {
        setDemoBillsLoaded(true);
        setError(err instanceof Error ? `Could not load demo contractor bills: ${err.message}` : 'Could not load demo contractor bills.');
        setLoading(false);
      }
      return;
    }
    if (!organization?.id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    contractorBillService.getBills(organization.id)
      .then(rows => { if (active) { setBills(rows); setError(''); } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load contractor bills.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organization?.id, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      try {
        setWastage(loadDemoRows<MaterialWastage>(WASTAGE_STORAGE_KEY).filter(row => row.project_id === projectId));
        return;
      } catch (err) {
        setError(err instanceof Error ? `Could not load demo wastage records: ${err.message}` : 'Could not load demo wastage records.');
        return;
      }
    }
    if (!projectId) {
      setWastage([]);
      return;
    }
    let active = true;
    wastageService.getWastage(projectId)
      .then(rows => { if (active) setWastage(rows); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load wastage records.'); });
    return () => { active = false; };
  }, [projectId, isDemoMode]);

  useEffect(() => {
    if (!isDemoMode || !demoBillsLoaded) return;
    try {
      localStorage.setItem(BILL_STORAGE_KEY, JSON.stringify(bills));
    } catch (err) {
      setError(err instanceof Error ? `Could not save demo bills: ${err.message}` : 'Could not save demo bills.');
    }
  }, [bills, demoBillsLoaded, isDemoMode]);

  const createBill = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!organization?.id || !profile?.id || !vendorId || !selectedBOQItem) {
      setError('Select a project, vendor, and approved BOQ item before saving.');
      return;
    }
    if (!invoiceNumber.trim() || !Number.isFinite(Number(billQuantity)) || Number(billQuantity) <= 0 ||
        !Number.isFinite(Number(billRate)) || Number(billRate) <= 0) {
      setError('Enter an invoice number, positive billed quantity, and positive billed rate.');
      return;
    }
    if (Number(billQuantity) > availableBOQQty) {
      setError(`Only ${availableBOQQty} ${selectedBOQItem.unit || 'units'} remain available for billing against this BOQ item.`);
      return;
    }
    if (baselineRate <= 0 || Number(billRate) > baselineRate * 1.1) {
      setError(`Billed rate cannot exceed the BOQ cost rate (${formatINR(baselineRate)}) by more than 10%.`);
      return;
    }
    setWorking(true);
    try {
      if (isDemoMode) {
        const now = new Date().toISOString();
        const vendor = vendors.find(item => item.id === vendorId);
        const project = projects.find(item => item.id === projectId);
        const created: ContractorBill = {
          id: `demo-bill-${Date.now()}`,
          organization_id: organization.id,
          project_id: projectId,
          project_name: project?.name || '',
          vendor_id: vendorId,
          vendor_name: vendor?.name || '',
          boq_item_id: selectedBOQItem.id,
          boq_item_name: selectedBOQItem.item_name,
          invoice_number: invoiceNumber.trim(),
          invoice_date: invoiceDate,
          billed_quantity: Number(billQuantity),
          billed_rate: Number(billRate),
          amount: billAmount,
          status: 'draft',
          created_by: profile.id,
          created_at: now,
          events: [{ id: `event-${Date.now()}`, action: 'created', new_status: 'draft', actor_name: profile.full_name, created_at: now }]
        };
        setBills(current => [created, ...current]);
      } else {
        const created = await contractorBillService.createBill({
          organizationId: organization.id,
          projectId,
          vendorId,
          boqItemId: selectedBOQItem.id,
          invoiceNumber,
          invoiceDate,
          billedQuantity: Number(billQuantity),
          billedRate: Number(billRate),
          createdBy: profile.id
        });
        setBills(current => [created, ...current]);
      }
      setInvoiceNumber('');
      setNotice('Contractor bill saved as a draft. Submit it to validate BOQ quantity and rate before review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save contractor bill.');
    } finally {
      setWorking(false);
    }
  };

  const transitionBill = async (bill: ContractorBill, action: 'submit' | 'approve' | 'reject' | 'mark_paid') => {
    setWorking(true);
    setError('');
    setNotice('');
    const comment = reviewComments[bill.id] || '';
    if (action === 'reject' && !comment.trim()) {
      setWorking(false);
      setError('Add a reason before rejecting the contractor bill.');
      return;
    }
    try {
      let updated: ContractorBill;
      if (isDemoMode) {
        if (action === 'submit') {
          const item = boqItems.find(row => row.id === bill.boq_item_id);
          if (!item?.approved_at) throw new Error('Submit only against an approved BOQ item.');
          const earlier = bills.filter(row => row.id !== bill.id && row.boq_item_id === bill.boq_item_id &&
            ['submitted', 'approved', 'paid'].includes(row.status)).reduce((sum, row) => sum + row.billed_quantity, 0);
          if (earlier + bill.billed_quantity > item.quantity) throw new Error('Submitted and approved bills exceed the BOQ quantity.');
          const cap = expectedCostRate(item) * 1.1;
          if (bill.billed_rate > cap) throw new Error(`Rate exceeds the BOQ cost plus 10% tolerance (${formatINR(cap)}).`);
        }
        if ((action === 'approve' || action === 'reject') && !isReviewer) throw new Error('You do not have permission to review bills.');
        const status: ContractorBillStatus = action === 'submit' ? 'submitted'
          : action === 'approve' ? 'approved'
          : action === 'reject' ? 'rejected' : 'paid';
        const now = new Date().toISOString();
        updated = {
          ...bill,
          status,
          decision_comment: action === 'reject' ? comment.trim() : bill.decision_comment,
          events: [...bill.events, {
            id: `event-${Date.now()}`,
            action,
            previous_status: bill.status,
            new_status: status,
            actor_name: profile?.full_name || 'Demo user',
            comment: comment.trim() || undefined,
            created_at: now
          }]
        };
      } else {
        updated = await contractorBillService.transition(bill, action, comment);
      }
      setBills(current => current.map(row => row.id === bill.id ? updated : row));
      setNotice(action === 'approve'
        ? 'Bill approved and recorded in project expenses as a pending labour cost.'
        : action === 'reject' ? 'Bill rejected with the review reason saved.'
          : action === 'mark_paid' ? 'Bill marked paid and the related project expense updated.'
            : 'Bill submitted for BOQ validation and review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update contractor bill.');
    } finally {
      setWorking(false);
    }
  };

  const logWastage = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!selectedMaterial) {
      setError('Select a project material.');
      return;
    }
    const quantity = Number(wastageQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > selectedStock) {
      setError(`Enter a positive amount no greater than available stock (${selectedStock} ${selectedMaterial.unit}).`);
      return;
    }
    if (!wastageReason.trim()) {
      setError('A reason is required to record wastage.');
      return;
    }
    setWorking(true);
    try {
      const created = await recordMaterialWastage({
        materialId: selectedMaterial.id,
        quantity,
        reason: wastageReason.trim(),
        wastageDate
      });
      const row = { ...created, material_name: selectedMaterial.name, material_unit: selectedMaterial.unit };
      if (isDemoMode) {
        const allRows = [...loadDemoRows<MaterialWastage>(WASTAGE_STORAGE_KEY).filter(item => item.id !== row.id), row];
        localStorage.setItem(WASTAGE_STORAGE_KEY, JSON.stringify(allRows));
      }
      setWastage(current => [row, ...current]);
      setWastageQuantity('');
      setWastageReason('');
      setNotice('Wastage logged. The quantity was recorded as material out and deducted from stock on hand.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record material wastage.');
    } finally {
      setWorking(false);
    }
  };

  const statusClass = (status: ContractorBillStatus) => status === 'approved' || status === 'paid'
    ? 'bg-emerald-100 text-emerald-800'
    : status === 'rejected' ? 'bg-rose-100 text-rose-800'
      : status === 'submitted' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';

  return (
    <div className="space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Projects &amp; site</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Contractor bills &amp; wastage</h1>
        <p className="mt-1 text-sm text-slate-500">Validate contractor invoices against approved BOQ quantities and cost rates; record material wastage against stock.</p>
      </header>

      {(error || notice) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('bills')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${tab === 'bills' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}><FileText className="h-4 w-4" />Contractor bills</button>
        <button onClick={() => setTab('wastage')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${tab === 'wastage' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}><AlertTriangle className="h-4 w-4" />Material wastage</button>
      </div>

      {tab === 'bills' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]">
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-brand-600" /><div><h2 className="font-bold text-slate-900">Add contractor invoice</h2><p className="text-xs text-slate-500">Requires an approved BOQ item. Quantity and cost-rate limits are enforced again by the database.</p></div></div>
            <form onSubmit={createBill} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Project
                <select required value={projectId} onChange={event => { setProjectId(event.target.value); setBOQItemId(''); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">Contractor / vendor
                <select required value={vendorId} onChange={event => setVendorId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                  <option value="">Select vendor</option>{vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">Approved BOQ item
                <select required value={boqItemId} onChange={event => { setBOQItemId(event.target.value); const item = projectBOQ.find(row => row.id === event.target.value); setBillRate(item ? String(expectedCostRate(item)) : ''); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                  <option value="">Select BOQ item</option>{projectBOQ.map(item => <option key={item.id} value={item.id}>{item.item_name} ({item.quantity} {item.unit})</option>)}
                </select>
                {selectedBOQItem && <p className="mt-1 text-[11px] text-slate-500">Unclaimed quantity: {availableBOQQty} {selectedBOQItem.unit || 'units'} · Cost-rate limit: {formatINR(baselineRate * 1.1)} per unit</p>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700">Invoice number
                  <input required value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Invoice date
                  <input required type="date" value={invoiceDate} onChange={event => setInvoiceDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Quantity
                  <input required type="number" min="0.01" step="any" value={billQuantity} onChange={event => setBillQuantity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Rate per unit (₹)
                  <input required type="number" min="0.01" step="0.01" value={billRate} onChange={event => setBillRate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold text-slate-600">Invoice amount</span><strong>{formatINR(billAmount)}</strong></div>
              <button type="submit" disabled={working || loading || !projects.length || !vendors.length || !projectBOQ.length} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"><Plus className="h-4 w-4" />Save bill draft</button>
              {projectBOQ.length === 0 && <p className="text-xs text-amber-700">Approve this project's BOQ before creating contractor bills.</p>}
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">Invoice register</h2><span className="text-xs text-slate-500">{bills.length} bill{bills.length === 1 ? '' : 's'}</span></div>
            {loading ? <p className="p-5 text-sm text-slate-500">Loading contractor bills…</p> : bills.length === 0 ? <p className="p-5 text-sm text-slate-500">No contractor bills yet.</p> : (
              <ul className="divide-y divide-slate-100">
                {bills.map(bill => (
                  <li key={bill.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0"><p className="font-bold text-slate-900">{bill.invoice_number} · {formatINR(bill.amount)}</p><p className="mt-1 text-xs text-slate-500">{bill.project_name} · {bill.vendor_name} · {bill.invoice_date}</p><p className="mt-1 text-xs text-slate-600">{bill.billed_quantity} × {formatINR(bill.billed_rate)} · {bill.boq_item_name}</p></div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(bill.status)}`}>{BILL_STATUS_LABEL[bill.status]}</span>
                    </div>
                    {bill.decision_comment && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-800">{bill.decision_comment}</p>}
                    {bill.status === 'draft' && <button onClick={() => transitionBill(bill, 'submit')} disabled={working} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><ShieldCheck className="h-3.5 w-3.5" />Submit &amp; validate</button>}
                    {bill.status === 'submitted' && isReviewer && (
                      <div className="space-y-2">
                        <textarea aria-label={`Review note for ${bill.invoice_number}`} rows={2} value={reviewComments[bill.id] || ''} onChange={event => setReviewComments(current => ({ ...current, [bill.id]: event.target.value }))} placeholder="Required when rejecting; optional approval note" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                        <div className="flex gap-2"><button onClick={() => transitionBill(bill, 'approve')} disabled={working} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Approve</button><button onClick={() => transitionBill(bill, 'reject')} disabled={working} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reject</button></div>
                      </div>
                    )}
                    {bill.status === 'approved' && canMarkPaid && <button onClick={() => transitionBill(bill, 'mark_paid')} disabled={working} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50">Mark paid</button>}
                    {bill.events.length > 0 && <details className="text-xs"><summary className="cursor-pointer font-semibold text-slate-500">Audit history ({bill.events.length})</summary><ol className="mt-2 space-y-1 text-slate-600">{bill.events.map(item => <li key={item.id}>{item.actor_name} · {item.action.replace(/_/g, ' ')} · {new Date(item.created_at).toLocaleString('en-IN')}{item.comment ? ` · ${item.comment}` : ''}</li>)}</ol></details>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]">
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-amber-600" /><div><h2 className="font-bold text-slate-900">Log material wastage</h2><p className="text-xs text-slate-500">A wastage entry is an audited stock-out. Entries cannot exceed current stock.</p></div></div>
            <form onSubmit={logWastage} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Project
                <select required value={projectId} onChange={event => { setProjectId(event.target.value); setWastageMaterialId(''); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              </label>
              <label className="block text-xs font-bold text-slate-700">Material
                <select required value={wastageMaterialId} onChange={event => setWastageMaterialId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">Select material</option>{projectMaterials.map(material => { const available = materialService.calculateStock(material.id, materialTransactions).available; return <option key={material.id} value={material.id}>{material.name} · {available} {material.unit} available</option>; })}</select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700">Quantity
                  <input required type="number" min="0.01" step="any" max={selectedStock} value={wastageQuantity} onChange={event => setWastageQuantity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Date
                  <input required type="date" value={wastageDate} onChange={event => setWastageDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>
              </div>
              {selectedMaterial && <p className="text-xs text-slate-500">Available on hand: <strong>{selectedStock} {selectedMaterial.unit}</strong></p>}
              <label className="block text-xs font-bold text-slate-700">Reason / incident
                <textarea required rows={3} value={wastageReason} onChange={event => setWastageReason(event.target.value)} placeholder="e.g. Tile breakage during cutting" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal" />
              </label>
              <button type="submit" disabled={working || !selectedMaterial || !isReviewer} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"><AlertTriangle className="h-4 w-4" />Record wastage</button>
              {!isReviewer && <p className="text-xs text-amber-700">Only owners, admins, and supervisors can record material wastage.</p>}
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">Wastage history</h2><span className="text-xs text-slate-500">{wastage.length} record{wastage.length === 1 ? '' : 's'}</span></div>
            {wastage.length === 0 ? <p className="p-5 text-sm text-slate-500">No material wastage recorded for this project.</p> : (
              <ul className="divide-y divide-slate-100">{wastage.map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div><p className="font-bold text-slate-900">{item.material_name} · {item.quantity} {item.material_unit}</p><p className="mt-1 text-xs text-slate-600">{item.reason}</p><p className="mt-1 text-[11px] text-slate-400">{item.wastage_date}{item.recorded_by_name ? ` · ${item.recorded_by_name}` : ''}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">Stock deducted</span></li>)}</ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
