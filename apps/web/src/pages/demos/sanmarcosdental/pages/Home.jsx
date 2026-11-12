// src/pages/sanmarcosdental/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Heart, ArrowRight, Play, MapPin, Phone, Award, X, Sparkles, 
  Info, ShieldCheck, Microscope, Eye, Mail, Linkedin, PhoneCall, 
  ExternalLink, ChevronLeft
} from 'lucide-react';

// Local assets - update paths if needed
import spaVideo from '../assets/dental-spa-pan.mp4';
import doc1 from '../assets/doctor-1.webp'; 
import doc2 from '../assets/doctor-2.webp'; 
import doc3 from '../assets/doctor-3.webp'; 
import doc4 from '../assets/doctor-4.webp'; 
import sanc1 from '../assets/sanctuary-1.webp';
import sanc2 from '../assets/sanctuary-2.webp';
import sanc3 from '../assets/sanctuary-3.webp';
import sanc4 from '../assets/sanctuary-4.webp';
import sanc5 from '../assets/sanctuary-5.webp';
import sanc6 from '../assets/sanctuary-6.webp';
import sanc7 from '../assets/sanctuary-7.webp';
import sanc8 from '../assets/sanctuary-8.webp';
import sanc9 from '../assets/sanctuary-9.webp';
import sanc10 from '../assets/sanctuary-10.webp';

