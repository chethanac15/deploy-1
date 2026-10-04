// ==============================================================================
// APNI ESTATE INTERIORS - UPLOAD DOCUMENT MODAL (SUPABASE STORAGE VAULT)
// ==============================================================================

import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentCategory } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  FolderKanban, 
  Tag, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  X
} from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

const CATEGORIES: DocumentCategory[] = [
  'Proposal', 
  'Contract', 
  'Moodboard', 
  'Drawing', 
  'Estimate', 
  'Site Plan', 
  'Invoice', 
  'Other'
];

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId
}) => {
  const { projects, addDocument } = useApp();
  const { organization, user, isDemoMode } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Drawing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 26214400) {
      setErrorMessage('File size exceeds the 25 MB limit.');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    if (!title.trim()) {
      // Auto populate title with clean filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Document title is required.');
      return;
    }

    setLoading(true);
    try {
      const selectedProj = projects.find(p => p.id === projectId);

      await addDocument({
        organizationId: organization?.id || 'demo-org',
        projectId: projectId || undefined,
        projectName: selectedProj?.name,
        title: title.trim(),
        category,
        file: selectedFile,
        userId: user?.id
      });

      setSelectedFile(null);
      setTitle('');
      onClose();
    } catch (err: any) {
      console.error('[UploadDocumentModal] Upload error:', err);
      setErrorMessage(err.message || 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Studio Document / CAD Blueprint"
      subtitle="Securely store signed contracts, CAD drawing revisions, and high-res client proposals."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Drag & Drop File Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-brand-500 bg-brand-50/50' 
              : selectedFile 
                ? 'border-emerald-400 bg-emerald-50/30' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.webp,.xlsx,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-900">{selectedFile.name}</div>
              <div className="text-[11px] text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to store
              </div>
              <span className="text-[10px] text-brand-600 font-bold hover:underline mt-1">
                Click to choose another file
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-900">
                Click or drag & drop PDF, CAD (.dwg), Excel, or Image file
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Max 25MB. Secure private storage vault with encrypted tenant isolation.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Document Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Master Bedroom Wardrobe Detailed CAD 2D"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Project Association */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Associated Project
            </label>
            <div className="relative">
              <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="">General Studio Vault</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Document Category
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Uploading to Vault...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
