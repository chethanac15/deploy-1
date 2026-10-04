// ==============================================================================
// APNI ESTATE INTERIORS - DAILY SITE UPDATE / DPR MODAL
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { DailyUpdate } from '../../types';
import { Calendar, Users, AlertCircle, CheckCircle2, ArrowRight, FileText, AlertTriangle } from 'lucide-react';

interface DailyUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  updateToEdit?: DailyUpdate | null;
}

export const DailyUpdateModal: React.FC<DailyUpdateModalProps> = ({
  isOpen,
  onClose,
  projectId,
  updateToEdit
}) => {
  const { addDailyUpdate, updateDailyUpdate } = useApp();
  const isEdit = Boolean(updateToEdit);

  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [workCompleted, setWorkCompleted] = useState('');
  const [workPending, setWorkPending] = useState('');
  const [issues, setIssues] = useState('');
  const [nextDayTasks, setNextDayTasks] = useState('');
  const [workersCount, setWorkersCount] = useState('4');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (updateToEdit) {
      setUpdateDate(updateToEdit.update_date || new Date().toISOString().split('T')[0]);
      setWorkCompleted(updateToEdit.work_completed || '');
      setWorkPending(updateToEdit.work_pending || '');
      setIssues(updateToEdit.issues || '');
      setNextDayTasks(updateToEdit.next_day_tasks || '');
      setWorkersCount(updateToEdit.workers_count !== undefined ? String(updateToEdit.workers_count) : '4');
      setProgress(updateToEdit.progress || 0);
    } else {
      setUpdateDate(new Date().toISOString().split('T')[0]);
      setWorkCompleted('');
      setWorkPending('');
      setIssues('');
      setNextDayTasks('');
      setWorkersCount('4');
      setProgress(0);
    }
    setErrorMessage(null);
  }, [updateToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!workCompleted.trim()) {
      setErrorMessage('Work completed description is required.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && updateToEdit) {
        await updateDailyUpdate(updateToEdit.id, {
          update_date: updateDate,
          work_completed: workCompleted.trim(),
          work_pending: workPending.trim() || undefined,
          issues: issues.trim() || undefined,
          next_day_tasks: nextDayTasks.trim() || undefined,
          workers_count: Number(workersCount) >= 0 ? Number(workersCount) : undefined,
          progress: Number(progress) >= 0 ? Number(progress) : undefined
        });
      } else {
        await addDailyUpdate({
          project_id: projectId,
          update_date: updateDate,
          work_completed: workCompleted.trim(),
          work_pending: workPending.trim() || undefined,
          issues: issues.trim() || undefined,
          next_day_tasks: nextDayTasks.trim() || undefined,
          workers_count: Number(workersCount) >= 0 ? Number(workersCount) : undefined,
          progress: Number(progress) >= 0 ? Number(progress) : undefined
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save daily update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Daily Site Report (DPR)' : 'New Daily Site Report (DPR)'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={updateDate}
                onChange={(e) => setUpdateDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Workers on Site
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                value={workersCount}
                onChange={(e) => setWorkersCount(e.target.value)}
                placeholder="e.g. 6"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Site Progress
              </label>
              <span className="text-xs font-bold text-amber-400">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer mt-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Work Completed Today *
          </label>
          <div className="relative">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3" />
            <textarea
              rows={3}
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              placeholder="e.g. Living room false ceiling framing completed; master bedroom wardrobe carcase assembled."
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Pending / In-Progress Tasks
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={workPending}
                onChange={(e) => setWorkPending(e.target.value)}
                placeholder="e.g. Kitchen electrical conduits half done"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Issues / Site Blockers
            </label>
            <div className="relative">
              <AlertCircle className="w-4 h-4 text-red-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                placeholder="e.g. Awaiting client confirmation on electrical switch points"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Tomorrow's Plan & Next Steps
          </label>
          <div className="relative">
            <ArrowRight className="w-4 h-4 text-blue-400 absolute left-3.5 top-3" />
            <textarea
              rows={2}
              value={nextDayTasks}
              onChange={(e) => setNextDayTasks(e.target.value)}
              placeholder="e.g. Gypsum board fixing on living room ceiling and painting primer coat"
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
            {loading ? 'Saving...' : isEdit ? 'Update Report' : 'Submit Daily Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
