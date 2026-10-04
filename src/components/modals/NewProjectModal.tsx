import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectType } from '../../types';
import { Sparkles, Phone, MapPin, IndianRupee, User, FolderKanban } from 'lucide-react';

const PRESET_COVERS = [
  { label: 'Luxury Living', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Modern Kitchen', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Artisan Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Boutique Villa', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Minimalist Penthouse', url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Executive Workspace', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
];

export const NewProjectModal: React.FC = () => {
  const { isNewProjectModalOpen, setIsNewProjectModalOpen, addProject, clients, addClient } = useApp();
  const { organization, isDemoMode } = useAuth();

  const [name, setName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [type, setType] = useState<ProjectType>('Residential');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 75);
    return d.toISOString().split('T')[0];
  });
  const [budget, setBudget] = useState('200000');
  const [contractValue, setContractValue] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClientChange = (val: string) => {
    setSelectedClientId(val);
    const found = clients.find(c => c.id === val);
    if (found) {
      setCustomClientName(found.name);
      if (found.phone) setClientPhone(found.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clientName = selectedClientId 
      ? (clients.find(c => c.id === selectedClientId)?.name || customClientName)
      : customClientName;

    if (!name.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }

    if (!clientName.trim()) {
      setErrorMessage('Client name is required. Please select or enter a client.');
      return;
    }

    const parsedBudget = parseFloat(budget.replace(/,/g, '')) || 0;
    if (parsedBudget < 0) {
      setErrorMessage('Budget must be greater than or equal to ₹0.');
      return;
    }

    const parsedContractValue = contractValue ? parseFloat(contractValue.replace(/,/g, '')) : undefined;
    if (parsedContractValue !== undefined && parsedContractValue < 0) {
      setErrorMessage('Contract value must be greater than or equal to ₹0.');
      return;
    }

    if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
      setErrorMessage('Deadline cannot be before the project start date.');
      return;
    }

    setLoading(true);
    try {
      let finalClientId = selectedClientId;

      // If user typed a new client name that doesn't exist yet, optionally create client record
      if (!finalClientId && customClientName.trim()) {
        try {
          const createdClient = await addClient({
            organization_id: organization?.id || 'demo-org',
            name: customClientName.trim(),
            phone: clientPhone.trim() || undefined
          });
          finalClientId = createdClient.id;
        } catch (clientErr) {
          console.warn('Auto client creation skipped:', clientErr);
        }
      }

      const finalCover = customImageUrl.trim() || coverImage;

      await addProject({
        organization_id: organization?.id,
        client_id: finalClientId || undefined,
        name: name.trim(),
        client: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        location: location.trim() || city,
        city: city || 'Mumbai',
        type,
        startDate,
        deadline,
        budget: parsedBudget,
        contract_value: parsedContractValue,
        description: description.trim() || 'Custom interior design project with turnkey execution.',
        coverImage: finalCover,
        status: 'On Track'
      });

      // Reset fields
      setName('');
      setSelectedClientId('');
      setCustomClientName('');
      setClientPhone('');
      setLocation('');
      setDescription('');
      setContractValue('');
      setCustomImageUrl('');
      setIsNewProjectModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isNewProjectModalOpen}
      onClose={() => setIsNewProjectModalOpen(false)}
      title="Create New Project"
      subtitle="Set up your project workspace, client details, and initial budget."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FolderKanban className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Snehil Residence, Oberoi Sky City 4BHK"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Client <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {clients.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">-- Choose existing client or enter new --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </select>
                  {!selectedClientId && (
                    <input
                      type="text"
                      required
                      placeholder="Or enter new client name..."
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Snehil Pandey, Vikram Kapoor"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="+91 98201 23456"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
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
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Location / Area
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
        </div>

        {/* Budget & Timeline */}
        <div className="p-3.5 sm:p-4 bg-brand-50/50 rounded-2xl border border-brand-100/60 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-900 mb-1.5">
              Total Budget (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                min="0"
                step="10000"
                placeholder="200000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-brand-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Contract Value (₹) <span className="text-slate-500 font-normal">(Optional Client Price)</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="e.g. 250000"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Handover
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Project Scope & Notes
          </label>
          <textarea
            rows={2}
            placeholder="Briefly describe key client preferences, scope of work (e.g., turnkey residential interior)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 focus:outline-none text-slate-800"
          />
        </div>

        {/* Cover Image Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Project Cover Photo
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
            {PRESET_COVERS.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  setCoverImage(preset.url);
                  setCustomImageUrl('');
                }}
                className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                  coverImage === preset.url && !customImageUrl
                    ? 'border-brand-600 ring-2 ring-brand-500/30 scale-105 shadow-sm'
                    : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[9px] py-0.5 text-center truncate px-1">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>

          <input
            type="url"
            placeholder="Or paste custom cover image URL..."
            value={customImageUrl}
            onChange={(e) => setCustomImageUrl(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none text-slate-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Create Project'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
