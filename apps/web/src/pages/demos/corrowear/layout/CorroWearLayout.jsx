// src/pages/corrowear/layout/CorroWearLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle, Sparkles, Home } from 'lucide-react';

const CorroWearLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // ← UPDATED: "Home" at TOP, removed "Corrosell AI"
  const navItems = [
    { 
      name: "Home", 
      href: "/", 
      icon: <Home className="w-4 h-4" />,
      isExternal: true  // Flag for special handling
    },
    { name: "Collection", href: "/corrowear#collection" },
    { name: "Studio", href: "/corrowear/studio" },
    { name: "Gallery", href: "/corrowear/gallery" }
  ];

  return (
    <div className="bg-[#0f0f0f] text-[#f8f5f0] min-h-screen font-sans selection:bg-[#c9a66b]/30 overflow-x-hidden">
      
      {/* FIXED TOP NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto">
        <Link to="/corrowear" className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#c9a66b] to-[#a68a5c] rounded-full flex items-center justify-center font-black italic text-sm text-[#0f0f0f]">C</div>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.35em] text-stone-400 hidden sm:block">CorroWear</span>
        </Link>
        
        <button 
          onClick={() => setMenuOpen(true)}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
        </button>
      </nav>

      {/* FULL-SCREEN MENU OVERLAY */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-[#0a0a0a] flex flex-col"
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Navigation</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                <X className="w-6 h-6 text-white/80" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center px-6 max-w-4xl mx-auto w-full">
              <nav className="space-y-2">
                {navItems.map((item, i) => {
                  const isActive = location.pathname + location.hash === item.href;
                  return (
                    <motion.a
                      key={item.name}
                      href={item.isExternal ? undefined : (item.href.startsWith('#') ? item.href : undefined)}
                      onClick={() => {
                        if (item.isExternal) {
                          // Navigate to main demo hub
                          window.location.href = item.href;
                        } else if (item.href.startsWith('/corrowear/')) {
                          // Nested route within CorroWear
                          window.location.href = item.href;
                        } else {
                          // Anchor link within current page
                          setMenuOpen(false);
                        }
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`block text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter py-3 flex items-center gap-3 ${
                        isActive ? 'text-[#c9a66b]' : 'hover:text-[#c9a66b]'
                      } transition-colors`}
                    >
                      {item.icon && <span className="text-[#c9a66b]/60">{item.icon}</span>}
                      {item.name}
                    </motion.a>
                  );
                })}
              </nav>
              
              <div className="mt-16 pt-8 border-t border-white/5">
                <p className="text-stone-500 text-sm max-w-md mb-6">
                  Bespoke Studio • Free Alterations<br/>
                  Support: hello@corrowear.com
                </p>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#c9a66b] transition-colors">
                    <MessageCircle className="w-4 h-4" /> Corrosell Help
                  </button>
                  <a href="#" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-[#c9a66b] transition-colors">
                    <Sparkles className="w-4 h-4" /> Sustainability
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE CONTENT */}
      <Outlet />

      {/* SHARED FOOTER */}
      <footer className="py-12 sm:py-20 border-t border-white/5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#c9a66b] to-[#a68a5c] rounded-full flex items-center justify-center font-black italic text-[#0f0f0f]">C</div>
             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">CorroWear • Bespoke Studio</span>
          </div>
          <div className="flex gap-6 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-500">
             <button className="hover:text-[#c9a66b] transition-colors flex items-center gap-2">
               <MessageCircle size={12} /> Corrosell Help
             </button>
             <button className="hover:text-[#c9a66b] transition-colors">Sizing Guide</button>
             <button className="hover:text-[#c9a66b] transition-colors">Sustainability</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CorroWearLayout;
