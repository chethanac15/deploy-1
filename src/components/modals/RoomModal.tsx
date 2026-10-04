import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Room } from '../../types';
import { LayoutGrid, DollarSign, Percent, FileText } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomToEdit?: Room | null;
}

const COMMON_ROOM_TYPES = [
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Bedroom',
  'Bathroom',
  'Dining Room',
  'Office',
  'Balcony',
  'Foyer',
  'Walk-in Wardrobe',
  'Pooja Room',
  'Other'
];

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  projectId,
  roomToEdit
}) => {
  const { addRoom, updateRoom } = useApp();
  const { organization } = useAuth();

  const isEdit = Boolean(roomToEdit);

  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('Living Room');
  const [budget, setBudget] = useState('');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (roomToEdit) {
      setName(roomToEdit.name || '');
      setRoomType(roomToEdit.room_type || 'Living Room');
      setBudget(roomToEdit.budget ? String(roomToEdit.budget) : '');
      setProgress(roomToEdit.progress || 0);
      setNotes(roomToEdit.notes || '');
    } else {
      setName('');
      setRoomType('Living Room');
      setBudget('');
      setProgress(0);
      setNotes('');
    }
    setErrorMessage(null);
  }, [roomToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Room name is required.');
      return;
    }

    const numBudget = Number(budget) || 0;
    if (numBudget < 0) {
      setErrorMessage('Budget must be greater than or equal to ₹0.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && roomToEdit) {
        await updateRoom(roomToEdit.id, {
          name: name.trim(),
          room_type: roomType,
          budget: numBudget,
          progress: Number(progress) || 0,
          notes: notes.trim() || undefined
        });
      } else {
        await addRoom({
          organization_id: organization?.id || 'demo-org',
          project_id: projectId,
          name: name.trim(),
          room_type: roomType,
          budget: numBudget,
          progress: Number(progress) || 0,
          notes: notes.trim() || undefined
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save room details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Room Scope' : 'Add New Room / Scope'}
      subtitle={isEdit ? 'Update room budget, progress and specifications.' : 'Break down your project into distinct rooms and designated budget scopes.'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Room Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <LayoutGrid className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. Master Bedroom, Open Kitchen & Dining"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {COMMON_ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Allocated Budget (₹)
            </label>
            <div className="relative">
              <span className="text-slate-400 font-semibold absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">₹</span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="70000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Work Progress ({progress}%)
            </label>
            <span className="text-xs font-bold text-brand-600">{progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-brand-600 bg-slate-200 rounded-lg cursor-pointer h-2"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Scope Notes & Specifications
          </label>
          <div className="relative">
            <textarea
              rows={2}
              placeholder="e.g. Italian marble flooring, false ceiling with warm white cove lighting."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <span>Saving...</span> : <span>{isEdit ? 'Save Changes' : 'Add Room'}</span>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
