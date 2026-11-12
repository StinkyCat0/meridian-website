// src/pages/Billing.jsx - Subscription Management UI
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CreditCard, Shield, Zap, AlertCircle } from 'lucide-react';

export default function Billing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('meridian_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user profile
    fetch('https://meridianstudios.org/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data._id) {
          setUser(data);
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleCheckout = async (plan) => {
    setProcessingPlan(plan);
    setError('');
    
    try {
      const token = localStorage.getItem('meridian_token');
      const res = await fetch('https://meridianstudios.org/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, userId: user._id })
      });
      
      const data = await res.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to create checkout session');
        setProcessingPlan(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to connect to payment processor. Please try again.');
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('meridian_token');
      const res = await fetch('https://meridianstudios.org/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to open billing portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setError('Failed to connect to billing portal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Loading Billing...</p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        'Basic dashboard access',
        'Community chat rooms',
        'Email support',
        '1 project limit'
      ],
      cta: 'Current Plan',
      disabled: user?.subscription?.plan === 'free',
      color: 'slate',
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9',
      period: '/month',
      features: [
        'Everything in Free',
        'Priority email support',
        'Advanced analytics dashboard',
        'Custom branding options',
        '5 projects'
      ],
      cta: 'Upgrade to Basic',
      disabled: user?.subscription?.plan === 'basic',
      color: 'indigo',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: [
        'Everything in Basic',
        'Real-time Discord-style chat',
        'Full API access',
        'Team collaboration tools',
        'Advanced security features',
        'Unlimited projects'
      ],
      cta: 'Upgrade to Pro',
      disabled: user?.subscription?.plan === 'pro',
      color: 'purple',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-black uppercase tracking-tight">Billing & Subscription</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Manage your plan and payment methods</p>
          </div>
          {user?.subscription?.status === 'active' && (
            <span className="px-3 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-500/30">
              {user.subscription.plan?.toUpperCase()} Plan
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Current Subscription Status */}
        {user?.subscription?.status && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 mb-12"
          >
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">Current Subscription</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Plan</p>
                <p className="text-lg font-bold capitalize">{user.subscription.plan || 'Free'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</p>
                <p className={`text-lg font-bold capitalize ${
                  user.subscription.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                }`}>{user.subscription.status}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Renews</p>
                <p className="text-lg font-bold">
                  {user.subscription.currentPeriodEnd 
                    ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Customer ID</p>
                <p className="text-sm font-mono text-slate-400 truncate max-w-[150px]">
                  {user.subscription.stripeCustomerId?.slice(-8) || 'Not connected'}
                </p>
              </div>
            </div>
            {user.subscription.stripeCustomerId && (
              <button
                onClick={handleManageSubscription}
                className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <CreditCard size={14} /> Manage Subscription →
              </button>
            )}
          </motion.div>
        )}

        {/* Pricing Plans */}
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-center">Choose Your Plan</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Upgrade anytime. Cancel anytime. All plans include secure Stripe processing.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-slate-900/40 backdrop-blur-xl border rounded-[1.5rem] p-8 ${
                plan.popular 
                  ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' 
                  : 'border-white/5 hover:border-white/10'
              } transition-all`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-lg">
                  Most Popular
                </span>
              )}
              
              <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => !plan.disabled && handleCheckout(plan.id)}
                disabled={plan.disabled || processingPlan === plan.id}
                className={`w-full py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                  plan.disabled
                    ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                    : processingPlan === plan.id
                    ? 'bg-slate-600 text-slate-300 cursor-wait'
                    : `bg-${plan.color}-600 hover:bg-${plan.color}-500 text-white shadow-lg hover:shadow-xl`
                }`}
              >
                {processingPlan === plan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="mt-8 text-red-400 text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2"
          >
            <AlertCircle size={16} /> {error}
          </motion.p>
        )}

        {/* Security Notice */}
        <div className="mt-16 text-center text-slate-500 text-sm border-t border-white/5 pt-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-bold uppercase tracking-widest text-[10px] text-emerald-400">Secure Payments</span>
          </div>
          <p className="max-w-md mx-auto">
            All transactions are processed securely by Stripe. We never store your card details on our servers.
          </p>
          <div className="flex justify-center gap-4 mt-4 text-[10px] text-slate-600 uppercase tracking-wider">
            <span>PCI DSS Compliant</span>
            <span>•</span>
            <span>256-bit SSL</span>
            <span>•</span>
            <span>GDPR Ready</span>
          </div>
        </div>
      </main>
    </div>
  );
}
