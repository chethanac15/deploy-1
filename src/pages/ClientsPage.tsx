import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Client } from '../types';
import { formatINR } from '../utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  FolderKanban, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Building2,
  FileText,
  UserPlus
} from 'lucide-react';
import { ClientModal } from '../components/modals/ClientModal';

export const ClientsPage: React.FC = () => {
  const { clients, projects, deleteClient, openProjectDetail, setCurrentPage, setSelectedProjectId, setIsNewProjectModalOpen } = useApp();
  const { isDemoMode } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  // Aggregate project statistics for each client
  const clientStatsMap = useMemo(() => {
    const map = new Map<string, { count: number; totalBudget: number; projectList: typeof projects }>();
    
    clients.forEach(c => {
      const clientProjects = projects.filter(p => p.client_id === c.id || p.client.toLowerCase() === c.name.toLowerCase());
      const totalBudget = clientProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
      map.set(c.id, {
        count: clientProjects.length,
        totalBudget,
        projectList: clientProjects
      });
    });

    return map;
  }, [clients, projects]);

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const handleAdd = () => {
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Users className="w-5 h-5" />
            </div>
            Client Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Manage your homeowner & commercial clients, contact details, and linked project portfolios.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search Bar & Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="text-xs font-bold text-slate-700 self-end sm:self-center pr-2">
          Total Clients: <span className="text-slate-900 font-extrabold">{clients.length}</span>
        </div>
      </div>

      {/* Client List or Empty State */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {clients.length === 0 ? 'No clients yet' : 'No clients found matching your search'}
          </h3>
          <p className="text-xs text-slate-700 font-medium max-w-md mx-auto mb-5">
            {clients.length === 0
              ? 'Add your first interior design client to organize their contact info and link them with active projects.'
              : 'Try searching with a different client name, phone number, or email.'}
          </p>
          {clients.length === 0 && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Your First Client</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const stats = clientStatsMap.get(client.id) || { count: 0, totalBudget: 0, projectList: [] };
            const latestProject = stats.projectList[0];

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {client.name}
                        </h3>
                        {client.address && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{client.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(client)}
                        title="Edit Client"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client)}
                        title="Delete Client"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 py-2 border-t border-b border-slate-100 text-xs">
                    {client.phone && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.notes && (
                      <div className="flex items-start gap-2 text-slate-700 text-[11px] mt-1 bg-slate-50 p-2 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{client.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Portfolio & Project Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Projects</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-brand-600" />
                        {stats.count}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total Value</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {formatINR(stats.totalBudget)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Projects footer / Quick actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {latestProject ? (
                    <button
                      onClick={() => openProjectDetail(latestProject.id)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group/btn"
                    >
                      <span className="truncate max-w-[160px]">{latestProject.name}</span>
                      <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-600 font-medium">No projects linked</span>
                  )}

                  <button
                    onClick={() => {
                      setIsNewProjectModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    + New Project
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Modal for Add/Edit */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clientToEdit={clientToEdit}
      />

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete Client: {clientToDelete.name}?
            </h3>
            <p className="text-xs text-slate-700 font-medium mb-4">
              Are you sure you want to delete this client record? Note: If this client has active linked projects, those projects will remain in your workspace.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
