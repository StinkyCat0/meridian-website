// src/pages/auth/ResetPassword.jsx - Robust Password Reset UI
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { apiUrl } from '../../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState('loading'); // loading, idle, success, error
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      // Extract token and email from URL query params
      const params = new URLSearchParams(location.search);
      const urlToken = params.get('token');
      const urlEmail = params.get('email');
      
      if (!urlToken || !urlEmail) {
        setStatus('error');
        setMessage('Invalid or expired reset link. Please request a new password reset.');
        return;
      }
      
      setToken(urlToken);
      setEmail(urlEmail);
      setStatus('idle');
    } catch (err) {
      console.error('ResetPassword init error:', err);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch(apiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Password reset successfully! Redirecting to login...');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to reset password. Link may have expired.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  // Show loading state while extracting params
  if (status === 'loading' && !token && !email) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token/email missing
  if (status === 'error' && !token && !email) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-400" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
            Invalid Link
          </h1>
          <p className="text-slate-400 mb-6">{message}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

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
              Reset Password
            </h1>
            <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">
              Meridian Studios Auth
            </p>
          </div>

          {status === 'success' ? (
            /* SUCCESS STATE */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-4">Password Updated!</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <p className="text-slate-500 text-xs">Redirecting to login in 3 seconds...</p>
            </motion.div>
          ) : (
            /* RESET FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 font-medium"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-[9px] text-slate-600 ml-1">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-700 font-medium"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              {status === 'error' && message && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-red-400 text-xs font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2"
                >
                  <AlertCircle size={14} /> {message}
                </motion.p>
              )}

              <button 
                disabled={status === 'loading' || status === 'success'}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Resetting...
                  </>
                ) : (
                  <>
                    Reset Password <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest">
            Secure • Encrypted • Meridian Studios
          </p>
        </div>
      </motion.div>
    </div>
  );
}
