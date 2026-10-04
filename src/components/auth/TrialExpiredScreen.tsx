import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, 
  ShieldCheck, 
  Check, 
  Building2, 
  Zap, 
  Crown, 
  LogOut, 
  Mail, 
  PhoneCall, 
  Sparkles 
} from 'lucide-react';

export const TrialExpiredScreen: React.FC = () => {
  const { organization, profile, signOut } = useAuth();

  const plans = [
    {
      id: 'Starter',
      name: 'Starter',
      price: '₹3,000',
      period: '/ month',
      badge: null,
      description: 'Ideal for freelance designers managing single turnkey projects.',
      features: [
        '1 active project workspace',
        'Budget & expense tracking',
        'Project photo gallery',
        'Expense PDF receipts',
        'Basic calendar schedule'
      ],
      icon: Zap
    },
    {
      id: 'Studio',
      name: 'Studio',
      price: '₹5,000',
      period: '/ month',
      badge: 'Most Popular',
      description: 'Perfect for growing boutique studios handling multiple clients.',
      features: [
        'Up to 4 active projects',
        'Live budget health alerts',
        'Vendor & contractor logs',
        'Categorized expense donut charts',
        'Client decision & site notes',
        'Priority email & chat support'
      ],
      icon: Building2,
      popular: true
    },
    {
      id: 'Pro',
      name: 'Pro',
      price: '₹7,000',
      period: '/ month',
      badge: 'Unlimited Power',
      description: 'Designed for established interior design firms and turnkey contractors.',
      features: [
        '10+ active projects simultaneously',
        'Advanced category budget breakdown',
        'Team supervisor access',
        'Custom client export reports',
        'Dedicated account specialist'
      ],
      icon: Crown
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col justify-between p-6 relative font-sans">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg text-white">Apni Estate</div>
            <div className="text-[10px] font-bold tracking-widest text-brand-400 uppercase bg-brand-950/80 px-1.5 py-0.5 rounded border border-brand-800/50 w-fit">
              INTERIORS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">{profile?.full_name || 'Studio Owner'}</div>
            <div className="text-[11px] text-slate-400">{organization?.name || 'Studio'}</div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Center Notice & Upgrade Cards */}
      <main className="max-w-5xl mx-auto w-full my-8 relative z-10 space-y-8 text-center">
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Your 15-day trial has ended
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your projects, clients, and expense records for <strong className="text-white">{organization?.name || 'your studio'}</strong> are safely preserved in our database. Choose a plan below or contact us to activate your subscription.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all bg-slate-900/90 backdrop-blur-xl ${
                  plan.popular
                    ? 'border-2 border-brand-500 shadow-xl shadow-brand-500/10'
                    : 'border border-slate-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${plan.popular ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-300'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{plan.name}</span>
                  </div>

                  <div className="mb-2">
                    <span className="text-3xl font-extrabold font-display text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400 ml-1">{plan.period}</span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="space-y-2.5 mb-6 border-t border-slate-800 pt-4">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const subject = encodeURIComponent(`Subscription Activation: ${plan.name} Plan (${organization?.name || 'My Studio'})`);
                    const body = encodeURIComponent(`Hi Apni Estate Team,\n\nWe would like to activate the ${plan.name} Plan (${plan.price}${plan.period}) for our studio: ${organization?.name || ''}.\n\nStudio Owner: ${profile?.full_name || ''}\nPhone: ${profile?.phone || ''}`);
                    window.location.href = `mailto:billing@apniestateinteriors.com?subject=${subject}&body=${body}`;
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    plan.popular
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Choose {plan.name} Plan
                </button>
              </div>
            );
          })}
        </div>

        {/* Contact Strip */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Need custom team onboarding or enterprise billing?</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="mailto:support@apniestateinteriors.com" className="font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Support</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 relative z-10">
        © 2026 Apni Estate Interiors. Your data is encrypted and permanently preserved.
      </footer>
    </div>
  );
};
