import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Project, ProjectStatus, ProjectType } from '../../types';
import { FolderKanban, User, MapPin, IndianRupee, Calendar, FileText, Activity } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const PROJECT_TYPES: ProjectType[] = ['Residential', 'Commercial', 'Hospitality', 'Retail', 'Other'];
const PROJECT_STATUSES: ProjectStatus[] = ['On Track', 'Needs Attention', 'Budget Alert', 'Delayed', 'Completed'];

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const { updateProject, clients } = useApp();
  const { isDemoMode } = useAuth();

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<ProjectType>('Residential');
  const [budget, setBudget] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProjectStatus>('On Track');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClientId(project.client_id || '');
      setClientName(project.client || '');
      setLocation(project.location || '');
      setType(project.type || 'Residential');
      setBudget(project.budget ? String(project.budget) : '');
      setContractValue(project.contract_value ? String(project.contract_value) : '');
      setStartDate(project.startDate || '');
      setDeadline(project.deadline || '');
      setProgress(project.progress || 0);
      setStatus(project.status || 'On Track');
      setDescription(project.description || '');
    }
    setErrorMessage(null);
  }, [project, isOpen]);

  const handleClientSelect = (selectedId: string) => {
    setClientId(selectedId);
    const foundClient = clients.find(c => c.id === selectedId);
    if (foundClient) {
      setClientName(foundClient.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!project) return;
    if (!name.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }

    const numBudget = Number(budget) || 0;
    if (numBudget < 0) {
      setErrorMessage('Budget must be greater than or equal to ₹0.');
      return;
    }

    const numContractValue = contractValue ? Number(contractValue) : undefined;
    if (numContractValue !== undefined && numContractValue < 0) {
      setErrorMessage('Contract value must be greater than or equal to ₹0.');
      return;
    }

    if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
      setErrorMessage('Deadline cannot be before the start date.');
      return;
    }

    setLoading(true);
    try {
      await updateProject(project.id, {
        name: name.trim(),
        client_id: clientId || undefined,
        client: clientName.trim() || project.client,
        location: location.trim(),
        city: location.trim(),
        type,
        budget: numBudget,
        contract_value: numContractValue,
        startDate: startDate || project.startDate,
        deadline: deadline || project.deadline,
        progress: Number(progress) || 0,
        status,
        description: description.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update project.');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project Details"
      subtitle="Modify project parameters, client assignment, timeline and budget allocations."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Snehil Residence, Oberoi Sky City 4BHK"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Assigned Client
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {clients.length > 0 ? (
                <select
                  value={clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="">{clientName ? `${clientName} (Current)` : 'Select or change client...'}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Client Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Location / City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Bandra West, Mumbai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Project Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProjectType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Health Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Total Budget (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="text-slate-400 font-semibold absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">₹</span>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="200000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Contract Value (₹) <span className="text-slate-400 font-normal">(Client Price)</span>
            </label>
            <div className="relative">
              <span className="text-slate-400 font-semibold absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">₹</span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="e.g. 250000"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Overall Project Progress ({progress}%)
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
            Project Description / Scope Notes
          </label>
          <textarea
            rows={2}
            placeholder="Brief scope summary..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none leading-relaxed"
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
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <span>Saving...</span> : <span>Save Changes</span>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
