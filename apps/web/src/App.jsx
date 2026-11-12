// src/App.jsx - Production Router with Toast Notifications
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, ArrowLeft, Eye, CreditCard } from 'lucide-react';
import { useToast } from './hooks/useToast';
import Toast from './components/ui/Toast';

// 🔐 Root Auth Pages
import RootHome from './pages/Home';
import Login from './pages/auth/Login';
import Dashboard from './pages/auth/Dashboard';
import ResetPassword from './pages/auth/ResetPassword';
import Billing from './pages/auth/Dashboard/Billing';
import ChatRoom from './pages/auth/Dashboard/ChatRoom';
import AdminChatRooms from './pages/auth/Dashboard/AdminChatRooms';

// 🏪 Demo Pages
import DailyKneadLayout from './pages/demos/dailyknead/layout/DailyKneadLayout';
import DailyKneadHome from './pages/demos/dailyknead/pages/Home';
import Wholesale from './pages/demos/dailyknead/pages/Wholesale';
import Journal from './pages/demos/dailyknead/pages/Journal';
import Visit from './pages/demos/dailyknead/pages/Visit';
import Process from './pages/demos/dailyknead/pages/Process';

import LuxeSMLayout from './pages/demos/luxesm/layout/LuxeSMLayout';
import LuxeSMHome from './pages/demos/luxesm/pages/Home';

import DentalLayout from './pages/demos/sanmarcosdental/layout/DentalLayout';
import DentalHome from './pages/demos/sanmarcosdental/pages/Home';

import CorroWearLayout from './pages/demos/corrowear/layout/CorroWearLayout';
import CorroWearHome from './pages/demos/corrowear/pages/Home';

// ✅ Visit tracking functions
const getDemoVisits = (key) => {
  if (typeof window === 'undefined') return 0;
  if (!key) return 0;
  return parseInt(localStorage.getItem(`meridian_demo_visits_${key}`) || '0', 10);
};

const trackDemoVisit = (key) => {
  if (typeof window === 'undefined' || !key) return;
  const storageKey = `meridian_demo_visits_${key}`;
  const visits = parseInt(localStorage.getItem(storageKey) || '0', 10) + 1;
  localStorage.setItem(storageKey, visits.toString());
};

const App = () => {
  const location = useLocation();
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const hideLayout = location.pathname === '/dashboard' || 
                     location.pathname === '/login' || 
                     location.pathname === '/reset-password' ||
                     location.pathname.startsWith('/dashboard/chat');

  const demoLinks = [
    { name: 'Oral Wellness', path: '/san-marcos-dental', desc: 'Boutique Medical', key: 'dental' },
    { name: 'LuxeSM Salon', path: '/luxe-sm', desc: 'Aesthetic Studio', key: 'luxesm' },
    { name: 'The Daily Knead', path: '/bakery', desc: 'Artisanal Bakery', key: 'bakery' },
    { name: 'CorroWear', path: '/corrowear', desc: 'Bespoke Studio', key: 'corrowear' },
  ];

  useEffect(() => {
    const currentDemo = demoLinks.find(d => location.pathname.startsWith(d.path));
    if (currentDemo) {
      trackDemoVisit(currentDemo.key);
    }
  }, [location.pathname]);

  // Expose toast function globally for testing
  useEffect(() => {
    window.showToast = (msg, type) => addToast(msg, type);
  }, [addToast]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col overflow-x-hidden">
      {!hideLayout && (
        <nav className="sticky top-0 z-[9999] w-full border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            
            {/* ✅ Brand Logo */}
            <Link to="/" className="group flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                  <div className="w-5 h-px bg-white rotate-45" />
                </div>
                <div className="absolute inset-0 bg-cyan-400/10 rounded-xl blur-md" />
              </div>
              <span className="font-bold tracking-tight text-lg hidden sm:block">
                <span className="text-white">meridian</span> <span className="text-stone-500 font-light">studios</span>
              </span>
            </Link>

            <div className="flex items-center gap-6">
              {/* Demo Environments Dropdown */}
              <div className="relative" onMouseEnter={() => setIsDemoMenuOpen(true)} onMouseLeave={() => setIsDemoMenuOpen(false)}>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white transition-all py-2">
                  Environments <ChevronDown size={12} className={`transition-transform duration-300 ${isDemoMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDemoMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full pt-2 w-72 z-[10000]">
                      <div className="bg-[#141414] border border-white/10 rounded-[2rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden">
                        
                        {/* HOME BACK BUTTON */}
                        <div className="flex justify-end mb-2 pr-1">
                          <Link to="/" onClick={() => setIsDemoMenuOpen(false)}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-stone-400 hover:text-white transition-all group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                            Home
                          </Link>
                        </div>

                        {/* Demo links with visit counts */}
                        {demoLinks.map((demo) => {
                          const visits = getDemoVisits(demo.key);
                          return (
                            <Link key={demo.path} to={demo.path} onClick={() => setIsDemoMenuOpen(false)}
                              className="flex flex-col p-5 rounded-2xl hover:bg-white/5 transition-all group relative overflow-hidden">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white mb-1 group-hover:text-cyan-400 transition-colors">{demo.name}</span>
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[8px] font-black text-stone-400">
                                  <Eye size={8} /> {visits}
                                </span>
                              </div>
                              <span className="text-[9px] text-stone-500 uppercase tracking-tighter">{demo.desc}</span>
                              {location.pathname === demo.path && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Access Button */}
              <Link to="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-black px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all">
                Access <Sparkles size={12} />
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Routes */}
      <main className="flex-grow">
        <Routes>
          {/* 🔐 Root Auth Pages */}
          <Route path="/" element={<RootHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard/billing" element={<Billing />} />
          <Route path="/dashboard/chat" element={<ChatRoom />} />
          <Route path="/dashboard/chat/admin" element={<AdminChatRooms />} />
          
          {/* 🏪 Nested Demo Routes */}
          
          {/* LuxeSM */}
          <Route path="/luxe-sm" element={<LuxeSMLayout />}>
            <Route index element={<LuxeSMHome />} />
            <Route path="services" element={<div className="p-12 text-center text-stone-500">Services Page Coming Soon</div>} />
            <Route path="booking" element={<div className="p-12 text-center text-stone-500">Booking Page Coming Soon</div>} />
          </Route>
          
          {/* SanMarcosDental */}
          <Route path="/san-marcos-dental" element={<DentalLayout />}>
            <Route index element={<DentalHome />} />
            <Route path="services" element={<div className="p-12 text-center text-stone-500">Services Page Coming Soon</div>} />
            <Route path="contact" element={<div className="p-12 text-center text-stone-500">Contact Page Coming Soon</div>} />
          </Route>
          
          {/* DailyKnead (Bakery) */}
          <Route path="/bakery" element={<DailyKneadLayout />}>
            <Route index element={<DailyKneadHome />} />
            <Route path="wholesale" element={<Wholesale />} />
            <Route path="journal" element={<Journal />} />
            <Route path="visit" element={<Visit />} />
            <Route path="process" element={<Process />} />
          </Route>
          
          {/* CorroWear */}
          <Route path="/corrowear" element={<CorroWearLayout />}>
            <Route index element={<CorroWearHome />} />
            <Route path="studio" element={<div className="p-12 text-center text-stone-500">Studio Page Coming Soon</div>} />
            <Route path="gallery" element={<div className="p-12 text-center text-stone-500">Gallery Page Coming Soon</div>} />
          </Route>
        </Routes>
      </main>

      {/* ✅ Toast Notifications */}
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default App;
