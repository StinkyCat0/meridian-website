// src/pages/Dashboard.jsx - Production Dashboard with Billing + Chat
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ShieldCheck, Mail, MessageSquare, CreditCard, ExternalLink } from 'lucide-react';
import { CRM_URL } from '../../../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage (set during login)
    const storedUser = localStorage.getItem('meridian_user');
    const token = localStorage.getItem('meridian_token');
    
    if (!token || !storedUser) {
      // Not authenticated, redirect to login
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error('Failed to parse user:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('meridian_token');
    localStorage.removeItem('meridian_user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-tight">Meridian Studios</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.role}</p>
            </div>
            {CRM_URL && (
              <a
                href={`${CRM_URL}/`}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink size={14} /> Open CRM
              </a>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Welcome Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-slate-400">
              You're logged in as <span className="text-indigo-400 font-bold">{user?.role}</span>. 
              Select an action below to get started.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 🔐 Password Reset Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-6 cursor-pointer hover:border-indigo-500/50 transition-colors"
              onClick={() => navigate('/dashboard?tab=password-reset')}
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4">
                <Mail className="text-indigo-400" size={24} />
              </div>
              <h3 className="font-bold uppercase tracking-tight mb-2">Password Reset</h3>
              <p className="text-slate-400 text-sm">Send password reset emails via antonio@meridianstudios.org</p>
            </motion.div>

            {/* 💳 Billing & Subscription Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-6 cursor-pointer hover:border-emerald-500/50 transition-colors"
              onClick={() => navigate('/dashboard/billing')}
            >
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="text-emerald-400" size={24} />
              </div>
              <h3 className="font-bold uppercase tracking-tight mb-2">Billing & Subscription</h3>
              <p className="text-slate-400 text-sm">Manage your plan, payment methods, and invoices</p>
            </motion.div>

            {/* 💬 Chat Card - FIXED: Use /dashboard/chat route */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-6 cursor-pointer hover:border-purple-500/50 transition-colors"
              onClick={() => navigate('/dashboard/chat')}  // ← FIXED: Was '/dashboard?tab=chat'
            >
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="text-purple-400" size={24} />
              </div>
              <h3 className="font-bold uppercase tracking-tight mb-2">Team Chat</h3>
              <p className="text-slate-400 text-sm">Discord-style real-time messaging with Socket.io</p>
            </motion.div>

            {/* ⚙️ Settings Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-6 cursor-pointer hover:border-slate-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-slate-600/20 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="text-slate-400" size={24} />
              </div>
              <h3 className="font-bold uppercase tracking-tight mb-2">Account Settings</h3>
              <p className="text-slate-400 text-sm">Manage your profile, security, and preferences</p>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Active Sessions', value: '1', color: 'indigo' },
              { label: 'Last Login', value: 'Just now', color: 'emerald' },
              { label: 'Account Status', value: 'Active', color: 'purple' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
