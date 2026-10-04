// ==============================================================================
// APNI ESTATE INTERIORS - MILESTONE MODAL (ADD / EDIT MILESTONE)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Milestone, MilestoneStatus } from '../../types';
import { Flag, Calendar, Percent, FileText, AlertTriangle } from 'lucide-react';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestoneToEdit?: Milestone | null;
}

const COMMON_MILESTONES = [
  'Design Finalization & 3D Signoff',
  'Civil & Demolition Work',
  'Electrical & Plumbing Rough-In',
  'False Ceiling Framing & Sheet Work',
  'Carpentry & Modular Framework',
  'Flooring & Tile Work',
  'Painting & Surface Finishing',
  'Lighting & Fixture Installation',
  'Deep Cleaning & Final Styling',
  'Client Handover & Walkthrough'
];

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  projectId,
  milestoneToEdit
}) => {
  const { addMilestone, updateMilestone } = useApp();
  const isEdit = Boolean(milestoneToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title || '');
      setDescription(milestoneToEdit.description || '');
      setStartDate(milestoneToEdit.start_date || '');
      setDueDate(milestoneToEdit.due_date || '');
      setStatus(milestoneToEdit.status || 'pending');
      setProgress(milestoneToEdit.progress || 0);
    } else {
      setTitle('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      setStatus('pending');
      setProgress(0);
    }
    setErrorMessage(null);
  }, [milestoneToEdit, isOpen]);

  const handleStatusChange = (newStatus: MilestoneStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setProgress(100);
    } else if (newStatus === 'pending' && progress === 100) {
      setProgress(0);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    if (newProgress === 100) {
      setStatus('completed');
    } else if (newProgress > 0 && status === 'pending') {
      setStatus('in_progress');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Milestone title is required.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && milestoneToEdit) {
        await updateMilestone(milestoneToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          start_date: startDate || undefined,
          due_date: dueDate || undefined,
          status,
          progress: Number(progress) || 0
        });
      } else {
        await addMilestone({
          project_id: projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          start_date: startDate || undefined,
          due_date: dueDate || undefined,
          status,
          progress: Number(progress) || 0
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save milestone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Milestone' : 'Add Project Milestone'}
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
            Milestone Title *
          </label>
          <div className="relative">
            <Flag className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              list="milestone-suggestions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. False Ceiling & Lighting Work"
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50"
            />
            <datalist id="milestone-suggestions">
              {COMMON_MILESTONES.map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as MilestoneStatus)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
            >
              <option value="pending">Pending / Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Progress
              </label>
              <span className="text-xs font-bold text-amber-400">{progress}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Target Completion Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Description / Deliverables
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Master bedroom wardrobe skeleton, kitchen base units installation"
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
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Milestone' : 'Add Milestone'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
