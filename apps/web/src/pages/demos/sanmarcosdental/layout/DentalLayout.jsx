// src/pages/sanmarcosdental/layout/DentalLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MapPin, Phone, Heart, Award } from 'lucide-react';

const DentalLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: "Specialists", href: "/san-marcos-dental#specialists" },
    { name: "Local Trust", href: "/san-marcos-dental#local-trust" },
    { name: "Sanctuary", href: "/san-marcos-dental#sanctuary" },
    { name: "Portal", href: "/san-marcos-dental#portal" }
  ];

  // Dental color tokens
  const C = {
    bg: "#DBE9F0", text: "#5C3D3D", dark: "#4A2C2C", accent: "#F2C94C",
    muted: "#887857", border: "rgba(92,61,61,0.1)", shadow: "rgba(74,44,44,0.15)"
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#F2C94C]/30 overflow-x-hidden"
      style={{ background: C.bg, color: C.text,
        backgroundImage: 'radial-gradient(circle at 10% 10%, #F5E6E8 0%, transparent 40%), radial-gradient(circle at 90% 90%, #E8D5CC 0%, transparent 40%)',
        backgroundAttachment: 'fixed'
      }}>
      
      {/* TOP UTILITY BAR */}
      <div className="bg-[#5C3D3D] text-[#DBE9F0]/60 py-2.5 px-4 sm:px-6 text-[9px] font-black uppercase tracking-[0.4em] flex justify-between items-center relative z-[101]">
        <span className="flex items-center gap-2 text-white"><MapPin size={10} className="text-[#F2C94C]" /> San Marcos, TX</span>
        <a href="tel:15123961111" className="text-white font-bold tracking-widest">(512) 396-1111</a>
      </div>

      {/* STICKY NAV */}
      <nav className={`sticky top-0 z-[90] flex justify-center gap-2 py-3 sm:py-4 px-4 transition-all ${scrolled ? 'bg-[#DBE9F0]/95 backdrop-blur-md' : 'bg-[#DBE9F0]/80'} border-b`} style={{ borderColor: C.border }}>
        {navItems.map((item) => (
          <button key={item.name} onClick={() => document.getElementById(item.href.split('#')[1])?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white/60 border px-3 sm:px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm hover:bg-[#5C3D3D] hover:text-white"
            style={{ borderColor: C.border, color: C.text }}>
            {item.name}
          </button>
        ))}
        {/* Mobile Hamburger */}
        <button onClick={() => setMenuOpen(true)} className="md:hidden ml-auto p-2 rounded-full bg-white/60 border" style={{ borderColor: C.border }}>
          <Menu className="w-4 h-4" style={{ color: C.text }} />
        </button>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed inset-x-0 top-[52px] z-[100] border-b" style={{ background: C.bg, borderColor: C.border }}>
            <div className="px-6 py-4 flex justify-between items-center border-b" style={{ borderColor: C.border }}>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: C.muted }}>Navigation</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-black/5">
                <X className="w-5 h-5" style={{ color: C.text }} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-2">
              {navItems.map((item, i) => (
                <motion.a key={item.name} href={item.href} onClick={() => setMenuOpen(false)}
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="block py-3 text-lg font-medium transition-colors" style={{ color: C.text }}>
                  {item.name}
                </motion.a>
              ))}
              <a href="tel:15123961111" onClick={() => setMenuOpen(false)} className="block py-3 text-lg font-bold" style={{ color: C.accent }}>
                📞 (512) 396-1111
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE CONTENT */}
      <Outlet />

      {/* SHARED FOOTER */}
      <footer className="py-20 sm:py-32 text-center px-4 sm:px-6" style={{ color: C.text }}>
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#5C3D3D] text-white rounded-2xl flex items-center justify-center font-black italic mx-auto mb-8 sm:mb-10 shadow-2xl">M</div>
        <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em]" style={{ color: `${C.text}66` }}>
          Meridian Studios Digital Asset • San Marcos, TX
        </h3>
        <div className="mt-6 flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest" style={{ color: C.muted }}>
          <a href="#" className="hover:text-[#F2C94C] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#F2C94C] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#F2C94C] transition-colors">Contact</a>
        </div>
      </footer>

      {/* CHIC ACTION BAR */}
      <AnimatePresence>
        {scrolled && (
          <motion.div initial={{ y: 100, x: "-50%" }} animate={{ y: 0, x: "-50%" }} exit={{ y: 100, x: "-50%" }}
            className="fixed bottom-6 sm:bottom-8 left-1/2 z-[100] flex items-center bg-[#5C3D3D] text-white rounded-full p-2 pr-8 sm:pr-10 shadow-2xl"
            style={{ boxShadow: `0 20px 50px ${C.shadow}` }}>
            <a href="tel:15123961111" className="bg-[#F2C94C] p-4 sm:p-5 rounded-full mr-6 sm:mr-8 hover:scale-110 transition-transform shadow-lg">
              <Phone size={18} className="text-[#5C3D3D]" />
            </a>
            <div className="flex gap-8 sm:gap-12 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
              <button onClick={() => document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#F2C94C] transition-colors">Request Call</button>
              <button className="hover:text-[#F2C94C] transition-colors">Location</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DentalLayout;
