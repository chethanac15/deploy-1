import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Copy, FilePlus2, MessageCircle, Send, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ChangeRequest, ChangeRequestStatus } from '../types';
import { formatINR } from '../utils/formatters';
import { changeRequestService } from '../services/changeRequestService';

const STORAGE_KEY = 'apni_estate_change_requests';
const STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  internal_review: 'Internal review',
  client_approval: 'Client approval',
  approved: 'Approved',
  rejected: 'Rejected'
};

function dateLabel(value?: string): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
}

export const ChangeRequestsPage: React.FC = () => {
  const { projects, boqItems, selectedProjectId, setSelectedProjectId } = useApp();
  const { isDemoMode, organization, profile } = useAuth();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedBy, setRequestedBy] = useState(profile?.full_name || '');
  const [relatedBOQItemId, setRelatedBOQItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Nos');
  const [materialCost, setMaterialCost] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [gstPercent, setGstPercent] = useState('18');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(!isDemoMode);
  const [creating, setCreating] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [shareTokens, setShareTokens] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const activeProject = projects.find(project => project.id === selectedProjectId) || projects[0];
  const projectItems = activeProject ? boqItems.filter(item => item.project_id === activeProject.id) : [];
  const selectedRequest = requests.find(request => request.id === selectedId) || requests[0] || null;
  const isReviewer = isDemoMode || profile?.role === 'owner' || profile?.role === 'admin';
  const costTotal = (Number(materialCost) || 0) + (Number(labourCost) || 0);
  const sellingTotal = Number(sellingPrice) || 0;
  const profitImpact = sellingTotal - costTotal;
  const marginImpact = sellingTotal > 0 ? profitImpact / sellingTotal * 100 : 0;
  const gstAmount = sellingTotal * (Number(gstPercent) || 0) / 100;

  useEffect(() => {
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const localRequests: ChangeRequest[] = saved ? JSON.parse(saved) : [];
        setRequests(localRequests);
        setSelectedId(current => current || localRequests[0]?.id || null);
        setLoading(false);
        setError('');
      } catch (err) {
        setLoading(false);
        setError(err instanceof Error ? `Could not load demo change requests: ${err.message}` : 'Could not load demo change requests.');
      }
      return;
    }
    if (!organization?.id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    changeRequestService.getChangeRequests(organization.id)
      .then(rows => {
        if (!active) return;
        setRequests(rows);
        setSelectedId(current => current || rows[0]?.id || null);
        setError('');
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load change requests.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organization?.id, isDemoMode]);

  useEffect(() => {
    if (!isDemoMode) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch (err) {
      setError(err instanceof Error ? `Could not save demo change requests: ${err.message}` : 'Could not save demo change requests.');
    }
  }, [requests, isDemoMode]);

  const orderedRequests = useMemo(() => [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at)), [requests]);

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!activeProject) {
      setError('Create a project before submitting a change request.');
      return;
    }
    if (!title.trim() || !requestedBy.trim()) {
      setError('Request title and requester are required.');
      return;
    }
    const quantityNumber = Number(quantity);
    const taxNumber = Number(gstPercent);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0 ||
        costTotal < 0 || sellingTotal < 0 || !Number.isFinite(taxNumber) || taxNumber < 0 || taxNumber > 100) {
      setError('Check the quantity, costs, selling price, and GST percentage.');
      return;
    }
    if (validUntil && validUntil < new Date().toISOString().slice(0, 10)) {
      setError('Validity date must be today or a future date.');
      return;
    }

    setCreating(true);
    try {
      if (isDemoMode) {
        const now = new Date().toISOString();
        const request: ChangeRequest = {
          id: `demo-change-${Date.now()}`,
          organization_id: organization?.id || 'demo-org',
          project_id: activeProject.id,
          project_name: activeProject.name,
          related_boq_item_id: relatedBOQItemId || undefined,
          title: title.trim(),
          description: description.trim(),
          requested_by: requestedBy.trim(),
          additional_quantity: quantityNumber,
          unit,
          additional_material_cost: Number(materialCost) || 0,
          additional_labour_cost: Number(labourCost) || 0,
          selling_price: sellingTotal,
          gst_percent: taxNumber,
          valid_until: validUntil || undefined,
          status: 'draft',
          created_by: profile?.id,
          created_at: now,
          updated_at: now,
          events: [{ id: `event-${Date.now()}`, action: 'created', actor_name: profile?.full_name || 'Demo user', created_at: now }]
        };
        setRequests(current => [request, ...current]);
        setSelectedId(request.id);
      } else {
        if (!organization?.id || !profile?.id) throw new Error('Your organization profile is not available.');
        const request = await changeRequestService.createChangeRequest({
          organizationId: organization.id,
          projectId: activeProject.id,
          relatedBOQItemId: relatedBOQItemId || undefined,
          title,
          description,
          requestedBy,
          additionalQuantity: quantityNumber,
          unit,
          materialCost: Number(materialCost) || 0,
          labourCost: Number(labourCost) || 0,
          sellingPrice: sellingTotal,
          gstPercent: taxNumber,
          validUntil: validUntil || undefined,
          createdBy: profile.id
        });
        setRequests(current => [request, ...current]);
        setSelectedId(request.id);
      }
      setNotice('Change request created in Draft. Submit it for internal review to continue.');
      setTitle('');
      setDescription('');
      setRelatedBOQItemId('');
      setMaterialCost('');
      setLabourCost('');
      setSellingPrice('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the change request.');
    } finally {
      setCreating(false);
    }
  };

  const moveRequest = async (request: ChangeRequest, next: ChangeRequestStatus) => {
    setError('');
    setNotice('');
    setWorkingId(request.id);
    try {
      if (isDemoMode) {
        const now = new Date().toISOString();
        const updated = {
          ...request,
          status: next,
          updated_at: now,
          events: [...request.events, {
            id: `event-${Date.now()}`,
            action: next,
            actor_name: profile?.full_name || 'Demo user',
            created_at: now
          }]
        };
        setRequests(current => current.map(item => item.id === request.id ? updated : item));
        setNotice(next === 'client_approval'
          ? 'Demo change request moved to Client approval. Secure client links require a connected workspace.'
          : `Change request moved to ${STATUS_LABELS[next]}.`);
      } else {
        const { request: updated, token } = await changeRequestService.transition(request, next);
        setRequests(current => current.map(item => item.id === request.id ? updated : item));
        if (token) setShareTokens(current => ({ ...current, [request.id]: token }));
        setNotice(token
          ? 'Secure client approval link created. Copy it or send it using WhatsApp.'
          : `Change request moved to ${STATUS_LABELS[next]}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the change request.');
    } finally {
      setWorkingId(null);
    }
  };

  const shareUrl = selectedRequest && shareTokens[selectedRequest.id]
    ? `${window.location.origin}${window.location.pathname}?change=${encodeURIComponent(shareTokens[selectedRequest.id])}`
    : '';

  const copyClientLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Client change-request link copied.');
    } catch {
      setError('Could not copy the link. Your browser may require a secure connection.');
    }
  };

  const shareWhatsApp = () => {
    if (!shareUrl || !selectedRequest) return;
    const message = `Change request for ${selectedRequest.project_name}: ${selectedRequest.title}. Review and respond securely: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Projects &amp; site</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Change requests</h1>
        <p className="mt-1 text-sm text-slate-500">Price, review, and approve scope changes with an audit trail and automatic financial updates.</p>
      </header>

      {(error || notice) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <FilePlus2 className="h-5 w-5 text-brand-600" />
          <div><h2 className="font-bold text-slate-900">Create change request</h2><p className="text-xs text-slate-500">Approval adds a separate, approved line to the project BOQ and updates planned cost and contract value.</p></div>
        </div>
        {projects.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Create a project before adding a change request.</p> : (
          <form onSubmit={createRequest} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-bold text-slate-700">Project
              <select value={activeProject?.id || ''} onChange={event => setSelectedProjectId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Related BOQ item (optional)
              <select value={relatedBOQItemId} onChange={event => setRelatedBOQItemId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <option value="">Project-wide / new scope</option>
                {projectItems.map(item => <option key={item.id} value={item.id}>{item.item_name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">Requested by
              <input required value={requestedBy} onChange={event => setRequestedBy(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700 sm:col-span-2">Request title
              <input required value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Add pantry storage" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">Valid until
              <input type="date" value={validUntil} onChange={event => setValidUntil(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">Additional quantity
              <input required type="number" min="0.01" step="any" value={quantity} onChange={event => setQuantity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">Unit
              <input required value={unit} onChange={event => setUnit(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">Additional material cost (₹)
              <input required type="number" min="0" step="0.01" value={materialCost} onChange={event => setMaterialCost(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">Additional labour cost (₹)
              <input required type="number" min="0" step="0.01" value={labourCost} onChange={event => setLabourCost(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">Selling price (₹, before GST)
              <input required type="number" min="0" step="0.01" value={sellingPrice} onChange={event => setSellingPrice(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700">GST (%)
              <input required type="number" min="0" max="100" step="0.01" value={gstPercent} onChange={event => setGstPercent(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs font-bold text-slate-700 sm:col-span-2 lg:col-span-3">Description
              <textarea rows={2} value={description} onChange={event => setDescription(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span>Profit impact: <strong className={profitImpact < 0 ? 'text-rose-700' : 'text-emerald-700'}>{formatINR(profitImpact)}</strong></span>
                <span>Margin: <strong>{marginImpact.toFixed(1)}%</strong></span>
                <span>GST: <strong>{formatINR(gstAmount)}</strong></span>
              </div>
              <button type="submit" disabled={creating || loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                <FilePlus2 className="h-4 w-4" />{creating ? 'Saving…' : 'Save draft'}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4"><h2 className="font-bold text-slate-900">Request history</h2></div>
          {loading ? <p className="p-5 text-sm text-slate-500">Loading change requests…</p> : orderedRequests.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No change requests yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orderedRequests.map(request => (
                <li key={request.id}>
                  <button onClick={() => setSelectedId(request.id)} className={`w-full p-4 text-left transition hover:bg-slate-50 ${selectedRequest?.id === request.id ? 'bg-brand-50/60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{request.title}</p><p className="mt-1 truncate text-xs text-slate-500">{request.project_name}</p></div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : request.status === 'rejected' ? 'bg-rose-100 text-rose-800' : request.status === 'client_approval' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{STATUS_LABELS[request.status]}</span>
                    </div>
                    <p className="mt-2 text-xs font-extrabold text-slate-800">{formatINR(request.selling_price + request.selling_price * request.gst_percent / 100)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedRequest ? (
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">{selectedRequest.project_name}</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">{selectedRequest.title}</h2></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{STATUS_LABELS[selectedRequest.status]}</span>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{selectedRequest.description || 'No additional description.'}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Requester', selectedRequest.requested_by],
                  ['Scope', `${selectedRequest.additional_quantity} ${selectedRequest.unit}`],
                  ['Material cost', formatINR(selectedRequest.additional_material_cost)],
                  ['Labour cost', formatINR(selectedRequest.additional_labour_cost)],
                  ['Profit impact', formatINR(selectedRequest.selling_price - selectedRequest.additional_material_cost - selectedRequest.additional_labour_cost)],
                  ['GST / total', `${selectedRequest.gst_percent}% · ${formatINR(selectedRequest.selling_price * (1 + selectedRequest.gst_percent / 100))}`]
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xs font-extrabold text-slate-900">{value}</p></div>)}
              </div>
              <div className="flex flex-wrap gap-2">
                {!isDemoMode && isReviewer && selectedRequest.status === 'client_approval' && !shareTokens[selectedRequest.id] && (
                  <button onClick={() => moveRequest(selectedRequest, 'client_approval')} disabled={workingId === selectedRequest.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Create / replace client link</button>
                )}
                {isReviewer && selectedRequest.status === 'draft' && <button onClick={() => moveRequest(selectedRequest, 'submitted')} disabled={workingId === selectedRequest.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Submit for review</button>}
                {isReviewer && selectedRequest.status === 'submitted' && <button onClick={() => moveRequest(selectedRequest, 'internal_review')} disabled={workingId === selectedRequest.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><ClipboardList className="h-4 w-4" />Start internal review</button>}
                {isReviewer && selectedRequest.status === 'internal_review' && <button onClick={() => moveRequest(selectedRequest, 'client_approval')} disabled={workingId === selectedRequest.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Send to client</button>}
              </div>
              {shareUrl && selectedRequest.status === 'client_approval' && (
                <div className="flex flex-wrap gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
                  <button onClick={copyClientLink} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700"><Copy className="h-3.5 w-3.5" />Copy client link</button>
                  <button onClick={shareWhatsApp} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>
                </div>
              )}
              {selectedRequest.decision_comment && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Client response:</strong> {selectedRequest.decision_comment}</p>}
              <div className="border-t border-slate-100 pt-3">
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">Audit history</h3>
                <ol className="space-y-2">{selectedRequest.events.map(event => <li key={event.id} className="flex flex-wrap gap-x-2 text-xs text-slate-600"><strong className="text-slate-800">{event.actor_name}</strong><span>{event.action.replace(/_/g, ' ')}</span><time className="text-slate-400">{new Date(event.created_at).toLocaleString('en-IN')}</time>{event.comment && <span className="basis-full">{event.comment}</span>}{event.details && <span className="basis-full text-slate-500">{Object.entries(event.details).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${typeof value === 'number' ? formatINR(value) : value}`).join(' · ')}</span>}</li>)}</ol>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Select or create a change request to review it.</section>
        )}
      </div>
    </div>
  );
};

export const SharedChangeRequestPage: React.FC<{ token: string }> = ({ token }) => {
  const [request, setRequest] = useState<ChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    changeRequestService.getSharedChangeRequest(token)
      .then(data => { if (active) setRequest(data); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load this change request.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const respond = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const updated = await changeRequestService.respondToSharedChangeRequest(token, action, comment);
      setRequest(updated);
      setNotice(action === 'approved'
        ? 'Your approval was recorded. The project BOQ and financials have been updated.'
        : action === 'rejected' ? 'Your decision has been recorded.' : 'Your change request has been sent back for internal review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-sm text-slate-600">Loading secure change request…</div>;
  if (error && !request) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><p role="alert" className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-800 shadow-sm">{error}</p></div>;
  if (!request) return null;

  const totalCost = request.additional_material_cost + request.additional_labour_cost;
  const gst = request.selling_price * request.gst_percent / 100;
  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6">
      <article className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <header className="border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{request.project_name || 'Apni Estate project'}</p>
          <h1 className="mt-1 text-xl font-extrabold text-slate-900">Change request: {request.title}</h1>
          <p className="mt-2 text-xs text-slate-500">Requested by {request.requested_by} · Valid through {dateLabel(request.valid_until)}</p>
        </header>
        {(error || notice) && <p role={error ? 'alert' : 'status'} className={`rounded-lg p-3 text-sm ${error ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{request.description || 'No additional description.'}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['Quantity', `${request.additional_quantity} ${request.unit}`],
            ['Material cost', formatINR(request.additional_material_cost)],
            ['Labour cost', formatINR(request.additional_labour_cost)],
            ['Total added cost', formatINR(totalCost)],
            ['Selling price', formatINR(request.selling_price)],
            ['GST', `${request.gst_percent}% · ${formatINR(gst)}`],
            ['Profit impact', formatINR(request.selling_price - totalCost)],
            ['Client total', formatINR(request.selling_price + gst)]
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p></div>)}
        </div>
        <p className="rounded-xl border border-slate-200 p-3 text-xs text-slate-600">Status: <strong>{STATUS_LABELS[request.status]}</strong></p>
        {request.status === 'client_approval' && (
          <section className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
            <label className="block text-xs font-bold text-slate-700">Comment (required when requesting changes)
              <textarea rows={3} value={comment} onChange={event => setComment(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => respond('approved')} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Approve</button>
              <button onClick={() => respond('changes_requested')} disabled={submitting || !comment.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-800 disabled:opacity-50"><MessageCircle className="h-4 w-4" />Request changes</button>
              <button onClick={() => respond('rejected')} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button>
            </div>
          </section>
        )}
        {request.decision_comment && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Response:</strong> {request.decision_comment}</p>}
      </article>
    </main>
  );
};

