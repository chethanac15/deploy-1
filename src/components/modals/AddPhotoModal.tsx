import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PhotoCategory } from '../../types';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const SAMPLE_PHOTO_PRESETS = [
  { title: 'Italian Marble Living Flooring', category: 'Materials' as PhotoCategory, url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80' },
  { title: 'Modular Kitchen Island Installation', category: 'Site Progress' as PhotoCategory, url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80' },
  { title: 'Master Bed Velvet Panelling', category: 'Completed Work' as PhotoCategory, url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80' },
  { title: 'Dining Cove Light Fixtures', category: 'Completed Work' as PhotoCategory, url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80' },
];

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ isOpen, onClose, projectId }) => {
  const { addProjectPhoto } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PhotoCategory>('Site Progress');
  const [selectedUrl, setSelectedUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);
  const [customUrl, setCustomUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addProjectPhoto(projectId, {
      title: title.trim(),
      category,
      url: customUrl.trim() || selectedUrl,
      uploadedBy: 'Aarav Mehta'
    });

    setTitle('');
    setCustomUrl('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Site & Design Photo"
      subtitle="Keep visual documentation of design renders, site work, and finished milestones."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Photo Title / Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Master Bedroom Wardrobe Carpentry Progress"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PhotoCategory)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
          >
            <option value="Design">Design (3D Renders & Concepts)</option>
            <option value="Site Progress">Site Progress</option>
            <option value="Materials">Materials & Samples</option>
            <option value="Completed Work">Completed Work / Handover</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select Demo Image or Custom URL
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {SAMPLE_PHOTO_PRESETS.map((p, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  setSelectedUrl(p.url);
                  setCustomUrl('');
                }}
                className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                  selectedUrl === p.url && !customUrl
                    ? 'border-brand-600 ring-2 ring-brand-500/20'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] py-0.5 px-1 truncate text-center">
                  {p.title}
                </span>
              </button>
            ))}
          </div>

          <input
            type="url"
            placeholder="Or enter image URL..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none text-slate-700"
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
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Save Photo
          </button>
        </div>
      </form>
    </Modal>
  );
};
