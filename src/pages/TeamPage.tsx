// ==============================================================================
// APNI ESTATE INTERIORS - TEAM & STAFF MANAGEMENT PAGE
// Multi-tenant staff directory and role assignment.
// Safe client architecture: No service_role key, real organization RLS.
// ==============================================================================

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { UserRole, StaffMember } from '../types';
import { formatDate } from '../utils/formatters';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  Sparkles, 
  Info,
  Building2,
  Crown,
  CheckCircle2,
  Palette,
  HardHat
} from 'lucide-react';
import { teamService } from '../services/teamService';

const ROLE_DISPLAY: Record<UserRole, { title: string; badge: string; icon: any }> = {
  owner: { title: 'Owner', badge: 'bg-amber-50 text-amber-800 border-amber-200', icon: Crown },
  admin: { title: 'Admin', badge: 'bg-purple-50 text-purple-800 border-purple-200', icon: ShieldCheck },
  designer: { title: 'Designer', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Palette },
  supervisor: { title: 'Supervisor', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: HardHat },
  member: { title: 'Staff', badge: 'bg-slate-50 text-slate-800 border-slate-200', icon: Users }
};

export const TeamPage: React.FC = () => {
  const { teamMembers, updateMemberRole } = useApp();
  const { profile, organization, isDemoMode, user } = useAuth();

  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);

  const isOwner = profile?.role === 'owner' || isDemoMode;

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (newRole === 'owner') {
      alert('Primary Owner role cannot be reassigned through this panel.');
      return;
    }
    setRoleUpdatingId(memberId);
    try {
      await updateMemberRole(memberId, newRole);
    } catch (err: any) {
      alert(err.message || 'Failed to update member role.');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Team & Staff Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
              {teamMembers.length} Staff Members
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage organization members, assign task responsibilities, and configure site supervisor access.
          </p>
        </div>
      </div>

      {/* Security Architecture & Invitation Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-indigo-900 text-xs leading-relaxed">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Multi-Tenant Access Governance:</strong> Each member profile is strictly isolated to your studio workspace (<span className="font-semibold">{organization?.name || 'Your Studio'}</span>).
          To invite additional team logins securely without exposing administrative master keys, invite them through your custom company domain or workspace admin onboarding.
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teamMembers.map((member) => {
          const roleKey = (member.role in ROLE_DISPLAY) ? (member.role as UserRole) : 'member';
          const roleInfo = ROLE_DISPLAY[roleKey];
          const RoleIcon = roleInfo.icon;
          const isCurrentUser = member.id === profile?.id || member.id === user?.id;
          const isTargetOwner = member.role === 'owner';

          return (
            <div
              key={member.id}
              className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrentUser ? 'border-brand-400 ring-2 ring-brand-500/10 shadow-md' : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                      alt={member.full_name}
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{member.full_name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                            You
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Member since {member.created_at ? formatDate(member.created_at) : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Badge / Role Selector */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Studio Role
                  </label>
                  {isOwner && !isCurrentUser && !isTargetOwner ? (
                    <div className="relative">
                      <select
                        value={member.role}
                        disabled={roleUpdatingId === member.id}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border focus:outline-none transition-colors ${roleInfo.badge}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="designer">Designer</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="member">Staff</option>
                      </select>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${roleInfo.badge}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      <span>{roleInfo.title}</span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Active Workspace</span>
                </span>
                <span>Role: {member.role}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
