// src/pages/Home.jsx — Meridian Studios Splash
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Code, Palette, Heart, Shirt, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

// Helper: Get visit count from localStorage
const getVisits = (key) => parseInt(localStorage.getItem(`meridian_demo_visits_${key}`) || '0', 10);

// ✈️ Little plane that flies across the top of the screen
const FlyingPlane = () => {
  return (
    <motion.div
      className="fixed top-4 left-0 z-50 pointer-events-none"
      initial={{ x: '-10vw', opacity: 0 }}
      animate={{ x: '110vw', opacity: [0, 0.7, 0.7, 0.7, 0] }}
      transition={{
        delay: 2.5,
        duration: 8,
        ease: 'linear',
        times: [0, 0.1, 0.5, 0.9, 1],
        repeat: Infinity,
        repeatDelay: 12,
      }}
    >
      {/* Small contrail */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 -left-8 w-8 h-px bg-gradient-to-l from-white/30 to-transparent rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
      />
      {/* Plane SVG */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white/60 drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
      >
        <path
          d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
          fill="currentColor"
        />
      </svg>
    </motion.div>
  );
};

const Home = () => {
  const [visitCounts, setVisitCounts] = useState({});

  useEffect(() => {
    // Load visit counts on mount
    setVisitCounts({
      bakery: getVisits('bakery'),
      luxesm: getVisits('luxesm'),
      dental: getVisits('dental'),
      corrowear: getVisits('corrowear')
    });
  }, []);

  const demos = [
    {
      name: "The Daily Knead",
      desc: "Artisanal Bakery",
      path: "/bakery",
      icon: <Heart className="w-6 h-6" />,
      color: "from-orange-500 to-amber-600",
      tag: "New",
      key: "bakery"
    },
    {
      name: "LuxeSM Salon",
      desc: "Aesthetic Studio",
      path: "/luxe-sm",
      icon: <Palette className="w-6 h-6" />,
      color: "from-pink-500 to-rose-600",
      tag: "",
      key: "luxesm"
    },
    {
      name: "San Marcos Dental",
      desc: "Boutique Medical",
      path: "/san-marcos-dental",
      icon: <Heart className="w-6 h-6" />,
      color: "from-teal-500 to-emerald-600",
      tag: "",
      key: "dental"
    },
    {
      name: "CorroWear",
      desc: "Bespoke Studio",
      path: "/corrowear",
      icon: <Shirt className="w-6 h-6" />,
      color: "from-amber-500 to-yellow-600",
      tag: "Bespoke",
      key: "corrowear"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      
      {/* ✈️ Flying Plane — noninvasive, at the top, appears after page loads */}
      <FlyingPlane />

      {/* ✨ AGGRESSIVE NEOCONTEMPORARY BACKGROUND */}
      {/* Cyan glow orb - larger and more visible */}
      <div className="absolute top-0 left-1/4 w-[900px] h-[900px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      
      {/* Purple glow orb - larger and more visible */}
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" /> 

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* BRAND HEADER — Glowing "i" in meridian */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            {/* Logo Mark */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <div className="w-6 h-px bg-white rotate-45" />
              </div>
              <div className="absolute inset-0 bg-cyan-400/20 rounded-xl blur-lg" />
            </div>
            
            {/* Wordmark with SUPER glowing "i" */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                mer<span className="relative inline-block">
                  <span className="text-cyan-400 relative z-10">i</span>
                  {/* Double glow effect - inner */}
                  <div className="absolute inset-0 bg-cyan-400/60 blur-[4px] -z-10" />
                  {/* Double glow effect - outer */}
                  <div className="absolute inset-[-4px] bg-cyan-400/40 blur-[8px] -z-20" />
                  {/* Diagonal accent behind the "i" */}
                  <div className="absolute -top-1 -right-1.5 w-3 h-px bg-cyan-400 rotate-45" />
                </span>dian
              </span>
              <span className="text-sm sm:text-base text-stone-500 font-light">studios</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[14vw] sm:text-[10rem] font-black tracking-tighter leading-[0.85] italic"
          >
            Digital <br/>
            <span className="not-italic text-white">Experiences.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-stone-400 max-w-xl leading-relaxed"
          >
            Boutique web experiences crafted for brands that value precision, aesthetics, and performance.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <Link to="/login" className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">
              Access Dashboard <ArrowRight className="w-3 h-3" />
            </Link>
            <a href="#demos" className="flex items-center gap-2 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] border border-white/20 hover:bg-white/5 transition-colors">
              Explore Demos
            </a>
          </motion.div>
        </div>

        {/* Background accent */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full z-0 opacity-10 pointer-events-none hidden lg:block">
          <div className="w-full h-full bg-gradient-to-l from-cyan-500/20 to-transparent rounded-l-[10rem]" />
        </div>
      </section>

      {/* DEMO GRID */}
      <section id="demos" className="py-24 sm:py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tighter italic">Demo <br/><span className="font-black not-italic">Environments</span></h2>
            <p className="text-stone-400 mt-4 max-w-md">Click any card to explore a live demo. All code is production-ready.</p>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-600">01 / 04</div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demos.map((demo, i) => (
            <motion.div
              key={demo.path}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <Link to={demo.path} className="block h-full">
                <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 h-full flex flex-col hover:border-white/20 transition-all relative">
                  {/* Visit Counter Badge - Top Right */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-stone-400">
                    <Eye size={10} /> {visitCounts[demo.key] || 0}
                  </div>
                  
                  {/* Tag */}
                  {demo.tag && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-wider mb-4">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> {demo.tag}
                    </span>
                  )}
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${demo.color} flex items-center justify-center mb-6 text-white shadow-lg`}>
                    {demo.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold uppercase tracking-tighter leading-tight mb-2">{demo.name}</h3>
                    <p className="text-stone-500 text-sm">{demo.desc}</p>
                  </div>
                  
                  {/* CTA */}
                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Explore</span>
                    <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 border-t border-white/5 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {/* Compact logo mark with diagonal */}
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center relative">
              <div className="w-4 h-px bg-white rotate-45" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Meridian Studios</span>
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-stone-500">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
