// ==============================================================================
// APNI ESTATE INTERIORS - TASK MODAL (TEAM & SITE TASK CREATION / EDIT)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { 
  CheckSquare, 
  FolderKanban, 
  UserCheck, 
  Calendar, 
  Flag, 
  Sparkles, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  taskToEdit?: Task | null;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Completed', 'Cancelled'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  taskToEdit
}) => {
  const { addTask, updateTask, projects, teamMembers } = useApp();
  const { organization } = useAuth();

  const isEdit = Boolean(taskToEdit);

  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setProjectId(taskToEdit.project_id || taskToEdit.projectId || '');
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setAssignedTo(taskToEdit.assigned_to || '');
      setDueDate(taskToEdit.due_date || taskToEdit.dueDate || '');
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'To Do');
    } else {
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
      setPriority('Medium');
      setStatus('To Do');
    }
    setErrorMessage(null);
  }, [taskToEdit, defaultProjectId, projects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    setLoading(true);
    try {
      const assignedMember = teamMembers.find(m => m.id === assignedTo);
      const selectedProj = projects.find(p => p.id === projectId);

      if (isEdit && taskToEdit) {
        await updateTask(taskToEdit.id, {
          project_id: projectId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          assigned_to: assignedTo || undefined,
          due_date: dueDate || undefined,
          priority,
          status
        });
      } else {
        await addTask({
          organization_id: organization?.id || 'demo-org',
          project_id: projectId || undefined,
          projectId: projectId || undefined,
          projectName: selectedProj?.name,
          title: title.trim(),
          description: description.trim() || undefined,
          assigned_to: assignedTo || undefined,
          assigned_staff_name: assignedMember?.full_name,
          due_date: dueDate || undefined,
          dueDate: dueDate || undefined,
          priority,
          status
        });
      }
      onClose();
    } catch (err: any) {
      console.error('[TaskModal] Save error:', err);
      setErrorMessage(err.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Studio / Site Task' : 'Assign New Task'}
      subtitle={isEdit ? 'Update task progress and execution milestones.' : 'Delegate site inspections, CAD drawings, and vendor checkpoints.'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project association */}
          <div className="sm:col-span-2">
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
                <option value="">General Studio Task (No Project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CheckSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Inspect Master Bedroom Veneer Texture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Assigned Staff */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Assign Staff Member
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Priority Level
            </label>
            <div className="relative">
              <Flag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Task Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Task Instructions / Scope Details
            </label>
            <textarea
              rows={3}
              placeholder="Detail specific tolerances, checklist steps, or material specs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
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
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{isEdit ? 'Update Task' : 'Create Task'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
