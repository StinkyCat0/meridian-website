// src/pages/luxesm/layout/LuxeSMLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, MapPin, Phone } from 'lucide-react';

const LuxeSMLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Scroll effect for nav
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: "Services", href: "/luxe-sm#services" },
    { name: "Stylists", href: "/luxe-sm#stylists" },
    { name: "Gallery", href: "/luxe-sm#gallery" },
    { name: "Book", href: "/luxe-sm#booking" }
  ];

  // LuxeSM color tokens
  const C = {
    cream: "#faf9f6", sand: "#f5ede2", stone: "#c4a98a", muted: "#9b8270",
    body: "#5c4a3a", dark: "#2e1f12", accent: "#8b6343", border: "rgba(139,99,67,0.15)"
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#c4a98a]/30 overflow-x-hidden" style={{ background: C.cream, color: C.dark }}>
      
      {/* FIXED TOP NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-[#faf9f6]/96 backdrop-blur-[20px]' : 'bg-[#faf9f6]'} border-b`} style={{ borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <Link to="/luxe-sm" className="flex items-center gap-2">
            <div className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold tracking-tight" style={{ color: C.dark }}>
              Luxe <span style={{ color: C.stone, fontWeight: 300 }}>SM</span>
            </div>
            <span className="hidden sm:block text-[9px] uppercase tracking-[0.35em]" style={{ color: C.stone }}>San Marcos · Texas</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="text-[13px] font-medium transition-colors" style={{ color: C.muted }}>
                {item.name}
              </a>
            ))}
            <a href="tel:6822848837" className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all" style={{ background: C.sand, borderColor: C.border, borderWidth: 1 }}>
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> (682) 284-8837
            </a>
            <button onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all" style={{ background: C.dark, color: '#fff' }}>
              Book Now
            </button>
          </div>
          
          {/* Mobile Hamburger */}
          <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 rounded-lg transition-colors" style={{ borderColor: C.border, borderWidth: 1 }}>
            <Menu className="w-5 h-5" style={{ color: C.dark }} />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-b" style={{ background: C.cream, borderColor: C.border }}>
              <div className="px-6 py-4 flex justify-between items-center border-b" style={{ borderColor: C.border }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: C.stone }}>Navigation</span>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-black/5">
                  <X className="w-5 h-5" style={{ color: C.dark }} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-2">
                {navItems.map((item, i) => (
                  <motion.a key={item.name} href={item.href} onClick={() => setMenuOpen(false)}
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="block py-3 text-lg font-medium transition-colors" style={{ color: C.dark }}>
                    {item.name}
                  </motion.a>
                ))}
                <a href="tel:6822848837" onClick={() => setMenuOpen(false)} className="block py-3 text-lg font-medium" style={{ color: C.accent }}>
                  📞 (682) 284-8837
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* PAGE CONTENT */}
      <Outlet />

      {/* SHARED FOOTER */}
      <footer className="py-16 px-4 sm:px-6" style={{ background: C.dark, color: '#fff' }}>
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div>
            <h3 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-medium mb-2">Come see us in <em style={{ color: '#a8896c' }}>San Marcos.</em></h3>
            <p className="text-[14px]" style={{ color: '#7a6455' }}>Walk-ins welcome. Appointments preferred.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all" style={{ background: '#fff', color: C.dark }}>
              Book Now
            </button>
            <a href="tel:6822848837" className="flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all" style={{ borderColor: 'rgba(196,169,138,0.35)', borderWidth: 1.5, color: '#fff' }}>
              <Phone className="w-4 h-4" /> (682) 284-8837
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 border-t text-[14px]" style={{ borderColor: 'rgba(196,169,138,0.14)', color: '#8a7262' }}>
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: '#6a5545' }}>Hours</div>
              <div>Tue–Sat: 9am – 7pm</div>
              <div>Sun: 10am – 4pm</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: '#6a5545' }}>Location</div>
              <div>San Marcos, TX</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: '#6a5545' }}>Follow</div>
              <a href="#" className="hover:underline">Instagram</a> · <a href="#" className="hover:underline">Google</a>
            </div>
          </div>

          <div className="pt-6 border-t text-[11px]" style={{ borderColor: 'rgba(196,169,138,0.08)', color: '#5a4a3e' }}>
            © {new Date().getFullYear()} Luxe SM · Built by <span style={{ color: '#a8896c', fontWeight: 500 }}>Meridian</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LuxeSMLayout;
