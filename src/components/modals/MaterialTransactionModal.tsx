// ==============================================================================
// APNI ESTATE INTERIORS - MATERIAL TRANSACTION MODAL (STOCK IN / STOCK OUT)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Material, Room } from '../../types';
import { ArrowDownLeft, ArrowUpRight, Calendar, FileText, AlertTriangle, Layers } from 'lucide-react';

interface MaterialTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  availableStock: number;
  rooms?: Room[];
  defaultType?: 'in' | 'out';
}

export const MaterialTransactionModal: React.FC<MaterialTransactionModalProps> = ({
  isOpen,
  onClose,
  material,
  availableStock,
  rooms = [],
  defaultType = 'in'
}) => {
  const { addMaterialTransaction } = useApp();

  const [transactionType, setTransactionType] = useState<'in' | 'out'>(defaultType);
  const [quantity, setQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomId, setRoomId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTransactionType(defaultType);
    setQuantity('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setRoomId(material?.room_id || '');
    setNotes('');
    setErrorMessage(null);
  }, [isOpen, material, defaultType]);

  if (!material) return null;

  const numQuantity = Number(quantity) || 0;
  const isInvalidOut = transactionType === 'out' && numQuantity > availableStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numQuantity <= 0) {
      setErrorMessage('Quantity must be greater than zero.');
      return;
    }

    if (transactionType === 'out' && numQuantity > availableStock) {
      setErrorMessage(`Only ${availableStock} ${material.unit} available. Cannot stock out ${numQuantity}.`);
      return;
    }

    setLoading(true);
    try {
      await addMaterialTransaction({
        material_id: material.id,
        project_id: material.project_id,
        room_id: roomId || undefined,
        transaction_type: transactionType,
        quantity: numQuantity,
        transaction_date: transactionDate,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record stock transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Stock Movement: ${material.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Material & Available Status Banner */}
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Material</div>
            <div className="text-sm font-semibold text-slate-100">{material.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Current Available</div>
            <div className={`text-base font-bold ${availableStock <= 0 ? 'text-red-400' : availableStock <= material.minimum_stock ? 'text-amber-400' : 'text-emerald-400'}`}>
              {availableStock} <span className="text-xs font-normal text-slate-400">{material.unit}</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Transaction Type Segmented Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Movement Type *
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTransactionType('in')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                transactionType === 'in'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Stock IN (Received)
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('out')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                transactionType === 'out'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Stock OUT (Consumed)
            </button>
          </div>
        </div>

        {/* Quantity & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Quantity ({material.unit}) *
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              required
              className={`w-full bg-slate-900 border rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none ${
                isInvalidOut
                  ? 'border-red-500/80 focus:ring-1 focus:ring-red-500/50'
                  : 'border-slate-700/80 focus:border-amber-500/80'
              }`}
            />
            {isInvalidOut && (
              <p className="text-xs text-red-400 mt-1">
                Exceeds available stock ({availableStock} {material.unit}).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>
        </div>

        {/* Assigned Room */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Room / Area (Optional)
          </label>
          <div className="relative">
            <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
            >
              <option value="">General Site / Unassigned</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Reason / Vendor / Notes
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={transactionType === 'in' ? 'e.g. Delivered by WoodTech Suppliers, Challan #104' : 'e.g. Used for master bedroom wardrobe framework'}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isInvalidOut || numQuantity <= 0}
            className={`px-5 py-2.5 font-semibold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 ${
              transactionType === 'in'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {loading ? 'Recording...' : transactionType === 'in' ? 'Record Stock IN' : 'Record Stock OUT'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
