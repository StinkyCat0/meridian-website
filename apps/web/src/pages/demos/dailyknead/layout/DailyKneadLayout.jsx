// src/pages/dailyknead/layout/DailyKneadLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, MapPin, Clock, Home } from 'lucide-react'; // ← Added Home import

const DailyKneadLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // ← Added for programmatic navigation

  const navItems = [
    { name: "Home", href: "/bakery", icon: <Home className="w-4 h-4" /> },
    { name: "Menu", href: "/bakery#menu", isAnchor: true },
    { name: "Process", href: "/bakery/process", isRoute: true },
    { name: "Visit", href: "/bakery/visit", isRoute: true },
    { name: "Wholesale", href: "/bakery/wholesale", isRoute: true },
    { name: "Journal", href: "/bakery/journal", isRoute: true }
  ];

  // Handle nav item click
  const handleNavClick = (item) => {
    setMenuOpen(false);
    
    if (item.isRoute) {
      // Nested route: use React Router navigation
      navigate(item.href);
    } else if (item.isAnchor) {
      // Anchor link on home page: navigate to home + scroll
      if (location.pathname !== '/bakery') {
        navigate('/bakery');
        // Scroll after navigation completes
        setTimeout(() => {
          const el = document.getElementById('menu');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        // Already on home page, just scroll
        const el = document.getElementById('menu');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Default: navigate normally
      navigate(item.href);
    }
  };

  return (
    <div className="bg-[#121212] text-[#FAF9F6] min-h-screen font-sans selection:bg-orange-900/30 overflow-x-hidden">
      
      {/* FIXED TOP NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto">
        <Link to="/bakery" className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white text-black rounded-full flex items-center justify-center font-black italic text-sm">B</div>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.35em] text-stone-400 hidden sm:block">The Daily Knead</span>
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
                  const isActive = item.isAnchor 
                    ? location.pathname === '/bakery' && location.hash === '#menu'
                    : location.pathname === item.href;
                    
                  return (
                    <motion.button
                      key={item.name}
                      onClick={() => handleNavClick(item)}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`w-full text-left block text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter py-3 flex items-center gap-3 ${
                        isActive ? 'text-orange-200' : 'hover:text-orange-200'
                      } transition-colors`}
                    >
                      {item.icon && <span className="text-orange-200/60">{item.icon}</span>}
                      {item.name}
                    </motion.button>
                  );
                })}
              </nav>
              
              <div className="mt-16 pt-8 border-t border-white/5">
                <p className="text-stone-500 text-sm max-w-md mb-6">
                  San Marcos, TX • Open Wed–Sun, 6AM–2PM<br/>
                  Wholesale: hello@dailyknead.com
                </p>
                <div className="flex gap-4">
                  <a href="https://instagram.com/dailyknead" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-orange-200 transition-colors">
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                  <a href="https://maps.google.com/?q=128+Henderson+St+San+Marcos+TX" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-orange-200 transition-colors">
                    <MapPin className="w-4 h-4" /> Find Us
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGE CONTENT (nested route renders here) */}
      <Outlet />

      {/* SHARED FOOTER */}
      <footer className="py-12 sm:py-20 border-t border-white/5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white text-black rounded-full flex items-center justify-center font-black italic">B</div>
             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">The Daily Knead • San Marcos, TX</span>
          </div>
          <div className="flex gap-6 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-500">
             <a href="https://instagram.com/dailyknead" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
             <button onClick={() => handleNavClick({ href: "/bakery#process", isAnchor: true })} className="hover:text-white transition-colors">Process</button>
             <Link to="/bakery/wholesale" className="hover:text-white transition-colors">Wholesale</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DailyKneadLayout;
