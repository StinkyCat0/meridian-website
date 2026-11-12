// src/pages/Login.jsx - FINAL PRODUCTION VERSION
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, ArrowRight, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();

  // 🔑 CRITICAL: Empty string = relative paths (production)
  // This ensures fetch("/api/auth/login") not fetch("http://localhost:2000/api/auth/login")
  const API_BASE = import.meta.env.VITE_API_URL || '';

  // 🔍 DEBUG: Log at component mount (remove in final production)
  useEffect(() => {
    console.log('🔍 Login.jsx MOUNTED');
    console.log('🔍 API_BASE value:', JSON.stringify(API_BASE));
    console.log('🔍 Fetch URL will be:', `${API_BASE}/api/auth/login`);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 🔑 CRITICAL: Relative path - nginx will proxy /api/* to backend:2000
      const fetchUrl = `${API_BASE}/api/auth/login`;
      console.log('🔍 Fetching:', fetchUrl);
      
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          password: form.password 
        }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        // Store auth data
        localStorage.setItem('meridian_token', data.token);
        localStorage.setItem('meridian_user', JSON.stringify(data.user));
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('❌ Login error:', {
        name: err.name,
        message: err.message,
        fetchUrl: `${API_BASE}/api/auth/login`,
        API_BASE: JSON.stringify(API_BASE)
      });
      
      // User-friendly error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Is the backend running?');
      } else {
        setError('Server connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const fetchUrl = `${API_BASE}/api/auth/forgot-password`;
      console.log('🔍 Fetching:', fetchUrl);
      
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setError('✅ Password reset link sent! Check your email.');
        setForm({ email: '', password: '' });
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6 relative overflow-hidden font-sans">
      {/* Background Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
              {forgotMode ? 'Reset Password' : 'Command Center'}
            </h1>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">
              Meridian Studios Auth
            </p>
          </div>

          {!forgotMode ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="admin@meridian.local"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 font-medium"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Access Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 font-medium"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                  />
                </div>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <button 
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-red-400 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
                >
                  {error}
                </motion.p>
              )}

              <button 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Establish Session'}
                {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          ) : (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="antonio@meridianstudios.org"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 font-medium"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className={`text-xs font-bold text-center py-3 rounded-xl border ${
                    error.includes('✅') 
                      ? 'text-green-400 bg-green-500/10 border-green-500/20' 
                      : 'text-red-400 bg-red-500/10 border-red-500/20'
                  }`}
                >
                  {error}
                </motion.p>
              )}

              <button 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <button 
                type="button"
                onClick={() => { setForgotMode(false); setError(''); }}
                className="w-full text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider py-3 transition-colors"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest">
            Authorized Personnel Only • IP Logged
          </p>
        </div>
      </motion.div>
    </div>
  );
}
