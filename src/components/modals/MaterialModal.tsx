// ==============================================================================
// APNI ESTATE INTERIORS - MATERIAL MODAL (ADD / EDIT MATERIAL)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Material, Room } from '../../types';
import { Package, Layers, FileText, AlertTriangle, Hash } from 'lucide-react';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  rooms?: Room[];
  materialToEdit?: Material | null;
}

const COMMON_CATEGORIES = [
  'Plywood & Boards',
  'Laminates & Veneer',
  'Paints & Primers',
  'Electrical & Wire',
  'Hardware & Fittings',
  'Tiles & Stone',
  'Sanitary & Plumbing',
  'Glass & Mirrors',
  'Adhesives & Chemicals',
  'Fabric & Upholstery',
  'Civil Materials',
  'Other'
];

const COMMON_UNITS = [
  'Sheets',
  'Pcs',
  'Litres',
  'Sq Ft',
  'Running Ft',
  'Bags',
  'Boxes',
  'Rolls',
  'Kg',
  'Meters'
];

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  projectId,
  rooms = [],
  materialToEdit
}) => {
  const { addMaterial, updateMaterial } = useApp();
  const isEdit = Boolean(materialToEdit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Plywood & Boards');
  const [unit, setUnit] = useState('Sheets');
  const [roomId, setRoomId] = useState('');
  const [quantityOrdered, setQuantityOrdered] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name || '');
      setCategory(materialToEdit.category || 'Plywood & Boards');
      setUnit(materialToEdit.unit || 'Sheets');
      setRoomId(materialToEdit.room_id || '');
      setQuantityOrdered(materialToEdit.quantity_ordered ? String(materialToEdit.quantity_ordered) : '');
      setMinimumStock(materialToEdit.minimum_stock ? String(materialToEdit.minimum_stock) : '');
      setInitialQuantity('');
      setNotes(materialToEdit.notes || '');
    } else {
      setName('');
      setCategory('Plywood & Boards');
      setUnit('Sheets');
      setRoomId('');
      setQuantityOrdered('');
      setMinimumStock('');
      setInitialQuantity('0');
      setNotes('');
    }
    setErrorMessage(null);
  }, [materialToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Material name is required.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && materialToEdit) {
        await updateMaterial(materialToEdit.id, {
          name: name.trim(),
          category,
          unit,
          room_id: roomId || undefined,
          quantity_ordered: Number(quantityOrdered) || 0,
          minimum_stock: Number(minimumStock) || 0,
          notes: notes.trim() || undefined
        });
      } else {
        await addMaterial({
          project_id: projectId,
          room_id: roomId || undefined,
          name: name.trim(),
          category,
          unit,
          quantity_ordered: Number(quantityOrdered) || 0,
          minimum_stock: Number(minimumStock) || 0,
          initial_quantity: Number(initialQuantity) || 0,
          notes: notes.trim() || undefined
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Material' : 'Add Material to Site'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Material Name *
          </label>
          <div className="relative">
            <Package className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Commercial Plywood 18mm, Asian Paints Royal"
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
            >
              {COMMON_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
            >
              {COMMON_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Assigned Room (Optional)
          </label>
          <div className="relative">
            <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
            >
              <option value="">General Site / Unassigned</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Opening Stock ({unit})
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Low Stock Alert Level ({unit})
            </label>
            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="any"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                placeholder="e.g. 5"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Notes / Brand / Specifications
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Century Club Prime 710 BWP, Shade code #8241"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
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
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Material' : 'Add Material'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
