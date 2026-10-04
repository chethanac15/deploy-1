// ==============================================================================
// APNI ESTATE INTERIORS - UPLOAD PROJECT PHOTO MODAL
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PhotoCategory, DailyUpdate } from '../../types';
import { UploadCloud, Image as ImageIcon, X, AlertTriangle, FileText, Calendar } from 'lucide-react';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  dailyUpdates?: DailyUpdate[];
  defaultDailyUpdateId?: string;
}

const CATEGORIES: PhotoCategory[] = ['Site Progress', 'Design', 'Materials', 'Completed Work'];

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  isOpen,
  onClose,
  projectId,
  dailyUpdates = [],
  defaultDailyUpdateId
}) => {
  const { uploadProjectPhoto } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PhotoCategory>('Site Progress');
  const [dailyUpdateId, setDailyUpdateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setCategory('Site Progress');
    setDailyUpdateId(defaultDailyUpdateId || '');
    setErrorMessage(null);
  }, [isOpen, defaultDailyUpdateId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Check size <= 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (selected.size > MAX_SIZE) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!ALLOWED.includes(selected.type.toLowerCase())) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    if (!title.trim()) {
      // Auto populate clean title from filename
      const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const removeSelectedFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!file) {
      setErrorMessage('Please select a photo to upload.');
      return;
    }

    setLoading(true);
    try {
      await uploadProjectPhoto(projectId, file, {
        title: title.trim() || file.name,
        category,
        daily_update_id: dailyUpdateId || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Project Photo"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* File Upload / Drop Area */}
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Click to select photo</p>
            <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WebP up to 10MB</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 max-h-56 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-56 object-cover"
            />
            <button
              type="button"
              onClick={removeSelectedFile}
              className="absolute top-3 right-3 p-1.5 bg-slate-950/80 hover:bg-red-500/90 text-slate-200 hover:text-white rounded-lg backdrop-blur-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Caption / Photo Title
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Bedroom Wardrobe Frame Assembly"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
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
              onChange={(e) => setCategory(e.target.value as PhotoCategory)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Link to Daily Report (Optional)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={dailyUpdateId}
                onChange={(e) => setDailyUpdateId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              >
                <option value="">General Project Photo</option>
                {dailyUpdates.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.update_date} - {u.work_completed?.slice(0, 25)}...
                  </option>
                ))}
              </select>
            </div>
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
            disabled={loading || !file}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
