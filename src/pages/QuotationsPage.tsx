import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Copy,
  FileCheck2,
  FileText,
  IndianRupee,
  Mail,
  MessageCircle,
  Printer,
  Send,
  XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { quotationService } from '../services/quotationService';
import { Quotation, QuotationEvent, QuotationLine, QuotationStatus } from '../types';
import { formatINR } from '../utils/formatters';

const DEFAULT_TERMS = 'This quotation is subject to final site measurements and written approval.';
const DEFAULT_PAYMENT_TERMS = 'Payment schedule to be agreed before work commencement.';
const LOCAL_QUOTES_KEY = 'apni_estate_quotations';

const statusLabels: Record<QuotationStatus, string> = {
  draft: 'Draft',
  sent: 'Awaiting response',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
  expired: 'Expired'
};

function dateLabel(value?: string): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
}

function makeQuoteLines(items: ReturnType<typeof useApp>['boqItems'], projectId: string): QuotationLine[] {
  return items.filter(item => item.project_id === projectId).map(item => {
    const materialRate = Number(item.material_rate ?? item.rate) || 0;
    const labourRate = Number(item.labour_rate) || 0;
    const costRate = materialRate + labourRate;
    const sellingRate = Number(item.selling_rate ?? item.rate) || 0;
    const gstPercent = Math.min(100, Math.max(0, Number(item.gst_percent) || 0));
    const amount = Number(item.quantity) * sellingRate;
    return {
      boq_item_id: item.id,
      item_name: item.item_name,
      description: item.description || '',
      category: item.category || '',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'Nos',
      material_rate: materialRate,
      labour_rate: labourRate,
      cost_rate: costRate,
      selling_rate: sellingRate,
      gst_percent: gstPercent,
      amount,
      gst_amount: amount * gstPercent / 100
    };
  });
}

function totals(quotation: Pick<Quotation, 'subtotal' | 'gst_amount' | 'total'>) {
  return [
    ['Subtotal', formatINR(quotation.subtotal)],
    ['GST', formatINR(quotation.gst_amount)],
    ['Grand total', formatINR(quotation.total)]
  ];
}

