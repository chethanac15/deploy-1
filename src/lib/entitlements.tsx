// ==============================================================================
// APNI ESTATE INTERIORS - PLAN ENTITLEMENTS & FEATURE CAPABILITY ENGINE
// Centralized, non-intrusive gating. No scattered string checks.
// Undecided limits are configurable/TBD without inventing business policies.
// ==============================================================================

import React from 'react';
import { Organization, SubscriptionStatus } from '../types';

export type CommercialPlan = 'basic' | 'professional' | 'enterprise';

export type LegacyPlan = 'starter' | 'studio' | 'pro';

export type AppPlan = CommercialPlan | LegacyPlan;

export type FeatureKey =
  | 'leads'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'documents'
  | 'boq'
  | 'expenses'
  | 'budget'
  | 'materials'
  | 'milestones'
  | 'dpr'
  | 'photos'
  | 'vendors'
  | 'purchases'
  | 'client_payments'
  | 'profitability'
  | 'custom_roles'
  | 'multi_branch'
  | 'approval_workflows'
  | 'management_analytics'
  | 'data_export'
  | 'company_settings';

export interface PlanDefinition {
  id: CommercialPlan;
  name: string;
  priceINR: number;
  period: string;
  description: string;
  features: FeatureKey[];
  // Undecided limits are left undefined/null or configurable, NOT hardcoded as fake limits
  projectLimit?: number | null;
  userLimit?: number | null;
}

export const COMMERCIAL_PLANS: Record<CommercialPlan, PlanDefinition> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    priceINR: 3000,
    period: '/ month',
    description: 'Essential toolkit for small interior studios and individual contractors.',
    features: [
      'leads',
      'clients',
      'projects',
      'tasks',
      'documents',
      'boq',
      'expenses',
      'budget',
      'materials',
      'milestones',
      'dpr',
      'photos',
      'company_settings'
    ],
    projectLimit: null, // Configurable by admin / TBD
    userLimit: null
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceINR: 6000,
    period: '/ month',
    description: 'Comprehensive operational suite with procurement, payments, and team roles.',
    features: [
      'leads',
      'clients',
      'projects',
      'tasks',
      'documents',
      'boq',
      'expenses',
      'budget',
      'materials',
      'milestones',
      'dpr',
      'photos',
      'vendors',
      'purchases',
      'client_payments',
      'profitability',
      'custom_roles',
      'data_export',
      'company_settings'
    ],
    projectLimit: null,
    userLimit: null
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceINR: 10000,
    period: '/ month',
    description: 'Multi-branch operations, approval governance, and executive analytics.',
    features: [
      'leads',
      'clients',
      'projects',
      'tasks',
      'documents',
      'boq',
      'expenses',
      'budget',
      'materials',
      'milestones',
      'dpr',
      'photos',
      'vendors',
      'purchases',
      'client_payments',
      'profitability',
      'custom_roles',
      'data_export',
      'multi_branch',
      'approval_workflows',
      'management_analytics',
      'company_settings'
    ],
    projectLimit: null,
    userLimit: null
  }
};

/**
 * Maps legacy schema plan values ('starter', 'studio', 'pro') cleanly to modern commercial tiers.
 */
export function normalizePlanTier(plan?: string | null): CommercialPlan {
  if (!plan) return 'basic';
  const lower = plan.toLowerCase().trim();
  if (lower === 'starter' || lower === 'basic') return 'basic';
  if (lower === 'studio' || lower === 'professional' || lower === 'pro') return 'professional';
  if (lower === 'enterprise') return 'enterprise';
  return 'basic';
}

/**
 * Authoritative check to determine if an organization has access to a specific feature.
 * Preserves 15-day trial and demo workspace accessibility without assuming trial users
 * automatically receive Enterprise features unless their plan is Enterprise.
 */
export function canUseFeature(
  org: Organization | null | undefined,
  feature: FeatureKey,
  options: { isDemoMode?: boolean; isTrialActive?: boolean } = {}
): boolean {
  // 1. Demo Workspace always has full preview capability
  if (options.isDemoMode) {
    return true;
  }

  // 2. Resolve plan tier from organization record
  const planTier = normalizePlanTier(org?.plan);
  const planDef = COMMERCIAL_PLANS[planTier];

  // 3. Fallback if planDef not found
  if (!planDef) return true;

  // 4. Feature check based on the organization's plan tier (trial or active)
  return planDef.features.includes(feature);
}

/**
 * Retrieve plan definition object safely
 */
export function getPlanDetails(plan?: string | null): PlanDefinition {
  const normalized = normalizePlanTier(plan);
  return COMMERCIAL_PLANS[normalized];
}

/**
 * Declarative component for feature-gated UI sections
 */
export interface PlanGateProps {
  feature: FeatureKey;
  org?: Organization | null;
  isDemoMode?: boolean;
  isTrialActive?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PlanGate: React.FC<PlanGateProps> = ({
  feature,
  org,
  isDemoMode = false,
  isTrialActive = false,
  children,
  fallback = null
}) => {
  const allowed = canUseFeature(org, feature, { isDemoMode, isTrialActive });
  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
