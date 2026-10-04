import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { ProjectNote } from '../../types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({ isOpen, onClose, projectId }) => {
  const { addProjectNote } = useApp();
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<ProjectNote['tag']>('Client Decision');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addProjectNote(projectId, content.trim(), tag);
    setContent('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Project Note / Activity"
      subtitle="Log client decisions, site instructions, or contractor updates."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Tag / Category
          </label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
          >
            <option value="Client Decision">Client Decision (Approvals / Finishes)</option>
            <option value="Site Update">Site Update (Masonry, MEP, Carpentry)</option>
            <option value="Vendor Issue">Vendor Issue (Delays, Snags)</option>
            <option value="General">General Note</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Note Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            placeholder="e.g. Client approved walnut finish for master bedroom wardrobe. Kitchen countertop delivery scheduled for 8 September."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none leading-relaxed"
          />
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
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Post Note
          </button>
        </div>
      </form>
    </Modal>
  );
};