export const QuotationsPage: React.FC = () => {
  const { projects, clients, boqItems, selectedProjectId, setSelectedProjectId, openProjectDetail } = useApp();
  const { organization, profile, isDemoMode } = useAuth();
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().slice(0, 10);
  });
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [loading, setLoading] = useState(!isDemoMode);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [shareTokens, setShareTokens] = useState<Record<string, string>>({});

  const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0];
  const selectedQuote = quotes.find(quote => quote.id === selectedId) || quotes[0] || null;
  const pendingCount = quotes.filter(quote => quote.status === 'sent').length;
  const itemsForProject = selectedProject ? boqItems.filter(item => item.project_id === selectedProject.id) : [];
  const allBOQApproved = itemsForProject.length > 0 && itemsForProject.every(item => Boolean(item.approved_at));

  useEffect(() => {
    if (!isDemoMode) {
      if (!organization?.id) {
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      quotationService.getQuotations(organization.id)
        .then(data => {
          if (!active) return;
          setQuotes(data);
          setSelectedId(current => current || data[0]?.id || null);
          setError('');
        })
        .catch(err => {
          if (active) setError(err instanceof Error ? err.message : 'Could not load quotations.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }

    try {
      const stored = localStorage.getItem(LOCAL_QUOTES_KEY);
      const localQuotes: Quotation[] = stored ? JSON.parse(stored) : [];
      setQuotes(localQuotes);
      setSelectedId(current => current || localQuotes[0]?.id || null);
      setLoading(false);
      setError('');
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? `Could not load saved demo quotations: ${err.message}` : 'Could not load saved demo quotations.');
    }
  }, [organization?.id, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      try {
        localStorage.setItem(LOCAL_QUOTES_KEY, JSON.stringify(quotes));
      } catch (err) {
        setError(err instanceof Error ? `Could not save demo quotations: ${err.message}` : 'Could not save demo quotations.');
      }
    }
  }, [quotes, isDemoMode]);

  const orderedQuotes = useMemo(
    () => [...quotes].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [quotes]
  );

  const createQuotation = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!selectedProject) {
      setError('Create or select a project before preparing a quotation.');
      return;
    }
    if (!itemsForProject.length) {
      setError('Add BOQ items to this project before creating a quotation.');
      return;
    }
    if (!allBOQApproved) {
      setError('Approve every BOQ item from the project BOQ tab before creating a quotation.');
      openProjectDetail(selectedProject.id, 'BOQ');
      return;
    }
    if (validUntil && validUntil < new Date().toISOString().slice(0, 10)) {
      setError('Quotation validity must be today or a future date.');
      return;
    }

    const lines = makeQuoteLines(boqItems, selectedProject.id);
    if (lines.some(item => !Number.isFinite(item.amount) || item.quantity <= 0 || item.selling_rate <= 0)) {
      setError('Every BOQ item needs a positive quantity and selling rate.');
      return;
    }

    const client = clients.find(item => item.id === selectedProject.client_id);
    const clientName = client?.name || selectedProject.client || 'Client';
    const clientSnapshot = {
      name: clientName,
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || selectedProject.location || ''
    };
    const projectLocation = selectedProject.city &&
      !selectedProject.location.toLocaleLowerCase().includes(selectedProject.city.toLocaleLowerCase())
      ? [selectedProject.location, selectedProject.city].filter(Boolean).join(', ')
      : selectedProject.location;
    const companySnapshot = {
      name: organization?.name || 'Apni Estate',
      email: organization?.company_email || '',
      phone: organization?.company_phone || '',
      gst_number: organization?.gst_number || '',
      address: organization?.address || '',
      city: organization?.city || '',
      state: organization?.state || '',
      pincode: organization?.pincode || '',
      website: organization?.website || '',
      contact_name: profile?.full_name || ''
    };
    const projectSnapshot = {
      name: selectedProject.name,
      location: projectLocation,
      description: selectedProject.description || ''
    };
    const subtotal = lines.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = lines.reduce((sum, item) => sum + item.gst_amount, 0);
    const now = new Date().toISOString();
    setCreating(true);
    try {
      if (isDemoMode) {
        const quote: Quotation = {
          id: `demo-quote-${Date.now()}`,
          organization_id: organization?.id || 'demo-org',
          project_id: selectedProject.id,
          client_id: client?.id,
          project_name: selectedProject.name,
          client_name: clientName,
          client_email: clientSnapshot.email,
          client_phone: clientSnapshot.phone,
          quote_number: `AE-DEMO-${String(quotes.length + 1).padStart(4, '0')}`,
          status: 'draft',
          currency: 'INR',
          subtotal,
          gst_amount: gstAmount,
          total: subtotal + gstAmount,
          valid_until: validUntil || undefined,
          terms,
          payment_terms: paymentTerms,
          items: lines,
          company_snapshot: companySnapshot,
          client_snapshot: clientSnapshot,
          project_snapshot: projectSnapshot,
          created_by: profile?.id,
          created_at: now,
          updated_at: now,
          events: [{
            id: `event-${Date.now()}`,
            action: 'created',
            actor_name: profile?.full_name || 'Demo user',
            created_at: now
          }]
        };
        setQuotes(current => [quote, ...current]);
        setSelectedId(quote.id);
      } else {
        if (!organization?.id) throw new Error('Your organization workspace is not available.');
        const quote = await quotationService.createQuotation({
          organizationId: organization.id,
          projectId: selectedProject.id,
          clientId: client?.id,
          clientName,
          clientEmail: clientSnapshot.email,
          clientPhone: clientSnapshot.phone,
          projectName: selectedProject.name,
          projectLocation: projectSnapshot.location,
          companySnapshot,
          clientSnapshot,
          projectSnapshot,
          items: lines,
          validUntil: validUntil || undefined,
          terms,
          paymentTerms,
          createdBy: profile?.id
        });
        setQuotes(current => [quote, ...current]);
        setSelectedId(quote.id);
      }
      setNotice('Quotation created with a snapshot of the current BOQ.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the quotation.');
    } finally {
      setCreating(false);
    }
  };

  const sendQuotation = async (quote: Quotation) => {
    setError('');
    setNotice('');
    setSendingId(quote.id);
    try {
      if (isDemoMode) {
        const now = new Date().toISOString();
        const updated = {
          ...quote,
          status: 'sent' as const,
          sent_at: now,
          updated_at: now,
          events: [...quote.events, {
            id: `event-${Date.now()}`,
            action: 'sent',
            actor_name: profile?.full_name || 'Demo user',
            created_at: now
          }]
        };
        setQuotes(current => current.map(item => item.id === quote.id ? updated : item));
        setNotice('Demo quotation marked as sent. Public client links require a configured Supabase project.');
      } else {
        const { quote: updated, token } = await quotationService.sendQuotation(quote);
        setQuotes(current => current.map(item => item.id === quote.id ? updated : item));
        setShareTokens(current => ({ ...current, [quote.id]: token }));
        setNotice('Secure client approval link created. Copy it or share it by WhatsApp or email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the quotation.');
    } finally {
      setSendingId(null);
    }
  };

  const renewShareLink = async (quote: Quotation) => {
    setError('');
    setNotice('');
    setSendingId(quote.id);
    try {
      const token = await quotationService.renewShareLink(quote);
      setShareTokens(current => ({ ...current, [quote.id]: token }));
      setNotice('A new secure client link is ready. The previous link is no longer valid.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a new client link.');
    } finally {
      setSendingId(null);
    }
  };

  const shareUrl = selectedQuote && shareTokens[selectedQuote.id]
    ? `${window.location.origin}${window.location.pathname}?quote=${encodeURIComponent(shareTokens[selectedQuote.id])}`
    : '';

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Secure quotation link copied.');
    } catch {
      setError('Could not copy the link. Your browser may require a secure connection.');
    }
  };

  const sendViaWhatsApp = () => {
    if (!selectedQuote || !shareUrl) return;
    const message = `Quotation ${selectedQuote.quote_number} for ${selectedQuote.project_name}: ${formatINR(selectedQuote.total)}. Review and respond securely: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const sendViaEmail = () => {
    if (!selectedQuote || !shareUrl) return;
    const subject = `Quotation ${selectedQuote.quote_number} — ${selectedQuote.project_name}`;
    const body = `Hello ${selectedQuote.client_name},\n\nPlease review quotation ${selectedQuote.quote_number} for ${formatINR(selectedQuote.total)} using the secure link below:\n${shareUrl}\n\nRegards,\n${selectedQuote.company_snapshot.name || 'Apni Estate'}`;
    window.location.href = `mailto:${encodeURIComponent(selectedQuote.client_email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const updateDemoDecision = (action: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedQuote || !isDemoMode) return;
    const now = new Date().toISOString();
    const updated: Quotation = {
      ...selectedQuote,
      status: action,
      decision_at: now,
      updated_at: now,
      decision_comment: 'Recorded in local demo mode.',
      events: [...selectedQuote.events, {
        id: `event-${Date.now()}`,
        action,
        actor_name: 'Demo client',
        comment: 'Recorded in local demo mode.',
        created_at: now
      }]
    };
    setQuotes(current => current.map(item => item.id === selectedQuote.id ? updated : item));
    setNotice(`Quotation marked ${statusLabels[action].toLowerCase()} in demo mode.`);
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Sales &amp; CRM</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Quotations</h1>
          <p className="mt-1 text-sm text-slate-500">Create a client-ready quote from a project BOQ and track the decision.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <Clock3 className="h-4 w-4" /> {pendingCount} awaiting response
        </div>
      </header>

      {(error || notice) && (
        <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error || notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-brand-600" />
          <div>
            <h2 className="font-bold text-slate-900">Prepare from project BOQ</h2>
            <p className="text-xs text-slate-500">Prices and scope are snapshotted; later BOQ edits do not rewrite sent quotations.</p>
          </div>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Create a project and add its BOQ items to get started.</p>
        ) : (
          <form onSubmit={createQuotation} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">
              Project
              <select value={selectedProject?.id || ''} onChange={event => setSelectedProjectId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none">
                {projects.map(project => <option key={project.id} value={project.id}>{project.name} · {project.client}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">
              Valid until
              <input type="date" value={validUntil} onChange={event => setValidUntil(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:outline-none" />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Terms and conditions
              <textarea rows={2} value={terms} onChange={event => setTerms(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal focus:border-brand-500 focus:bg-white focus:outline-none" />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Payment terms
              <textarea rows={2} value={paymentTerms} onChange={event => setPaymentTerms(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal focus:border-brand-500 focus:bg-white focus:outline-none" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-500">{itemsForProject.length} BOQ line{itemsForProject.length === 1 ? '' : 's'} available · GST calculated per line</p>
                {itemsForProject.length > 0 && !allBOQApproved && (
                  <button type="button" onClick={() => selectedProject && openProjectDetail(selectedProject.id, 'BOQ')}
                    className="text-left text-xs font-bold text-amber-700 underline decoration-amber-300 underline-offset-2">
                    Approve the project BOQ before quoting
                  </button>
                )}
              </div>
              <button type="submit" disabled={creating || loading || !allBOQApproved}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
                <FileText className="h-4 w-4" /> {creating ? 'Creating…' : 'Create quotation'}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <h2 className="font-bold text-slate-900">Quotation history</h2>
          </div>
          {loading ? <p className="p-5 text-sm text-slate-500">Loading quotations…</p> : orderedQuotes.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No quotations yet. Create one from a project BOQ above.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {orderedQuotes.map(quote => (
                <li key={quote.id}>
                  <button onClick={() => setSelectedId(quote.id)}
                    className={`w-full p-4 text-left transition hover:bg-slate-50 ${selectedQuote?.id === quote.id ? 'bg-brand-50/60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{quote.quote_number}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{quote.project_name} · {quote.client_name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${quote.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : quote.status === 'rejected' ? 'bg-rose-100 text-rose-800' : quote.status === 'sent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-slate-800">{formatINR(quote.total)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedQuote ? (
          <section id="quotation-print" className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">Quotation</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-900">{selectedQuote.quote_number}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <Printer className="h-4 w-4" /> PDF / Print
                </button>
                {selectedQuote.status === 'draft' && (
                  <button onClick={() => sendQuotation(selectedQuote)} disabled={sendingId === selectedQuote.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                    <Send className="h-4 w-4" /> {sendingId === selectedQuote.id ? 'Sending…' : 'Send for approval'}
                  </button>
                )}
                {!isDemoMode && selectedQuote.status === 'sent' && !shareTokens[selectedQuote.id] && (
                  <button onClick={() => renewShareLink(selectedQuote)} disabled={sendingId === selectedQuote.id}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                    <Send className="h-4 w-4" /> {sendingId === selectedQuote.id ? 'Creating…' : 'Create / replace client link'}
                  </button>
                )}
                {isDemoMode && selectedQuote.status === 'sent' && (
                  <>
                    <button onClick={() => updateDemoDecision('approved')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                    <button onClick={() => updateDemoDecision('changes_requested')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800"><MessageCircle className="h-4 w-4" /> Request changes</button>
                    <button onClick={() => updateDemoDecision('rejected')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"><XCircle className="h-4 w-4" /> Reject</button>
                  </>
                )}
              </div>
            </div>
            {shareUrl && selectedQuote.status === 'sent' && (
              <div className="no-print mx-4 mt-4 flex flex-wrap gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3 sm:mx-5">
                <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"><Copy className="h-3.5 w-3.5" /> Copy client link</button>
                <button onClick={sendViaWhatsApp} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>
                <button onClick={sendViaEmail} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"><Mail className="h-3.5 w-3.5" /> Email</button>
              </div>
            )}
            <article className="space-y-5 p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedQuote.company_snapshot.name || 'Apni Estate'}</h3>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-500">
                    {[selectedQuote.company_snapshot.address, selectedQuote.company_snapshot.city, selectedQuote.company_snapshot.state, selectedQuote.company_snapshot.pincode].filter(Boolean).join(', ')}
                    {selectedQuote.company_snapshot.phone ? `\n${selectedQuote.company_snapshot.phone}` : ''}
                    {selectedQuote.company_snapshot.email ? ` · ${selectedQuote.company_snapshot.email}` : ''}
                    {selectedQuote.company_snapshot.gst_number ? `\nGSTIN: ${selectedQuote.company_snapshot.gst_number}` : ''}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</p>
                  <p className="mt-1 text-sm font-extrabold text-brand-700">{statusLabels[selectedQuote.status]}</p>
                  <p className="mt-1 text-xs text-slate-500">Valid through {dateLabel(selectedQuote.valid_until)}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Prepared for</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selectedQuote.client_snapshot.name || selectedQuote.client_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedQuote.client_snapshot.address}</p>
                  <p className="text-xs text-slate-500">{selectedQuote.client_snapshot.email} {selectedQuote.client_snapshot.phone && `· ${selectedQuote.client_snapshot.phone}`}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Project</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selectedQuote.project_snapshot.name || selectedQuote.project_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedQuote.project_snapshot.location}</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Scope item</th><th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">GST</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuote.items.map((item, index) => (
                      <tr key={`${item.boq_item_id}-${index}`}>
                        <td className="px-3 py-3"><p className="font-bold text-slate-800">{item.item_name}</p><p className="mt-0.5 text-[10px] text-slate-500">{item.description || item.category}</p></td>
                        <td className="px-3 py-3 text-right text-slate-600">{item.quantity} {item.unit}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{formatINR(item.selling_rate)}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{item.gst_percent}%</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-800">{formatINR(item.amount + item.gst_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ml-auto max-w-xs space-y-2">
                {totals(selectedQuote).map(([label, value], index) => (
                  <div key={label} className={`flex justify-between gap-5 ${index === 2 ? 'border-t border-slate-200 pt-2 text-base font-black text-slate-900' : 'text-xs text-slate-600'}`}>
                    <span>{label}</span><span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div><h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Terms &amp; conditions</h4><p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{selectedQuote.terms || '—'}</p></div>
                <div><h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Payment terms</h4><p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{selectedQuote.payment_terms || '—'}</p></div>
              </div>
              {selectedQuote.decision_comment && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <strong>Client comment:</strong> {selectedQuote.decision_comment}
                </div>
              )}
              <div className="no-print border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">Approval history</h4>
                {selectedQuote.events.length === 0 ? <p className="text-xs text-slate-500">No recorded events.</p> : (
                  <ol className="space-y-2">
                    {selectedQuote.events.map((item: QuotationEvent) => (
                      <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{item.actor_name || 'Team member'}</span>
                        <span>{item.action.replace(/_/g, ' ')}</span>
                        <time className="text-slate-400">{new Date(item.created_at).toLocaleString('en-IN')}</time>
                        {item.comment && <span className="basis-full text-slate-500">{item.comment}</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </article>
          </section>
        ) : (
          <section className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            <div><IndianRupee className="mx-auto mb-2 h-6 w-6 text-slate-400" />Create or select a quotation to preview it here.</div>
          </section>
        )}
      </div>
      {isDemoMode && <p className="text-center text-[11px] text-slate-400">Demo quotations are stored in this browser only.</p>}
      <style>{'@media print { body * { visibility: hidden !important; } #quotation-print, #quotation-print * { visibility: visible !important; } #quotation-print { position: absolute; inset: 0; width: 100%; } .no-print { display: none !important; } }'}</style>
    </div>
  );
};

export const SharedQuotationPage: React.FC<{ token: string }> = ({ token }) => {
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    quotationService.getSharedQuotation(token)
      .then(data => { if (active) setQuote(data); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load this quotation.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const respond = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const updated = await quotationService.respondToSharedQuotation(token, action, comment);
      setQuote(updated);
      setNotice(action === 'approved' ? 'Your approval has been recorded.' : action === 'rejected' ? 'Your decision has been recorded.' : 'Your change request has been sent to the project team.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-sm text-slate-600">Loading secure quotation…</div>;
  if (error && !quote) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div role="alert" className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-800 shadow-sm">{error}</div></div>;
  if (!quote) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-7">
          <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">{quote.company_snapshot.name || 'Apni Estate'}</p><h1 className="mt-1 text-xl font-extrabold text-slate-900">Quotation {quote.quote_number}</h1></div>
          <button onClick={() => window.print()} className="no-print inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><Printer className="h-4 w-4" /> Download / Print</button>
        </header>
        <article id="quotation-print" className="space-y-5 p-5 sm:p-7">
          <div className="flex flex-wrap justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</p><p className="mt-1 font-bold text-slate-900">{quote.project_snapshot.name}</p><p className="text-xs text-slate-500">{quote.project_snapshot.location}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prepared for</p><p className="mt-1 font-bold text-slate-900">{quote.client_snapshot.name}</p><p className="text-xs text-slate-500">{quote.client_snapshot.address}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status · Valid until</p><p className="mt-1 font-bold text-brand-700">{statusLabels[quote.status]}</p><p className="text-xs text-slate-500">{dateLabel(quote.valid_until)}</p></div>
          </div>
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Scope</th><th className="px-3 py-3 text-right">Quantity</th><th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">GST</th><th className="px-3 py-3 text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{quote.items.map((item, index) => <tr key={`${item.boq_item_id}-${index}`}><td className="px-3 py-3"><strong>{item.item_name}</strong><p className="text-[10px] text-slate-500">{item.description || item.category}</p></td><td className="px-3 py-3 text-right">{item.quantity} {item.unit}</td><td className="px-3 py-3 text-right">{formatINR(item.selling_rate)}</td><td className="px-3 py-3 text-right">{item.gst_percent}%</td><td className="px-3 py-3 text-right font-bold">{formatINR(item.amount + item.gst_amount)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="ml-auto max-w-xs space-y-2">{totals(quote).map(([label, value], index) => <div key={label} className={`flex justify-between ${index === 2 ? 'border-t pt-2 text-base font-black' : 'text-xs text-slate-600'}`}><span>{label}</span><span>{value}</span></div>)}</div>
          <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2"><div><h2 className="text-xs font-extrabold uppercase text-slate-600">Terms</h2><p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{quote.terms}</p></div><div><h2 className="text-xs font-extrabold uppercase text-slate-600">Payment terms</h2><p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{quote.payment_terms}</p></div></div>
          {quote.status === 'sent' && (
            <section className="no-print space-y-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <label className="block text-xs font-bold text-slate-700">Comment (optional for approval, required for change requests)
                <textarea rows={3} value={comment} onChange={event => setComment(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal focus:border-brand-500 focus:outline-none" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => respond('approved')} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                <button onClick={() => respond('changes_requested')} disabled={submitting || !comment.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-800 disabled:opacity-50"><MessageCircle className="h-4 w-4" /> Request changes</button>
                <button onClick={() => respond('rejected')} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-4 w-4" /> Reject</button>
              </div>
            </section>
          )}
          {quote.decision_comment && <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700"><strong>Response:</strong> {quote.decision_comment}</p>}
        </article>
      </div>
      <style>{'@media print { body * { visibility: hidden !important; } #quotation-print, #quotation-print * { visibility: visible !important; } #quotation-print { position: absolute; inset: 0; width: 100%; } .no-print { display: none !important; } }'}</style>
    </main>
  );
};
