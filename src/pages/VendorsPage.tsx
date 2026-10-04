// ==============================================================================
// APNI ESTATE INTERIORS - VENDORS DIRECTORY PAGE
// Multi-category supplier management, GST records, ratings & spend metrics
// ==============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Vendor, VendorCategory } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Star, 
  Edit2, 
  Trash2, 
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { VendorModal } from '../components/modals/VendorModal';
import { EmptyState } from '../components/common/EmptyState';
import { vendorScorecardService, VendorScorecard } from '../services/vendorScorecardService';
import { formatINR } from '../utils/formatters';

const CATEGORIES: ('All' | VendorCategory)[] = [
  'All',
  'Materials',
  'Furniture',
  'Electrical',
  'Plumbing',
  'Civil',
  'Hardware',
  'Fabric',
  'Lighting',
  'Glass',
  'Paint',
  'Other'
];

export const VendorsPage: React.FC = () => {
  const { vendors, addVendor, updateVendor, deleteVendor } = useApp();
  const { isDemoMode, organization } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | VendorCategory>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [scorecards, setScorecards] = useState<Record<string, VendorScorecard>>({});
  const [scorecardsLoading, setScorecardsLoading] = useState(!isDemoMode);
  const [scorecardsError, setScorecardsError] = useState('');

  useEffect(() => {
    if (isDemoMode || !organization?.id) {
      setScorecards({});
      setScorecardsError('');
      setScorecardsLoading(false);
      return;
    }
    let active = true;
    setScorecards({});
    setScorecardsError('');
    setScorecardsLoading(true);
    vendorScorecardService.getScorecards()
      .then(rows => {
        if (active) setScorecards(Object.fromEntries(rows.map(row => [row.vendor_id, row])));
      })
      .catch(err => {
        if (active) setScorecardsError(err instanceof Error ? err.message : 'Could not load vendor performance scorecards.');
      })
      .finally(() => { if (active) setScorecardsLoading(false); });
    return () => { active = false; };
  }, [isDemoMode, organization?.id]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
      const matchesSearch = 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.contact_person && v.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.phone && v.phone.includes(searchQuery)) ||
        (v.gst_number && v.gst_number.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [vendors, selectedCategory, searchQuery]);

  const handleSave = async (vendorData: Partial<Vendor>) => {
    if (vendorToEdit) {
      await updateVendor(vendorToEdit.id, vendorData);
    } else {
      await addVendor(vendorData);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Vendors & Suppliers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
              {vendors.length} Partners
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage material suppliers, bespoke fabricators, modular carpenters, and subcontractors.
          </p>
        </div>

        <button
          onClick={() => {
            setVendorToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>+ Add Vendor</span>
        </button>
      </div>

      {scorecardsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Vendor performance could not be loaded: {scorecardsError}</p>}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search vendor name, contact, phone, or GST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
          />
        </div>

        {/* Category Chips Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No vendors found"
          description="Register suppliers for plywood, hardware, sanitaryware, fabric, and lighting fixtures."
          actionLabel="+ Add First Vendor"
          onAction={() => {
            setVendorToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => {
            return (
              <div
                key={vendor.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold font-display text-base shrink-0">
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {vendor.name}
                        </h3>
                        {vendor.contact_person && (
                          <span className="text-xs text-slate-500 block">
                            👤 {vendor.contact_person}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {vendor.category}
                    </span>
                  </div>

                  {/* Rating Stars & GST */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{vendor.rating || 5}.0</span>
                    </div>

                    <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Vendor performance</span>
                        {scorecardsLoading ? <span className="text-[10px] text-slate-400">Calculating…</span> : scorecards[vendor.id] ? (
                          <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                            scorecards[vendor.id].overall_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                            scorecards[vendor.id].overall_score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>{scorecards[vendor.id].overall_score}/100</span>
                        ) : <span className="text-[10px] text-slate-400">{isDemoMode ? 'Requires recorded PO & GRN data' : 'No purchasing history'}</span>}
                      </div>
                      {scorecards[vendor.id] && (
                        <>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                            <div><p className="text-slate-400">Price</p><p className="font-extrabold text-slate-700">{scorecards[vendor.id].comparable_price_score}/100</p></div>
                            <div><p className="text-slate-400">Quality</p><p className="font-extrabold text-slate-700">{scorecards[vendor.id].quality_score}/100</p></div>
                            <div><p className="text-slate-400">Delivery</p><p className="font-extrabold text-slate-700">{scorecards[vendor.id].delivery_score}/100</p></div>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-500">
                            {scorecards[vendor.id].order_count} orders · {scorecards[vendor.id].project_count} projects · {formatINR(scorecards[vendor.id].total_purchase_value)} · {scorecards[vendor.id].average_delivery_delay_days}d avg delay · {scorecards[vendor.id].rejected_quantity} rejected
                          </p>
                        </>
                      )}
                    </div>

                    {vendor.gst_number ? (
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>GST: {vendor.gst_number}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No GST registered</span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {vendor.phone && (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="flex items-center gap-2 hover:text-brand-600 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vendor.phone}</span>
                      </a>
                    )}
                    {vendor.email && (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="flex items-center gap-2 hover:text-brand-600 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </a>
                    )}
                    {vendor.address && (
                      <div className="flex items-start gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{vendor.address}</span>
                      </div>
                    )}
                  </div>

                  {vendor.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 italic border border-slate-100">
                      "{vendor.notes}"
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Active Supplier
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setVendorToEdit(vendor);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete vendor "${vendor.name}"?`)) {
                          deleteVendor(vendor.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
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

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        vendorToEdit={vendorToEdit}
      />
    </div>
  );
};
