// src/pages/auth/VerifyEmail.jsx - Email verification landing page
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiUrl } from '../../lib/api';

export default function VerifyEmail() {
  const location = useLocation();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const email = params.get('email');

      if (!token || !email) {
        if (!cancelled) {
          setStatus('error');
          setMessage('This verification link is missing its token or email address.');
        }
        return;
      }

      setStatus('loading');
      setMessage('Verifying your email...');

      try {
        const query = new URLSearchParams({ token, email }).toString();
        const res = await fetch(apiUrl(`/auth/verify-email?${query}`), {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (cancelled) return;

        if (res.ok) {
          setStatus('success');
          setMessage('Your email address has been verified.');
        } else {
          let detail = 'This verification link is invalid or has expired.';
          try {
            const data = await res.json();
            if (data && data.message) detail = data.message;
          } catch {
            // Non-JSON response: keep the generic message.
          }
          setStatus('error');
          setMessage(detail);
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('We could not reach the server. Please check your connection and try again.');
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [location.search]);

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
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="text-white" size={32} />
          </div>

          {status === 'loading' && (
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
                Verifying Email
              </h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <Loader className="animate-spin text-indigo-400 mx-auto" size={28} />
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
                Email Verified
              </h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
              >
                Continue to Login
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
                Verification Failed
              </h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
              >
                Request a New Email
              </Link>
              <Link
                to="/login"
                className="inline-block mt-4 text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors"
              >
                ← Back to Login
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
