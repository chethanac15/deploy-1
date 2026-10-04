// ==============================================================================
// APNI ESTATE INTERIORS - DOCUMENT VAULT PAGE (REAL SUPABASE STORAGE INTEGRATION)
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DocumentItem, DocumentCategory } from '../types';
import { 
  FileText, 
  Download, 
  Plus, 
  Search, 
  FolderKanban, 
  Trash2, 
  ExternalLink, 
  FileCode, 
  FileSpreadsheet, 
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { documentService } from '../services/documentService';
import { UploadDocumentModal } from '../components/modals/UploadDocumentModal';
import { EmptyState } from '../components/common/EmptyState';

const CATEGORIES = [
  'All', 
  'Proposal', 
  'Contract', 
  'Moodboard', 
  'Drawing', 
  'Estimate', 
  'Site Plan', 
  'Invoice', 
  'Other'
];

export const DocumentsPage: React.FC = () => {
  const { documents, projects, openProjectDetail, deleteDocument } = useApp();
  const { isDemoMode } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          doc.title.toLowerCase().includes(q) ||
          (doc.projectName && doc.projectName.toLowerCase().includes(q)) ||
          (doc.file_name && doc.file_name.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (categoryFilter !== 'All' && doc.category !== categoryFilter && doc.type !== categoryFilter) return false;
      if (projectFilter !== 'All' && (doc.project_id || doc.projectId) !== projectFilter) return false;
      return true;
    });
  }, [documents, search, categoryFilter, projectFilter]);

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    try {
      if (doc.storage_path && !isDemoMode) {
        const signedUrl = await documentService.getSignedUrl(doc.storage_path);
        window.open(signedUrl, '_blank');
      } else if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank');
      } else {
        alert(`Downloaded sample blueprint: "${doc.title}". In live mode, files download securely from private encrypted storage.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate download link.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Documents & Blueprints
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
              {documents.length} Files
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Store client contracts, moodboard presentations, and CAD drawing sets in one secure central vault.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto min-h-[42px] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title, project, or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none shrink-0"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none shrink-0"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents match your filters"
          description="Upload contracts, signed estimates, DWG drawings, or moodboard presentations."
          actionLabel="+ Upload First Document"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => {
            const pid = doc.project_id || doc.projectId;

            return (
              <div key={doc.id} className="premium-card p-5 flex flex-col justify-between group hover:border-brand-300">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                      {doc.category || doc.type || 'Document'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-1 group-hover:text-brand-600 transition-colors">
                    {doc.title}
                  </h3>

                  {doc.projectName && pid ? (
                    <div 
                      onClick={() => openProjectDetail(pid, 'Overview')}
                      className="text-xs text-brand-600 font-semibold hover:underline cursor-pointer mb-3 inline-flex items-center gap-1"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>{doc.projectName}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium mb-3">
                      General Studio Vault
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{doc.size || 'PDF / CAD'} • {formatDate(doc.updatedAt || doc.created_at || '')}</span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="View / Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete document "${doc.title}"?`)) {
                          deleteDocument(doc.id, doc.storage_path);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
