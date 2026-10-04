// ==============================================================================
// APNI ESTATE INTERIORS - COMPANY SETTINGS & COMMERCIAL CONFIGURATION
// Additive company details, billing preferences, and commercial limit foundations
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { companyService } from '../services/companyService';
import { 
  Building, 
  IndianRupee, 
  RotateCcw, 
  Save, 
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  Lock,
  Globe,
  Mail,
  Phone,
  FileText,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const SettingsPage: React.FC = () => {
  const { resetToDemoData, setIsPricingModalOpen } = useApp();
  const { user, profile, organization, isDemoMode, trialStatus, daysRemaining } = useAuth();

  // Basic Profile
  const [studioName, setStudioName] = useState('Mehta Design Studio');
  const [ownerName, setOwnerName] = useState('Aarav Mehta');
  const [email, setEmail] = useState('aarav@studio.com');
  const [phone, setPhone] = useState('+91 98201 55901');

  // Enterprise Company Configuration
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [financialYearStart, setFinancialYearStart] = useState('April');

  // Commercial Limit Foundations (Nullable / Configurable)
  const [maxUsers, setMaxUsers] = useState<number | null>(null);
  const [maxActiveProjects, setMaxActiveProjects] = useState<number | null>(null);
  const [maxBranches, setMaxBranches] = useState<number | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setOwnerName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
    if (user?.email) {
      setEmail(user.email);
    }
    if (organization) {
      setStudioName(organization.name || '');
      setCompanyEmail(organization.company_email || organization.name ? `${organization.name.toLowerCase().replace(/\s+/g, '')}@studio.com` : '');
      setCompanyPhone(organization.company_phone || profile?.phone || '');
      setWebsite(organization.website || '');
      setGstNumber(organization.gst_number || '');
      setAddress(organization.address || '');
      setCity(organization.city || 'Mumbai');
      setState(organization.state || 'Maharashtra');
      setPincode(organization.pincode || '');
      setCurrency(organization.currency || 'INR');
      setFinancialYearStart(organization.financial_year_start || 'April');
      setMaxUsers(organization.max_users ?? null);
      setMaxActiveProjects(organization.max_active_projects ?? null);
      setMaxBranches(organization.max_branches ?? null);
    }
  }, [profile, user, organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!isDemoMode && organization?.id) {
        await companyService.updateCompanySettings(organization.id, {
          name: studioName,
          company_email: companyEmail,
          company_phone: companyPhone,
          website: website,
          gst_number: gstNumber,
          address: address,
          city: city,
          state: state,
          pincode: pincode,
          currency: currency,
          financial_year_start: financialYearStart
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error('[Settings] Save failed:', err);
      alert(err.message || 'Failed to save company settings');
    } finally {
      setIsSaving(false);
    }
  };

  const planDisplayName = organization?.plan ? organization.plan.toUpperCase() : 'STUDIO';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            Company & Studio Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure studio legal identity, regional currencies, commercial limits, and accounting parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Studio & Profile Information */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold font-display text-slate-900">Studio & Profile Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Company / Studio Name</label>
              <input
                type="text"
                value={studioName}
                onChange={e => setStudioName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Owner / Principal</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Login Email</label>
              <input
                type="email"
                disabled={!isDemoMode}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none cursor-not-allowed"
                title="Account email is managed through authentication"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Enterprise Company Legal & Business Details */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold font-display text-slate-900">Legal Entity & Billing Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">GSTIN / Tax Identification</label>
              <input
                type="text"
                placeholder="27ABCDE1234F1Z5"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Company Website</label>
              <input
                type="url"
                placeholder="https://www.apniestate.in"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Official Billing Email</label>
              <input
                type="email"
                placeholder="billing@apniestate.in"
                value={companyEmail}
                onChange={e => setCompanyEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Official Business Phone</label>
              <input
                type="tel"
                placeholder="+91 22 2640 1200"
                value={companyPhone}
                onChange={e => setCompanyPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Head Office Address</label>
              <input
                type="text"
                placeholder="14th Road, Off Linking Road, Bandra West"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">State & Pincode</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Accounting & Financial Preferences */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold font-display text-slate-900">Currency & Accounting Preferences</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Operating Base Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="INR">Indian Rupee (₹ INR - Lakhs & Crores)</option>
                <option value="AED">UAE Dirham (AED)</option>
                <option value="USD">US Dollar ($ USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Financial Year Start</label>
              <select
                value={financialYearStart}
                onChange={e => setFinancialYearStart(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="April">April 1st (Indian Standard Fiscal Year)</option>
                <option value="January">January 1st (Calendar Year)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Commercial Limit Foundation (Configurable & Nullable) */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold font-display text-slate-900">Commercial Limits Foundation</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              Configurable Entitlements
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Current account caps. Unrestricted / Null limits indicate open studio scalability without hard platform thresholds.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Max Team Users
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {maxUsers !== null ? `${maxUsers} Users` : 'Unlimited / Not Capped'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Configured by administrator</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Max Active Projects
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {maxActiveProjects !== null ? `${maxActiveProjects} Active Sites` : 'Unlimited / Not Capped'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Configured by administrator</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Max Studios / Branches
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {maxBranches !== null ? `${maxBranches} Locations` : 'Unlimited / Not Capped'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Configured by administrator</span>
            </div>
          </div>
        </div>

        {/* 5. Subscription Status */}
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold font-display text-slate-900">Subscription & 15-Day Trial Status</h2>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
              trialStatus === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {trialStatus === 'active' ? 'Active Subscription' : isDemoMode ? 'Demo Sandbox' : `Trial (${daysRemaining} days left)`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Current Tier</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900">{planDisplayName} Plan</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Commercial studio entitlement</div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>Trial Started</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {organization?.trial_started_at ? formatDate(organization.trial_started_at) : 'Active Session'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">15 days trial duration</div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-500" />
                <span>Trial Expiration</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {organization?.trial_ends_at ? formatDate(organization.trial_ends_at) : '15 Days Remaining'}
              </div>
              <div className="text-[11px] text-brand-600 font-semibold mt-0.5">{daysRemaining} days remaining</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">Need to upgrade or change commercial tiers?</span>
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
            >
              View Plan Upgrades →
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {isDemoMode && !user && import.meta.env.DEV ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset demo state to initial projects and expenses?')) {
                  resetToDemoData();
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2000);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Company preferences updated!</span>
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
