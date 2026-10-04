import React, { useEffect, useState } from 'react';
import { AlertCircle, ClipboardCheck, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Purchase, GoodsReceipt } from '../../types';
import { goodsReceiptService } from '../../services/goodsReceiptService';
import { formatDate, formatINR } from '../../utils/formatters';

interface GoodsReceiptModalProps {
  isOpen: boolean;
  purchase: Purchase | null;
  projectLocation?: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface ReceiptLineInput {
  delivered: string;
  rejected: string;
  actualRate: string;
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  purchase,
  projectLocation,
  onClose,
  onSaved
}) => {
  const [receivedOn, setReceivedOn] = useState(new Date().toISOString().slice(0, 10));
  const [siteLocation, setSiteLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [lineInputs, setLineInputs] = useState<Record<string, ReceiptLineInput>>({});
  const [history, setHistory] = useState<GoodsReceipt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !purchase) return;
    setReceivedOn(new Date().toISOString().slice(0, 10));
    setSiteLocation(projectLocation || '');
    setNotes('');
    setError('');
    setLineInputs(Object.fromEntries((purchase.items || []).map((item, index) => [
      item.id || `line-${index}`,
      { delivered: '', rejected: '', actualRate: '' }
    ])));

    let active = true;
    setLoadingHistory(true);
    goodsReceiptService.getGoodsReceipts(purchase.id)
      .then(receipts => { if (active) setHistory(receipts); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load receipt history.'); })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, [isOpen, purchase, projectLocation]);

  if (!purchase) return null;

  const updateLine = (lineId: string, field: keyof ReceiptLineInput, value: string) => {
    setLineInputs(current => ({
      ...current,
      [lineId]: { ...current[lineId], [field]: value }
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const items = (purchase.items || []).flatMap((item, index) => {
      if (!item.id) return [];
      const values = lineInputs[item.id] || lineInputs[`line-${index}`];
      const deliveredQuantity = Number(values?.delivered) || 0;
      const rejectedQuantity = Number(values?.rejected) || 0;
      const rateInput = values?.actualRate?.trim();
      return deliveredQuantity > 0 ? [{
        purchaseItemId: item.id,
        deliveredQuantity,
        rejectedQuantity,
        actualRate: rateInput ? Number(rateInput) : undefined
      }] : [];
    });

    if (!items.length) {
      setError('Enter delivered quantity for at least one purchase order line.');
      return;
    }
    if (items.some(item => item.deliveredQuantity <= 0 || item.rejectedQuantity > item.deliveredQuantity ||
        (item.actualRate !== undefined && (!Number.isFinite(item.actualRate) || item.actualRate < 0)))) {
      setError('Check delivered, rejected, and actual rate values. Rejected quantity cannot exceed delivered quantity.');
      return;
    }
    if (!siteLocation.trim()) {
      setError('Site or delivery location is required.');
      return;
    }

    setSaving(true);
    try {
      await goodsReceiptService.createGoodsReceipt({
        purchaseId: purchase.id,
        receivedOn,
        siteLocation,
        notes,
        items
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the goods receipt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Goods receipt · ${purchase.po_number}`} subtitle="Record delivered and rejected quantities against the purchase order." maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">Date received
            <input type="date" required value={receivedOn} onChange={event => setReceivedOn(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium" />
          </label>
          <label className="text-xs font-bold text-slate-700">Site / delivery location
            <input required value={siteLocation} onChange={event => setSiteLocation(event.target.value)} placeholder="Site address or store" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium" />
          </label>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[740px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr><th className="px-3 py-2.5">PO line</th><th className="px-3 py-2.5 text-right">Ordered</th><th className="px-3 py-2.5 text-right">Accepted so far</th><th className="px-3 py-2.5">Delivered now</th><th className="px-3 py-2.5">Rejected</th><th className="px-3 py-2.5">Actual rate (₹)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(purchase.items || []).map((item, index) => {
                const lineId = item.id || `line-${index}`;
                const available = Math.max(item.quantity - (item.received_quantity || 0), 0);
                return (
                  <tr key={lineId}>
                    <td className="px-3 py-3"><p className="font-bold text-slate-800">{item.item_name}</p><p className="text-[10px] text-slate-500">{item.unit}</p></td>
                    <td className="px-3 py-3 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-3 text-right text-emerald-700">{item.received_quantity || 0} {item.unit}<p className="text-[10px] text-slate-400">Balance {available}</p></td>
                    <td className="px-3 py-3"><input type="number" min="0" step="any" value={lineInputs[lineId]?.delivered || ''} onChange={event => updateLine(lineId, 'delivered', event.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5" aria-label={`Delivered quantity for ${item.item_name}`} /></td>
                    <td className="px-3 py-3"><input type="number" min="0" step="any" value={lineInputs[lineId]?.rejected || ''} onChange={event => updateLine(lineId, 'rejected', event.target.value)} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5" aria-label={`Rejected quantity for ${item.item_name}`} /></td>
                    <td className="px-3 py-3"><input type="number" min="0" step="any" value={lineInputs[lineId]?.actualRate || ''} onChange={event => updateLine(lineId, 'actualRate', event.target.value)} className="w-28 rounded-lg border border-slate-200 px-2 py-1.5" placeholder={String(item.rate)} aria-label={`Actual rate for ${item.item_name}`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <label className="block text-xs font-bold text-slate-700">Receipt notes
          <textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Delivery condition, invoice reference, shortages…" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal" />
        </label>
        <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><ClipboardCheck className="h-4 w-4 text-brand-600" />Receipt history</h3>
          {loadingHistory ? <p className="mt-2 text-xs text-slate-500">Loading receipt history…</p> : history.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No goods receipts recorded for this PO yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {history.map(receipt => (
                <li key={receipt.id} className="rounded-lg bg-white px-3 py-2 text-xs">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-bold text-slate-800">{receipt.grn_number} · {formatDate(receipt.received_on)}</span>
                    <span className="text-slate-500">{receipt.site_location} · {receipt.items.length} line{receipt.items.length === 1 ? '' : 's'}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Accepted {receipt.items.reduce((sum, item) => sum + item.accepted_quantity, 0)} · Rejected {receipt.items.reduce((sum, item) => sum + item.rejected_quantity, 0)}
                    {receipt.items.some(item => item.actual_rate !== undefined) &&
                      ` · Actual rates recorded ${formatINR(receipt.items.reduce((sum, item) => sum + item.accepted_quantity * (item.actual_rate ?? 0), 0))}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-[10px] leading-relaxed text-slate-500">Receipt status and accepted PO quantities update atomically. Rejected quantities remain in the GRN record and need replacement.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" disabled={saving || loadingHistory} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Recording…' : 'Record GRN'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
