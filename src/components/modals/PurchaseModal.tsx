import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Trash2, IndianRupee, Calendar, Building2, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Purchase, PurchaseItem, PurchaseStatus, PurchasePaymentStatus, Project, Vendor } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (purchaseData: any) => Promise<void>;
  purchaseToEdit?: Purchase | null;
  projects?: Project[];
  vendors?: Vendor[];
  defaultProjectId?: string | null;
}

interface DraftItem {
  id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

const PURCHASE_STATUSES: PurchaseStatus[] = [
  'Draft',
  'Ordered',
  'Partially Received',
  'Received',
  'Cancelled'
];

const PAYMENT_STATUSES: PurchasePaymentStatus[] = [
  'Pending',
  'Partially Paid',
  'Paid'
];

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  purchaseToEdit,
  projects: propProjects,
  vendors: propVendors,
  defaultProjectId
}) => {
  const { projects: contextProjects, vendors: contextVendors, addPurchase, updatePurchase } = useApp();
  const projects = propProjects || contextProjects;
  const vendors = propVendors || contextVendors;

  const [projectId, setProjectId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [status, setStatus] = useState<PurchaseStatus>('Draft');
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>('Pending');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([
    { item_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (purchaseToEdit) {
      setProjectId(purchaseToEdit.project_id);
      setVendorId(purchaseToEdit.vendor_id);
      setPoNumber(purchaseToEdit.po_number);
      setOrderDate(purchaseToEdit.order_date || new Date().toISOString().split('T')[0]);
      setExpectedDelivery(purchaseToEdit.expected_delivery || '');
      setStatus(purchaseToEdit.status || 'Draft');
      setPaymentStatus(purchaseToEdit.payment_status || 'Pending');
      setNotes(purchaseToEdit.notes || '');

      if (purchaseToEdit.items && purchaseToEdit.items.length > 0) {
        setItems(purchaseToEdit.items.map(it => ({
          id: it.id,
          item_name: it.item_name,
          description: it.description || '',
          quantity: it.quantity,
          unit: it.unit,
          rate: it.rate
        })));
      } else {
        setItems([{ item_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0 }]);
      }
    } else {
      setProjectId(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
      setVendorId(vendors.length > 0 ? vendors[0].id : '');
      setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setOrderDate(new Date().toISOString().split('T')[0]);
      setExpectedDelivery('');
      setStatus('Draft');
      setPaymentStatus('Pending');
      setNotes('');
      setItems([{ item_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0 }]);
    }
    setError(null);
  }, [purchaseToEdit, isOpen, defaultProjectId, projects, vendors]);

  if (!isOpen) return null;

  // Derived grand total from items
  const derivedGrandTotal = items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.rate) || 0)), 0);

  const handleItemChange = (index: number, field: keyof DraftItem, val: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { item_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project.');
      return;
    }
    if (!vendorId) {
      setError('Please select a vendor.');
      return;
    }

    const validItems = items.filter(it => it.item_name.trim() !== '');
    if (validItems.length === 0) {
      setError('Please add at least one line item with a name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        project_id: projectId,
        vendor_id: vendorId,
        po_number: poNumber.trim(),
        order_date: orderDate || new Date().toISOString().split('T')[0],
        expected_delivery: expectedDelivery || undefined,
        status,
        payment_status: paymentStatus,
        notes: notes.trim() || undefined,
        items: validItems
      };

      if (onSave) {
        await onSave({ id: purchaseToEdit?.id, ...payload });
      } else if (purchaseToEdit) {
        await updatePurchase(purchaseToEdit.id, payload);
      } else {
        await addPurchase(payload as any);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">
                {purchaseToEdit ? `Edit Purchase Order (${purchaseToEdit.po_number})` : 'Create Purchase Order (PO)'}
              </h2>
              <p className="text-xs text-slate-500">
                Procure materials, furniture, and electrical fittings with derived line totals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium bg-white"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Vendor / Supplier <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium bg-white"
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                PO / Order Number
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Order Date
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Expected Delivery
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Fulfillment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PurchaseStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium bg-white"
              >
                {PURCHASE_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PurchasePaymentStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium bg-white"
              >
                {PAYMENT_STATUSES.map(pst => (
                  <option key={pst} value={pst}>{pst}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-brand-600" />
                <span>Purchase Items ({items.length})</span>
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        required
                        placeholder="Item Name (e.g. Greenply Plywood 18mm)"
                        value={item.item_name}
                        onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full sm:w-64">
                      <div>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none text-center"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none text-center"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          placeholder="Rate ₹"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-32">
                      <span className="text-xs font-bold text-slate-800 shrink-0">
                        {formatINR(lineTotal)}
                      </span>
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Authoritative Server-Derived Grand Total Display */}
            <div className="mt-3 p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand-900 block">
                  Authoritative Order Total
                </span>
                <span className="text-[11px] text-brand-700">
                  Calculated automatically from {items.length} line items
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-brand-900 font-display">
                  {formatINR(derivedGrandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Procurement & Delivery Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Delivery at site block B, unload before 5 PM."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium resize-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving Order...' : purchaseToEdit ? 'Update Purchase Order' : 'Issue Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