const DentalHome = () => {
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [expandedBun, setExpandedBun] = useState(null);
  const [panelState, setPanelState] = useState('idle');
  const [hoveringMarquee, setHoveringMarquee] = useState(false);
  const [selectedClinician, setSelectedClinician] = useState(null);

  const clinicianRef = useRef(null);
  const portalRef = useRef(null);
  const isClinicianInView = useInView(clinicianRef, { amount: 0.1 });
  const isPortalInView = useInView(portalRef, { amount: 0.1 });

  // Hard scroll lock for modal
  useEffect(() => {
    const handleHardLock = (e) => {
      if (selectedClinician) { e.preventDefault(); e.stopPropagation(); }
    };
    if (selectedClinician) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.addEventListener('wheel', handleHardLock, { passive: false });
      window.addEventListener('touchmove', handleHardLock, { passive: false });
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      window.removeEventListener('wheel', handleHardLock);
      window.removeEventListener('touchmove', handleHardLock);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
      window.removeEventListener('wheel', handleHardLock);
      window.removeEventListener('touchmove', handleHardLock);
    };
  }, [selectedClinician]);

  const clinicians = [
    { id: 1, name: "Dr. Robert Slezak", role: "Biological Architect", img: doc1, color: "#964B33", email: "r.slezak@smdental.com", linkedin: "linkedin.com/in/robertslezak", quote: "Form follows function; wellness follows form.", bio: "With 40 years of precision in San Marcos, Dr. Robert views every smile as a structural masterpiece, integrating systemic health with aesthetic balance.", expertise: ["Full Mouth Rehab", "Ozone Therapy", "Architectural Veneers"] },
    { id: 2, name: "Dr. Jennifer Slezak", role: "Wellness Specialist", img: doc2, color: "#7A8C73", email: "j.slezak@smdental.com", linkedin: "linkedin.com/in/jenniferslezak", quote: "Peace is the first step to a permanent smile.", bio: "Dr. Jennifer pioneered our 'Quiet Care' philosophy, focusing on nervous system regulation and holistic prevention for modern families.", expertise: ["Holistic Prevention", "Sleep Wellness", "Biological Cleaning"] },
    { id: 3, name: "Dr. Marcus Thorne", role: "Implant Lead", img: doc3, color: "#B87D4B", email: "m.thorne@smdental.com", linkedin: "linkedin.com/in/marcusthorne", quote: "Biocompatibility is the standard of excellence.", bio: "A master of reconstructive technology, Dr. Marcus uses minimally invasive techniques to restore function with a focus on long-term health.", expertise: ["Titanium-Free Implants", "3D Bone Mapping", "Laser Reconstruction"] },
    { id: 4, name: "Sarah Miller, RDH", role: "Microbiome Lead", img: doc4, color: "#C9A66B", email: "s.miller@smdental.com", linkedin: "linkedin.com/in/sarahmiller", quote: "A healthy body begins with a healthy microbiome.", bio: "Sarah leads our hygiene sanctuary, specializing in advanced bacterial therapy and biological cleaning that protects your body's natural defenses.", expertise: ["Microbial Therapy", "Laser Hygiene", "Salivary Diagnostics"] }
  ];

  const sanctuaryImages = [
    { img: sanc1, label: "Main Sanctuary" }, { img: sanc2, label: "Consultation Lounge" },
    { img: sanc3, label: "Biological Suite A" }, { img: sanc4, label: "Restorative Wing" },
    { img: sanc5, label: "Wellness Gallery" }, { img: sanc6, label: "Clinical Lab" },
    { img: sanc7, label: "Quiet Zone" }, { img: sanc8, label: "Patient Concierge" },
    { img: sanc9, label: "Digital Lab" }, { img: sanc10, label: "Recovery Veranda" }
  ];

  const portalResources = [
    { id: 1, title: 'Onboarding', longDesc: 'Skip the clipboard. Our encrypted mobile portal allows you to complete your biological history before arrival.' },
    { id: 2, title: 'Amenities', longDesc: 'Sensory comfort menu: Noise-canceling headphones, weighted blankets, and aromatherapy.' },
    { id: 3, title: 'Wellness Tiers', longDesc: 'Boutique membership tiers for those without insurance. 25% savings on all care.' },
    { id: 4, title: 'Bio-Strategy', longDesc: 'We focus on the oral-systemic connection, using biocompatible materials that integrate seamlessly with your body.' },
    { id: 5, title: 'Priority Access', longDesc: 'Direct access to our priority line for same-day emergency wellness and consultations.' }
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };

  // Color tokens
  const C = { bg: "#DBE9F0", text: "#5C3D3D", dark: "#4A2C2C", accent: "#F2C94C", muted: "#887857", border: "rgba(92,61,61,0.1)" };

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-20 max-w-7xl mx-auto z-10 text-center pt-8 sm:pt-12">
        <AnimatePresence mode="wait">
          {!isStoryExpanded ? (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 sm:space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F2C94C]/10 text-[#5C3D3D] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#F2C94C]/20">
                <Sparkles size={12} className="text-[#F2C94C]" /> Warmth. Wellness. Welcome.
              </div>
              <h1 className="text-[16vw] sm:text-[14vw] lg:text-[8.5rem] font-bold tracking-tighter leading-[0.85] text-[#4A2C2C]">
                Slow care <br /> <span className="text-[#887857] font-light italic text-[#964B33]">for your smile.</span>
              </h1>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                <button onClick={() => scrollTo('portal')} className="bg-[#5C3D3D] text-white px-8 sm:px-10 py-5 sm:py-6 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-[#F2C94C] hover:text-[#5C3D3D] transition-all">
                  Reserve Visit
                </button>
                <button onClick={() => setIsStoryExpanded(true)} className="flex items-center justify-center gap-3 text-[#5C3D3D]/60 font-black text-[10px] uppercase tracking-widest group">
                  Our Story <Info size={16} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="story" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
              <div className="bg-[#5C3D3D] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden flex flex-col lg:flex-row min-h-[400px] sm:min-h-[500px] shadow-3xl border border-white/5 text-white">
                <div className="lg:w-2/3 p-8 sm:p-12 md:p-16 space-y-6 sm:space-y-8 text-left">
                  <button onClick={() => setIsStoryExpanded(false)} className="text-[#F2C94C] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                    <X size={14} /> Close
                  </button>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">Biological Trust.</h2>
                  <p className="text-white/60 text-base sm:text-xl leading-relaxed max-w-xl font-medium">
                    Founded in 1984, the Slezak practice treats dentistry as an architectural art form, prioritizing the microbiome as the foundation of systemic health.
                  </p>
                </div>
                <div className="lg:w-1/3 bg-white p-6 sm:p-8 flex flex-col justify-center items-center text-center">
                  <MapPin size={32} className="sm:w-10 sm:h-10 text-[#F2C94C] mb-3 sm:mb-4" />
                  <h4 className="font-black uppercase tracking-tighter text-lg sm:text-xl text-[#5C3D3D]">San Marcos, TX</h4>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SPECIALISTS: IMMERSIVE LOCK MODE */}
      <section id="specialists" ref={clinicianRef} className="py-24 sm:py-32 relative px-4 sm:px-6">
        <div className="max-w-7xl mx-auto mb-12 sm:mb-16 flex justify-between items-end">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-[#5C3D3D]">Our Team</h2>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#F2C94C]">Professional Mastery</span>
        </div>

        <div className="relative min-h-[500px] sm:min-h-[650px] flex items-center">
          {/* THE MARQUEE */}
          <motion.div onMouseEnter={() => setHoveringMarquee(true)} onMouseLeave={() => setHoveringMarquee(false)}
            className="flex gap-4 sm:gap-6 px-6 sm:px-12 overflow-hidden" style={{ willChange: 'transform' }}>
            <motion.div className="flex gap-4 sm:gap-6"
              animate={isClinicianInView ? { x: ["0%", "-50%"] } : { x: 0 }}
              transition={{ duration: hoveringMarquee ? 120 : 40, repeat: Infinity, ease: "linear" }}>
              {[...clinicians, ...clinicians].map((person, i) => (
                <div key={i} onClick={() => setSelectedClinician(person)}
                  className="flex-shrink-0 w-[280px] sm:w-[450px] aspect-square bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border shadow-sm cursor-pointer hover:shadow-2xl transition-all group relative"
                  style={{ borderColor: C.border }}>
                  <div className="flex gap-6 sm:gap-8 items-start relative z-10 text-left">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-stone-50 transition-all group-hover:border-[#F2C94C]">
                      <img src={person.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" loading="lazy" />
                    </div>
                    <div className="flex-1 space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                      <div>
                        <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[#5C3D3D] leading-tight">{person.name}</h3>
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest mt-1" style={{ color: person.color }}>{person.role}</p>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5 text-[9px] sm:text-[10px] font-bold text-[#5C3D3D]/40 uppercase tracking-widest">
                        <p className="flex items-center gap-1.5 sm:gap-2"><Mail size={10} className="sm:w-3 sm:h-3" /> {person.email}</p>
                        <p className="flex items-center gap-1.5 sm:gap-2"><PhoneCall size={10} className="sm:w-3 sm:h-3" /> EXT. {person.id}00</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-10 pt-6 sm:pt-10 border-t border-stone-100 text-left">
                    <p className="text-sm sm:text-base leading-relaxed text-[#5C3D3D]/60 italic font-medium">"{person.quote}"</p>
                    <div className="mt-6 sm:mt-8 flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#F2C94C]">
                      Meet the Doctor <ArrowRight size={12} className="sm:w-3 sm:h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* THE IMMERSIVE MODAL (Scroll Locked) */}
          <AnimatePresence>
            {selectedClinician && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-[#5C3D3D]/60 backdrop-blur-md"
                onClick={() => setSelectedClinician(null)}>
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-4xl w-full bg-white rounded-[3rem] sm:rounded-[4rem] shadow-3xl overflow-hidden border flex flex-col lg:flex-row relative"
                  style={{ borderColor: C.border }}>
                  <div className="lg:w-5/12 p-6 sm:p-8 md:p-10 bg-stone-50 flex flex-col justify-between" style={{ borderLeft: `12px solid ${selectedClinician.color}` }}>
                    <div className="space-y-6 sm:space-y-8 text-left">
                      <motion.button whileHover={{ x: -5 }} onClick={() => setSelectedClinician(null)}
                        className="inline-flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-[#5C3D3D] bg-[#DBE9F0]/80 backdrop-blur-md px-5 sm:px-6 py-3 sm:py-4 rounded-full border-2 shadow-lg hover:bg-[#F2C94C] transition-all"
                        style={{ borderColor: C.text }}>
                        <ChevronLeft size={16} className="sm:w-5 sm:h-5" /> Back to Team
                      </motion.button>
                      <div className="aspect-[4/5] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white p-2 sm:p-3">
                        <img src={selectedClinician.img} className="w-full h-full object-cover rounded-[1.5rem] sm:rounded-[2rem]" alt={selectedClinician.name} />
                      </div>
                    </div>
                    <div className="pt-6 sm:pt-8 sm:pt-10 space-y-3 sm:space-y-4 text-left">
                      <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#F2C94C]">Digital Portfolio</h4>
                      <div className="flex gap-2 sm:gap-3">
                        <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer text-[#5C3D3D] border border-stone-100"><Mail size={16} className="sm:w-5 sm:h-5" /></div>
                        <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer text-[#5C3D3D] border border-stone-100"><Linkedin size={16} className="sm:w-5 sm:h-5" /></div>
                        <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer text-[#5C3D3D] border border-stone-100"><ExternalLink size={16} className="sm:w-5 sm:h-5" /></div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-7/12 p-6 sm:p-8 md:p-12 md:p-16 space-y-6 sm:space-y-8 md:space-y-10 text-left overflow-y-auto max-h-[70vh] sm:max-h-[80vh]">
                    <div className="space-y-1.5 sm:space-y-2">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Specialist Profile</span>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#5C3D3D] leading-none">{selectedClinician.name}</h2>
                      <p className="text-base sm:text-lg md:text-xl font-medium text-[#5C3D3D]/50 italic">{selectedClinician.role}</p>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                      <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#5C3D3D]/30 border-b border-stone-100 pb-1.5 sm:pb-2 font-bold">Clinical Philosophy</h4>
                      <p className="text-base sm:text-lg leading-relaxed text-[#5C3D3D]/70 font-medium italic">"{selectedClinician.bio}"</p>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                      <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#5C3D3D]/30 border-b border-stone-100 pb-1.5 sm:pb-2 font-bold">Advanced Expertise</h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {selectedClinician.expertise.map((exp, i) => (
                          <span key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-stone-50 border border-stone-100 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#5C3D3D]/60">{exp}</span>
                        ))}
                      </div>
                    </div>
                    <button className="w-full py-4 sm:py-5 md:py-6 bg-[#5C3D3D] text-white rounded-full font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] shadow-2xl hover:bg-[#F2C94C] hover:text-[#5C3D3D] transition-all">
                      Request Consultation
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* VIDEO SECTION */}
      <section id="local-trust" className="px-4 sm:px-6 pb-16 sm:pb-20 max-w-7xl mx-auto z-10 text-[#5C3D3D]">
        <div className="relative aspect-video lg:aspect-[21/9] rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden bg-[#5C3D3D] shadow-2xl group">
          <video autoPlay loop muted playsInline preload="metadata" className="w-full h-full object-cover opacity-60">
            <source src={spaVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center pointer-events-none px-4 sm:px-6">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] mb-3 sm:mb-4 opacity-60 text-[#F2C94C]">Texas Hill Country Standard</p>
            <h3 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter leading-none italic">Established 1984.</h3>
          </div>
        </div>
      </section>

      {/* SANCTUARY GRID */}
      <section id="sanctuary" className="py-24 sm:py-32 md:py-40 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 overflow-hidden text-[#5C3D3D]">
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Image Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {sanctuaryImages.map((item, i) => (
              <motion.div key={i} layout
                className="relative aspect-square bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border transition-all duration-500 hover:scale-[1.02] hover:z-10 hover:shadow-xl"
                style={{ borderColor: C.border }}>
                <img src={item.img} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" alt={item.label} />
                <AnimatePresence>
                  {panelState === 'labels' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#5C3D3D]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 text-center">
                      <span className="text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wide leading-tight">{item.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
          {/* Side Panel */}
          <motion.div layout
            className="lg:col-span-4 bg-white p-6 sm:p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border flex flex-col justify-center text-left"
            style={{ borderColor: C.border }}>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#F2C94C] mb-4 sm:mb-6 block">Spatial Design</span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight text-[#5C3D3D]">A Sanctuary for Wellness</h3>
            <AnimatePresence mode="wait">
              {panelState !== 'idle' && (
                <motion.div key="panel-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4 sm:space-y-5">
                  <p className="text-[#5C3D3D]/70 text-sm sm:text-base leading-relaxed font-normal">
                    Designed with warm undertones to lower cortisol levels. Every detail is curated for sensory peace and clinical excellence.
                  </p>
                  <div className="pt-3 sm:pt-4 border-t" style={{ borderColor: C.border }}>
                    <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#5C3D3D]/40 mb-2 sm:mb-3">Featured Spaces</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {['Main Sanctuary', 'Quiet Zone', 'Wellness Gallery'].map((space, idx) => (
                        <span key={idx} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#F2C94C]/10 text-[#5C3D3D] rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">{space}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
              <button onClick={() => setPanelState(panelState === 'idle' ? 'expanded' : panelState === 'expanded' ? 'labels' : 'idle')}
                className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 shadow-md
                ${panelState === 'idle' ? 'bg-[#5C3D3D] text-white hover:bg-[#4a3232]' : 'bg-[#F2C94C] text-[#5C3D3D] hover:bg-[#e0b846]'}`}>
                {panelState === 'idle' ? 'Explore Space' : panelState === 'expanded' ? 'Show Labels' : 'Hide Labels'}
                <ArrowRight size={12} className={`sm:w-3.5 sm:h-3.5 transition-transform ${panelState !== 'idle' ? 'rotate-90' : ''}`} />
              </button>
              {panelState !== 'idle' && (
                <button onClick={() => setPanelState('idle')}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wider bg-white/60 text-[#5C3D3D] border hover:bg-white transition-all"
                  style={{ borderColor: C.border }}>
                  Reset
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PORTAL SECTION */}
      <section id="portal" ref={portalRef} className="py-24 sm:py-32 md:py-40 overflow-hidden bg-white/40 backdrop-blur-xl border-y" style={{ borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 md:mb-20 text-center text-[#5C3D3D]">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic">Patient Portal</h2>
          <p className="text-[#F2C94C] uppercase tracking-[0.3em] text-[11px] sm:text-[12px] font-black mt-4 sm:mt-6 tracking-[0.4em]">The Concierge Suite</p>
        </div>
        <div className="flex">
          <motion.div animate={isPortalInView && !expandedBun ? { x: ["-50%", "0%"] } : { x: 0 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }} style={{ willChange: 'transform' }} className="flex gap-6 sm:gap-8">
            {[...portalResources, ...portalResources].map((bun, i) => (
              <motion.div key={i} layout onClick={() => setExpandedBun(expandedBun === i ? null : i)}
                className={`flex-shrink-0 p-8 sm:p-10 md:p-12 rounded-[3rem] sm:rounded-[3.5rem] border cursor-pointer transition-all duration-700 shadow-xl
                  ${expandedBun === i ? 'w-[300px] sm:w-[500px] md:w-[650px] bg-[#5C3D3D] text-white' : 'w-[220px] sm:w-[300px] md:w-[400px] bg-white/80 text-[#5C3D3D]'}`}
                style={{ borderColor: C.border }}>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#F2C94C] block mb-8 sm:mb-10">Resource 0{(i % 5) + 1}</span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase mb-6 sm:mb-8 md:mb-10 leading-none">{bun.title}</h3>
                {expandedBun === i ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/60 text-base sm:text-lg md:text-xl leading-relaxed italic">{bun.longDesc}</motion.p>
                ) : (
                  <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#F2C94C] flex items-center gap-2 sm:gap-3">
                    Expand <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default DentalHome;
