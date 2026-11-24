// src/pages/auth/Login.jsx - Meridian Studios sign-in.
// Authentication still uses the website API (MongoDB users, bcrypt, JWT).
// Staff with CRM access are handed to the CRM with a one-time code; customers
// continue to the website dashboard.
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  ExternalLink,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CRM_URL, apiUrl, requestCrmHandoff } from '../../lib/api';

// Dev-only convenience. Vite replaces import.meta.env.DEV with false in a
// production build, so this block is not part of the shipped login flow.
const DEV_LOGIN = import.meta.env.DEV
  ? {
      email: import.meta.env.VITE_DEV_LOGIN_EMAIL || 'demo@meridian.studio',
      password: import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'Meridian2026!'
    }
  : null;

const FIELD_CLASS =
  'w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const canUseCrm = (user) =>
    user?.access?.canAccessCrm === true || user?.role === 'admin';

  const performLogin = async (email, password) => {
    setLoading(true);
    setError('');
    setPhase('Signing in…');

    try {
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.message || 'Invalid email or password');
        return;
      }

      localStorage.setItem('meridian_token', data.token);
      localStorage.setItem('meridian_user', JSON.stringify(data.user));

      if (canUseCrm(data.user)) {
        setPhase('Opening Meridian CRM…');
        try {
          const { url } = await requestCrmHandoff();
          window.location.assign(url);
          return;
        } catch {
          // The handoff is optional. Staff can retry from the dashboard.
          setError(
            'Signed in, but the CRM handoff is unavailable. Opening the website dashboard.'
          );
        }
      }

      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to the website API. Is the backend running?');
      } else {
        setError('Server connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setPhase('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    await performLogin(form.email, form.password);
  };

  const handleDevLogin = async () => {
    if (!DEV_LOGIN) return;
    setForm({ email: DEV_LOGIN.email, password: DEV_LOGIN.password });
    await performLogin(DEV_LOGIN.email, DEV_LOGIN.password);
  };

  const copyDevCredentials = async () => {
    if (!DEV_LOGIN) return;
    try {
      await navigator.clipboard.writeText(
        `${DEV_LOGIN.email} / ${DEV_LOGIN.password}`
      );
      setCopied(true);
    } catch {
      // Clipboard access is optional; the fields are visible anyway.
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/auth/forgot-password'), {
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
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* Left / brand panel */}
      <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/5 px-12 py-10 lg:flex">
        <div className="pointer-events-none absolute -left-40 top-1/4 h-[36rem] w-[36rem] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />

        <motion.a
          href="/"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_28px_rgba(34,211,238,0.25)]">
            <span className="h-5 w-px rotate-45 bg-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            meridian <span className="font-light text-stone-500">studios</span>
          </span>
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative max-w-lg"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400">
            Studio command center
          </p>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tighter">
            One sign-in.
            <br />
            <span className="font-light italic text-stone-300">
              Every surface.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-400">
            The public website, customer accounts, live chat, and the staff CRM
            share one verified Meridian identity. Staff with CRM access are
            handed over securely after sign-in.
          </p>
          <div className="mt-8 h-px w-24 bg-gradient-to-r from-cyan-400 to-indigo-500" />
          <ul className="mt-8 space-y-3 text-sm text-stone-400">
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              MongoDB-backed customer identity
            </li>
            <li className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-cyan-400" />
              bcrypt passwords and short-lived JWTs
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              One-time CRM handoff, never a shared session
            </li>
          </ul>
        </motion.div>

        <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
          Meridian Studios · Authorized personnel only
        </p>
      </div>

      {/* Right / form panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <a href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600">
                <span className="h-4 w-px rotate-45 bg-white" />
              </span>
              <span className="font-bold tracking-tight">
                meridian <span className="font-light text-stone-500">studios</span>
              </span>
            </a>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400">
              {forgotMode ? 'Account recovery' : 'Welcome back'}
            </p>
            <h2 className="mt-2 text-3xl font-light tracking-tight">
              {forgotMode ? 'Reset password' : 'Sign in'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              {forgotMode
                ? 'Enter your email and we will send a reset link.'
                : 'Use your Meridian website account. Staff are routed to the CRM automatically.'}
            </p>
          </div>

          {!forgotMode ? (
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className={FIELD_CLASS}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={FIELD_CLASS}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError('');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  Forgot password?
                </button>
                {CRM_URL && (
                  <a
                    href={`${CRM_URL}/login`}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-500 transition-colors hover:text-stone-300"
                  >
                    CRM sign-in <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {error && (
                <p
                  role="alert"
                  className={`rounded-xl border py-3 text-center text-xs font-bold ${
                    error.includes('✅')
                      ? 'border-green-500/20 bg-green-500/10 text-green-400'
                      : 'border-red-500/20 bg-red-500/10 text-red-400'
                  }`}
                >
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? phase || 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="reset-email"
                  className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-600" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className={FIELD_CLASS}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className={`rounded-xl border py-3 text-center text-xs font-bold ${
                    error.includes('✅')
                      ? 'border-green-500/20 bg-green-500/10 text-green-400'
                      : 'border-red-500/20 bg-red-500/10 text-red-400'
                  }`}
                >
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError('');
                }}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 transition-colors hover:text-white"
              >
                ← Back to sign in
              </button>
            </form>
          )}

          {DEV_LOGIN && (
            <div className="mt-7 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">
                    Local dev account
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-stone-200">
                    {DEV_LOGIN.email}
                  </p>
                  <p className="text-xs text-stone-500">{DEV_LOGIN.password}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-stone-500">
                    Seed with <code>npm run seed:demo</code>. This block is
                    development-only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyDevCredentials}
                  className="text-stone-500 transition-colors hover:text-white"
                  aria-label="Copy dev credentials"
                >
                  {copied ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 py-3 text-[10px] font-black uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-400/15 disabled:opacity-50"
              >
                Use dev account <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-stone-500">
            New customer?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-stone-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
            >
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
