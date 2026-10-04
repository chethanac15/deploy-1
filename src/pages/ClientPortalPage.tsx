import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Copy, ExternalLink, ImagePlus, Link2, LockKeyhole, RefreshCw, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ClientPortalMedia, ClientPortalSnapshot } from '../types';
import { clientPortalService } from '../services/clientPortalService';
import { formatINR } from '../utils/formatters';

function displayDate(date?: string): string {
  if (!date) return 'Not set';
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-IN');
}

function readableStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export const ClientPortalPage: React.FC = () => {
  const { projects } = useApp();
  const { isDemoMode, organization, profile } = useAuth();
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [link, setLink] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [linkActive, setLinkActive] = useState(false);
  const [photos, setPhotos] = useState<ClientPortalMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(!isDemoMode);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedProject = projects.find(project => project.id === projectId);
  const isAdmin = isDemoMode || profile?.role === 'owner' || profile?.role === 'admin';
  const canManagePhotos = isAdmin || profile?.role === 'supervisor';

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  useEffect(() => {
    if (!projectId || isDemoMode) {
      setPhotos([]);
      setLinkActive(false);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([
      clientPortalService.getManagedPhotos(projectId),
      clientPortalService.getLinkStatus(projectId)
    ]).then(([rows, status]) => {
      if (!active) return;
      setPhotos(rows);
      setLinkActive(status.active);
      setExpiresAt(status.expiresAt || '');
      setError('');
    }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : 'Could not load client portal settings.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId, isDemoMode]);

  const createLink = async () => {
    if (!projectId) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const result = await clientPortalService.createLink(projectId, Number(expiresInDays));
      setLink(`${window.location.origin}${window.location.pathname}?portal=${encodeURIComponent(result.token)}`);
      setExpiresAt(result.expiresAt);
      setLinkActive(true);
      setNotice('Portal link created. Creating a new one later rotates and immediately invalidates this link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create client portal link.');
    } finally {
      setWorking(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNotice('Client portal link copied.');
    } catch {
      setError('Could not copy the link. Select and copy it manually or use a secure browser connection.');
    }
  };

  const revokeLink = async () => {
    if (!projectId) return;
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await clientPortalService.revokeLink(projectId);
      setLink('');
      setLinkActive(false);
      setNotice('Client portal access revoked. Existing portal links now stop working.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke client portal access.');
    } finally {
      setWorking(false);
    }
  };

  const uploadPhoto = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization?.id || !profile?.id || !file || !projectId) {
      setError('Choose a project and image, and make sure your workspace profile is loaded.');
      return;
    }
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await clientPortalService.uploadClientPhoto({
        organizationId: organization.id,
        projectId,
        userId: profile.id,
        file,
        caption
      });
      const rows = await clientPortalService.getManagedPhotos(projectId);
      setPhotos(rows);
      setFile(null);
      setCaption('');
      const picker = document.getElementById('client-portal-photo') as HTMLInputElement | null;
      if (picker) picker.value = '';
      setNotice('Photo published to the client portal. This dedicated media bucket is publicly readable; upload only client-approved images.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish client photo.');
    } finally {
      setWorking(false);
    }
  };

  const removePhoto = async (photo: ClientPortalMedia) => {
    setWorking(true);
    setError('');
    try {
      await clientPortalService.deleteClientPhoto(projectId, photo.storage_path);
      setPhotos(current => current.filter(item => item.id !== photo.id));
      setNotice('Client-visible photo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the client photo.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Client access</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Client project portal</h1>
        <p className="mt-1 text-sm text-slate-500">Share read-only project progress, milestones, payment schedule, and selected client-approved photos.</p>
      </header>

      {(error || notice) && <p role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</p>}

      {projects.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Create a project before setting up a client portal.</p> : (
        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2"><Link2 className="h-5 w-5 text-brand-600" /><div><h2 className="font-bold text-slate-900">Secure project link</h2><p className="text-xs text-slate-500">A random bearer link grants read-only access to this project's client view.</p></div></div>
              <label className="block text-xs font-bold text-slate-700">Project
                <select value={projectId} onChange={event => { setProjectId(event.target.value); setLink(''); setExpiresAt(''); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              </label>
              <div className="mt-3 flex items-end gap-3">
                <label className="flex-1 text-xs font-bold text-slate-700">Link expiry
                  <select value={expiresInDays} onChange={event => setExpiresInDays(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">365 days</option></select>
                </label>
                <button onClick={createLink} disabled={!isAdmin || working || isDemoMode} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"><RefreshCw className="h-4 w-4" />{linkActive ? 'Rotate link' : 'Create link'}</button>
              </div>
              {isDemoMode && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Secure share links require a configured Supabase workspace and the latest database migration. Demo mode does not create fake public links.</p>}
              {expiresAt && <p className="mt-3 text-xs text-slate-500">Current link {linkActive ? 'active' : 'inactive'} · expires {new Date(expiresAt).toLocaleString('en-IN')}</p>}
              {link && <div className="mt-3 space-y-2"><div className="break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{link}</div><div className="flex gap-2"><button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><Copy className="h-3.5 w-3.5" />Copy link</button><a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><ExternalLink className="h-3.5 w-3.5" />Preview</a></div></div>}
              <button onClick={revokeLink} disabled={!isAdmin || working || isDemoMode} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40">Revoke project portal link</button>
              {!isAdmin && !isDemoMode && <p className="mt-2 text-xs text-amber-700">Only owners and admins can create or revoke portal links.</p>}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4" />Privacy note</div>
              Client links reveal progress, milestone dates, contract amount, and payment schedule. Photos added below are deliberately stored in a separate public-read bucket and remain directly accessible by their image URL even after portal-link revocation; remove the photo to delete that public object. Do not upload private, identifying, or unapproved images. Studio documents and private site photos are never automatically exposed.
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2"><ImagePlus className="h-5 w-5 text-brand-600" /><div><h2 className="font-bold text-slate-900">Client-visible photos</h2><p className="text-xs text-slate-500">Only images explicitly added here are published to the selected project's portal.</p></div></div>
              {!isDemoMode && canManagePhotos && (
                <form onSubmit={uploadPhoto} className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
                  <input id="client-portal-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs" />
                  <input required value={caption} onChange={event => setCaption(event.target.value)} placeholder="Photo caption" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  <button type="submit" disabled={working || !file} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Publish photo</button>
                </form>
              )}
              {loading ? <p className="mt-4 text-sm text-slate-500">Loading portal photos…</p> : photos.length === 0 ? <p className="mt-4 text-sm text-slate-500">No client-visible photos have been published.</p> : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">{photos.map(photo => <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200"><img src={photo.url} alt={photo.caption} className="h-44 w-full bg-slate-100 object-cover" /><div className="flex items-center justify-between gap-2 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{photo.caption}</p><p className="text-[10px] text-slate-500">{new Date(photo.created_at).toLocaleDateString('en-IN')}</p></div>{canManagePhotos && <button onClick={() => removePhoto(photo)} disabled={working} aria-label={`Remove ${photo.caption}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div></div>)}</div>
              )}
              {!canManagePhotos && !isDemoMode && <p className="mt-3 text-xs text-amber-700">Only owners, admins, or supervisors can publish client-visible images.</p>}
            </div>
            {selectedProject && <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"><p className="font-bold text-slate-900">{selectedProject.name}</p><p className="mt-1">{selectedProject.location || selectedProject.city || 'Project location not set'} · {readableStatus(selectedProject.status)}</p><p className="mt-2 text-xs">The portal only loads the selected project's public snapshot using a hashed, expiring token. Replacing or revoking the token disables previous portal links.</p></div>}
          </section>
        </div>
      )}
    </div>
  );
};

export const SharedClientPortalPage: React.FC<{ token: string }> = ({ token }) => {
  const [snapshot, setSnapshot] = useState<ClientPortalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    clientPortalService.getSharedPortal(token)
      .then(data => { if (active) setSnapshot(data); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load this client portal.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-sm text-slate-600">Loading secure client portal…</div>;
  if (!snapshot) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><p role="alert" className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-800 shadow-sm">{error || 'This portal is unavailable.'}</p></main>;

  const paymentsTotal = snapshot.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidTotal = snapshot.payments.reduce((sum, payment) => sum + payment.paid_amount, 0);
  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6">
      <article className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Apni Estate · Client portal</p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{snapshot.project.name}</h1>
          <p className="mt-1 text-sm text-slate-300">{snapshot.project.location || 'Project update'} · {readableStatus(snapshot.project.status)}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</p><p className="mt-1 text-2xl font-extrabold">{snapshot.project.progress}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, snapshot.project.progress))}%` }} /></div></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target handover</p><p className="mt-1 text-lg font-extrabold">{displayDate(snapshot.project.deadline)}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contract value</p><p className="mt-1 text-lg font-extrabold">{snapshot.project.contract_value === undefined ? 'Not shared' : formatINR(snapshot.project.contract_value)}</p></div>
          </div>
        </header>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Project milestones</h2>
            {snapshot.milestones.length ? <ol className="mt-4 space-y-3">{snapshot.milestones.map((milestone, index) => <li key={`${milestone.title}-${index}`} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${milestone.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{milestone.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{milestone.title}</p><span className="text-xs text-slate-500">{milestone.progress}%</span></div><p className="mt-1 text-xs text-slate-500">{readableStatus(milestone.status)} · target {displayDate(milestone.due_date)}</p></div></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">Milestone schedule is not available yet.</p>}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">Payment schedule</h2><p className="mt-1 text-xs text-slate-500">Received {formatINR(paidTotal)} of {formatINR(paymentsTotal)}</p></div><p className="text-sm font-extrabold text-slate-900">{paymentsTotal ? `${Math.round(paidTotal / paymentsTotal * 100)}%` : '—'}</p></div>
            {snapshot.payments.length ? <ul className="mt-4 space-y-3">{snapshot.payments.map((payment, index) => <li key={`${payment.title}-${index}`} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="text-sm font-semibold text-slate-800">{payment.title}</p><p className="mt-1 text-xs text-slate-500">Due {displayDate(payment.due_date)} · {readableStatus(payment.status)}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{formatINR(payment.amount)}</p><p className="text-[11px] text-slate-500">Received {formatINR(payment.paid_amount)}</p></div></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Payment schedule is not available yet.</p>}
          </section>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Recent site updates</h2>
          {snapshot.updates.length ? <ol className="mt-4 space-y-4">{snapshot.updates.map((update, index) => <li key={`${update.update_date}-${index}`} className="border-l-2 border-brand-200 pl-4"><p className="text-xs font-bold text-brand-700">{displayDate(update.update_date)}{update.progress !== undefined ? ` · ${update.progress}% progress` : ''}</p><p className="mt-1 whitespace-pre-line text-sm text-slate-700">{update.work_completed || 'Site update recorded.'}</p>{update.next_day_tasks && <p className="mt-2 text-xs text-slate-500">Next: {update.next_day_tasks}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-slate-500">No site updates have been shared yet.</p>}
        </section>
        {snapshot.media.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Shared project photos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{snapshot.media.map((photo, index) => <figure key={`${photo.url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200"><img src={photo.url} alt={photo.caption} className="h-48 w-full object-cover" /><figcaption className="p-3 text-xs font-semibold text-slate-700">{photo.caption}</figcaption></figure>)}</div></section>}
        <footer className="text-center text-[11px] text-slate-500">Secure project view · Link expires {new Date(snapshot.expires_at).toLocaleDateString('en-IN')}</footer>
      </article>
    </main>
  );
};
