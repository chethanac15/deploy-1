// ==============================================================================
// APNI ESTATE INTERIORS - COMMERCIAL PRICING & PLAN TIERS MODAL
// ==============================================================================

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Check, Sparkles, Zap, Building2, Crown, Wrench } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PricingModal: React.FC = () => {
  const { isPricingModalOpen, setIsPricingModalOpen } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'Basic' | 'Professional' | 'Enterprise'>('Professional');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleStartTrial = (planName: string) => {
    setSelectedPlan(planName as any);
    setIsSuccess(true);
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (e) {}

    setTimeout(() => {
      setIsSuccess(false);
      setIsPricingModalOpen(false);
    }, 2200);
  };

  const plans = [
    {
      id: 'Basic',
      name: 'Basic',
      price: '₹3,000',
      period: '/ month',
      badge: null,
      description: 'For small interior firms, individual designers, and contractors.',
      features: [
        'Client & lead management',
        'Project & room management',
        'Task & team assignments',
        'Site progress & milestone tracking',
        'Site photos & document vault',
        'BOQ estimation & costing',
        'Expense tracking & live budget engine',
        'Overview dashboard & cashflow reports'
      ],
      icon: Zap
    },
    {
      id: 'Professional',
      name: 'Professional',
      price: '₹6,000',
      period: '/ month',
      badge: 'Most Popular',
      description: 'Complete operational suite with vendor procurement and payment tracking.',
      features: [
        'Everything in Basic, plus:',
        'Advanced BOQ & costing breakdown',
        'Vendor directory & contractor logs',
        'Purchase & procurement orders',
        'Material inventory IN-OUT tracking',
        'Client payment & milestone collection',
        'DPR daily site reporting',
        'Project profitability analytics',
        'Role-based staff permissions'
      ],
      icon: Building2,
      popular: true
    },
    {
      id: 'Enterprise',
      name: 'Enterprise',
      price: '₹10,000',
      period: '/ month',
      badge: 'Multi-Branch & Scale',
      description: 'Advanced governance for multi-branch firms and large turnkey studios.',
      features: [
        'Everything in Professional, plus:',
        'Multi-branch management & switching',
        'Advanced analytics & management reports',
        'Expense & purchase approval workflows',
        'Custom staff roles & granular access',
        'Safe CSV data export & backups',
        'Dedicated onboarding & account support',
        'Custom company configuration & GST'
      ],
      icon: Crown
    }
  ];

  return (
    <Modal
      isOpen={isPricingModalOpen}
      onClose={() => setIsPricingModalOpen(false)}
      title="Commercial Studio Plans & Pricing"
      subtitle="Spend less time managing spreadsheets. Run your entire interior turnkey studio with confidence."
      maxWidth="3xl"
    >
      {isSuccess ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold font-display text-slate-900 mb-2">15-Day Free Trial Active!</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            You are now exploring the <strong className="text-slate-900">{selectedPlan} Plan</strong>. You have unrestricted access to studio features.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    plan.popular
                      ? 'border-2 border-brand-600 bg-brand-50/30 shadow-lg ring-4 ring-brand-500/10'
                      : 'border border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[11px] font-extrabold tracking-wide uppercase shadow-sm whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${plan.popular ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-700'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{plan.name}</span>
                    </div>

                    <div className="mb-2">
                      <span className="text-3xl font-extrabold font-display text-slate-900">{plan.price}</span>
                      <span className="text-xs text-slate-500 font-medium ml-1">{plan.period}</span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="space-y-2.5 mb-6 border-t border-slate-100 pt-4">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTrial(plan.name)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      plan.popular
                        ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/25 hover:shadow-lg'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Select {plan.name} Plan
                  </button>
                </div>
              );
            })}
          </div>

          {/* Setup & Implementation Package Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white font-display">Setup & Guided Implementation</span>
                  <span className="text-xs font-extrabold text-brand-400 bg-brand-950 px-2 py-0.5 rounded border border-brand-800/60">₹35,000</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Workspace setup, employee onboarding, workflow configuration, initial data import, BOQ templates & go-live training.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 shrink-0 self-start sm:self-auto">One-time Service Scope</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>15-Day Free Trial on signup. No credit card required.</span>
            </div>
            <span className="font-semibold text-slate-900 hidden sm:inline">100% Risk-Free Studio Onboarding</span>
          </div>
        </div>
      )}
    </Modal>
  );
};
