// src/pages/corrowear/pages/Home.jsx — CORROWEAR (No AI References)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Sparkles, ShoppingBag, ArrowRight, X, Plus, Minus, 
  Palette, Ruler, MessageCircle, Heart, Share2, 
  ChevronLeft, ChevronRight, Sparkles as SparkleIcon,
  Shirt, Scan, Wand2, RefreshCw, Check, Loader2
} from 'lucide-react';

// Mock product data with customization options
const collection = [
  {
    id: 1,
    name: "Architect Blazer",
    basePrice: 285,
    category: "outerwear",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80",
    colors: ["#1a1a1a", "#2c3e50", "#8c7b6b", "#f5f5f0"],
    fabrics: ["Italian Wool", "Linen Blend", "Technical Stretch"],
    fits: ["Tailored", "Relaxed", "Oversized"],
    details: ["Peak Lapel", "Double Vent", "Horn Buttons"]
  },
  {
    id: 2,
    name: "Fluid Trousers",
    basePrice: 195,
    category: "bottoms",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80",
    colors: ["#1a1a1a", "#3d3d3d", "#6b5b4f", "#e8e4d9"],
    fabrics: ["Crepe de Chine", "Wool Gabardine", "Eco-Twill"],
    fits: ["Straight", "Wide Leg", "Tapered"],
    details: ["Pleated Front", "Side Pockets", "Adjustable Waist"]
  },
  {
    id: 3,
    name: "Silk Shell Top",
    basePrice: 165,
    category: "tops",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80",
    colors: ["#f5f5f0", "#d4a5a5", "#a5b8d4", "#1a1a1a"],
    fabrics: ["Mulberry Silk", "Cupro", "Organic Cotton"],
    fits: ["Fitted", "Relaxed", "Cropped"],
    details: ["Bias Cut", "French Seams", "Mother-of-Pearl Buttons"]
  },
  {
    id: 4,
    name: "Modular Coat",
    basePrice: 425,
    category: "outerwear",
    image: "https://images.unsplash.com/photo-1551489186-cf8726f514f8?auto=format&fit=crop&q=80",
    colors: ["#2c3e50", "#1a1a1a", "#8c7b6b"],
    fabrics: ["Cashmere Blend", "Wool Melton", "Recycled Tech"],
    fits: ["Classic", "Longline", "Boxy"],
    details: ["Detachable Collar", "Hidden Pockets", "Storm Flap"]
  }
];

// ← CHANGED: "Corrosell" instead of "Corrosell AI"
const corrosellPrompts = [
  "What's the occasion? I'll curate the perfect look.",
  "Describe your style in 3 words...",
  "What colors make you feel powerful?",
  "Any fit preferences? Tailored, relaxed, or avant-garde?",
  "Let's build your signature outfit together."
];

const CorroWearHome = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [customizations, setCustomizations] = useState({});
  const [corrosellActive, setCorrosellActive] = useState(false);
  const [corrosellStep, setCorrosellStep] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [outfitName, setOutfitName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewMode, setPreviewMode] = useState(false);
  
  const chatEndRef = useRef(null);
  const outfitRef = useRef(null);
  const isOutfitInView = useInView(outfitRef, { amount: 0.1 });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [corrosellStep, userInput]);

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const base = item.basePrice;
      const custom = customizations[item.id] || {};
      const extras = (custom.fabric?.includes('Cashmere') ? 45 : 0) + (custom.fit === 'Tailored' ? 30 : 0) + (custom.monogram ? 25 : 0);
      return total + base + extras;
    }, 0);
  };

  const handleCorrosellSubmit = () => {
    if (!userInput.trim()) return;
    setIsCalculating(true);
    setTimeout(() => {
      const lower = userInput.toLowerCase();
      if (lower.includes('wedding') || lower.includes('formal')) { setSelectedItems([collection[0], collection[1], collection[2]]); setCorrosellStep(3); }
      else if (lower.includes('casual') || lower.includes('weekend')) { setSelectedItems([collection[2], collection[1]]); setCorrosellStep(3); }
      else if (lower.includes('bold') || lower.includes('statement')) { setSelectedItems([collection[3], collection[1]]); setCustomizations(prev => ({ ...prev, [collection[3].id]: { color: '#8c7b6b', fabric: 'Cashmere Blend' } })); setCorrosellStep(3); }
      else if (lower.includes('minimal') || lower.includes('neutral')) { setSelectedItems([collection[0], collection[1]]); setCustomizations(prev => ({ ...prev, [collection[0].id]: { color: '#1a1a1a' }, [collection[1].id]: { color: '#1a1a1a' } })); setCorrosellStep(3); }
      else { setSelectedItems([collection[Math.floor(Math.random() * collection.length)]]); setCorrosellStep(2); }
      setUserInput(''); setIsCalculating(false);
    }, 1200);
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => prev.find(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]);
  };

  const updateCustomization = (itemId, field, value) => {
    setCustomizations(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const saveOutfit = () => {
    if (!outfitName.trim()) return;
    const newOutfit = { id: Date.now(), name: outfitName, items: [...selectedItems], customizations: { ...customizations }, total: calculateTotal(), date: new Date().toLocaleDateString() };
    setSavedOutfits(prev => [newOutfit, ...prev]); setOutfitName(''); setPreviewMode(true);
    setTimeout(() => setPreviewMode(false), 3000);
  };

  const filteredCollection = activeCategory === 'all' ? collection : collection.filter(item => item.category === activeCategory);

  return (
    <>
      {/* CORROSELL FLOATING TRIGGER */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCorrosellActive(true)}
        className="fixed bottom-8 right-8 z-[1000] bg-gradient-to-br from-[#c9a66b] to-[#a68a5c] text-[#0f0f0f] p-5 rounded-full shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px] hover:shadow-[0_0_40px_rgba(201,166,107,0.4)] transition-all">
        <MessageCircle size={18} /> Corrosell  {/* ← Removed "AI" */}
      </motion.button>

      {/* CORROSELL CONVERSATIONAL INTERFACE */}
      <AnimatePresence>
        {corrosellActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-[#0f0f0f]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-[#1a1a1a] rounded-[3rem] border border-white/5 overflow-hidden shadow-3xl flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#c9a66b] to-[#a68a5c] rounded-2xl flex items-center justify-center">
                    <SparkleIcon size={24} className="text-[#0f0f0f]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Corrosell™</h3>
                    {/* ← CHANGED: Removed "AI" from subtitle */}
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Your Personal Stylist</p>
                  </div>
                </div>
                <button onClick={() => { setCorrosellActive(false); setCorrosellStep(0); setSelectedItems([]); }} className="p-3 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <AnimatePresence mode="wait">
                  {corrosellStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#c9a66b]/20 to-[#a68a5c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <SparkleIcon size={16} className="text-[#c9a66b]" />
                        </div>
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-5 max-w-[85%]">
                          <p className="text-lg leading-relaxed">{corrosellPrompts[0]}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        {['Wedding Guest', 'Weekend Casual', 'Power Meeting', 'Date Night'].map((occasion) => (
                          <button key={occasion} onClick={() => { setUserInput(occasion); handleCorrosellSubmit(); }}
                            className="p-4 bg-white/5 hover:bg-[#c9a66b]/10 border border-white/10 rounded-xl text-left text-[11px] font-bold uppercase tracking-wider hover:border-[#c9a66b]/30 transition-all">
                            {occasion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {corrosellStep >= 1 && (
                    <motion.div key="step1+" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex gap-4 flex-row-reverse">
                        <div className="w-10 h-10 bg-[#c9a66b] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#0f0f0f] font-black text-sm">U</span>
                        </div>
                        <div className="bg-[#c9a66b]/10 rounded-2xl rounded-tr-none p-5 max-w-[85%]">
                          <p className="text-[#f8f5f0]">{userInput || 'Building your look...'}</p>
                        </div>
                      </div>
                      {corrosellStep === 1 && (
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#c9a66b]/20 to-[#a68a5c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <SparkleIcon size={16} className="text-[#c9a66b]" />
                          </div>
                          <div className="bg-white/5 rounded-2xl rounded-tl-none p-5 max-w-[85%]">
                            <p className="text-lg leading-relaxed">{corrosellPrompts[1]}</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                              {['Minimalist', 'Bold', 'Romantic', 'Architectural', 'Effortless'].map((style) => (
                                <button key={style} onClick={() => { setUserInput(style); setCorrosellStep(2); }}
                                  className="px-4 py-2 bg-white/5 hover:bg-[#c9a66b]/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider hover:border-[#c9a66b]/30 transition-all">
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {corrosellStep === 2 && (
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#c9a66b]/20 to-[#a68a5c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <SparkleIcon size={16} className="text-[#c9a66b]" />
                          </div>
                          <div className="bg-white/5 rounded-2xl rounded-tl-none p-5 max-w-[85%]">
                            <p className="text-lg leading-relaxed">{corrosellPrompts[2]}</p>
                            <div className="flex gap-3 mt-4">
                              {['Monochrome', 'Earth Tones', 'Jewel Tones', 'Neutrals + Pop'].map((palette) => (
                                <button key={palette} onClick={() => { setUserInput(palette); handleCorrosellSubmit(); }}
                                  className="px-4 py-2 bg-white/5 hover:bg-[#c9a66b]/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider hover:border-[#c9a66b]/30 transition-all flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#c9a66b] to-[#1a1a1a]" /> {palette}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {corrosellStep >= 3 && (
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#c9a66b]/20 to-[#a68a5c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <SparkleIcon size={16} className="text-[#c9a66b]" />
                          </div>
                          <div className="bg-white/5 rounded-2xl rounded-tl-none p-5 max-w-[85%] space-y-4">
                            <p className="text-lg leading-relaxed">✨ Curated your look! Customize each piece below.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                              {selectedItems.map((item) => (
                                <motion.div key={item.id} layout className="bg-white/5 rounded-xl p-3 border border-white/10">
                                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white/5">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <p className="text-[11px] font-bold uppercase tracking-wider">{item.name}</p>
                                  <p className="text-[#c9a66b] text-sm font-black">${item.basePrice}</p>
                                </motion.div>
                              ))}
                            </div>
                            <button onClick={() => { setCorrosellActive(false); setPreviewMode(true); }}
                              className="w-full py-4 bg-[#c9a66b] text-[#0f0f0f] rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#a68a5c] transition-colors flex items-center justify-center gap-2">
                              <ShoppingBag size={14} /> View & Customize Outfit
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              {corrosellStep < 3 && (
                <div className="p-4 md:p-6 border-t border-white/5">
                  <div className="flex gap-3">
                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCorrosellSubmit()}
                      placeholder="Describe your vision..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-[13px] outline-none focus:border-[#c9a66b]/50 transition-colors placeholder:text-stone-500" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCorrosellSubmit} disabled={isCalculating || !userInput.trim()}
                      className="bg-[#c9a66b] text-[#0f0f0f] p-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a68a5c] transition-colors">
                      {isCalculating ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 max-w-7xl mx-auto pt-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end z-10">
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-[#c9a66b]/40 uppercase tracking-[0.4em] text-[10px] font-black">
              <span className="w-8 h-[1px] bg-current"></span> Bespoke • Made For You
            </motion.div>
            <h1 className="text-[18vw] sm:text-[14vw] lg:text-[10rem] font-light leading-[0.8] tracking-tighter italic">
              Wear your <br /> <span className="font-black not-italic text-white">vision.</span>
            </h1>
            {/* ← CHANGED: Removed "AI" from description */}
            <p className="text-base sm:text-xl text-stone-400 max-w-md font-light leading-relaxed">
              Corrosell™ crafts your perfect outfit. Customize every detail. See pricing in real-time.
            </p>
          </div>
          <div className="lg:col-span-4 pb-8 sm:pb-12 flex flex-col items-start lg:items-end gap-4 sm:gap-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setCorrosellActive(true)}
              className="bg-[#c9a66b] text-[#0f0f0f] px-8 sm:px-12 py-5 sm:py-7 rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#a68a5c] transition-all shadow-2xl flex items-center gap-3 w-full sm:w-auto justify-center">
              <SparkleIcon size={16} /> Start with Corrosell
            </motion.button>
            {/* ← CHANGED: Removed "AI-Powered" */}
            <span className="text-[10px] uppercase tracking-widest text-stone-600">Bespoke Customization • Free Alterations</span>
          </div>
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full z-0 opacity-10 pointer-events-none hidden lg:block">
          <div className="w-full h-full bg-gradient-to-l from-[#c9a66b]/20 to-transparent rounded-l-[10rem]" />
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section id="collection" className="py-20 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-20 gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tighter italic">The <br/><span className="font-black not-italic">Collection</span></h2>
            <p className="text-stone-400 mt-4 max-w-md">Each piece is a canvas. Customize fabric, fit, and finish.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'tops', 'bottoms', 'outerwear'].map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#c9a66b] text-[#0f0f0f]' : 'bg-white/5 text-stone-400 hover:bg-white/10'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredCollection.map((item) => {
            const isSelected = selectedItems.find(i => i.id === item.id);
            const custom = customizations[item.id] || {};
            return (
              <motion.div key={item.id} layout whileHover={{ y: -8 }}
                className={`group cursor-pointer bg-[#1a1a1a] rounded-[2.5rem] overflow-hidden border transition-all duration-500 ${isSelected ? 'border-[#c9a66b] shadow-[0_0_30px_rgba(201,166,107,0.2)]' : 'border-white/5 hover:border-white/20'}`}
                onClick={() => toggleItemSelection(item)}>
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`} loading="lazy" />
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-4 right-4 w-8 h-8 bg-[#c9a66b] rounded-full flex items-center justify-center">
                        <Check size={16} className="text-[#0f0f0f]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#c9a66b] mb-2">Customize</p>
                    <div className="flex gap-2">
                      {item.colors.slice(0, 4).map((color, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); updateCustomization(item.id, 'color', color); }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${custom.color === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-tighter leading-none">{item.name}</h3>
                      <p className="text-stone-400 text-xs mt-1 uppercase tracking-widest">From ${item.basePrice}</p>
                    </div>
                    {isSelected && <span className="text-[#c9a66b] text-sm font-black">${item.basePrice + (custom.fabric?.includes('Cashmere') ? 45 : 0) + (custom.fit === 'Tailored' ? 30 : 0)}</span>}
                  </div>
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-[10px]">
                        <Palette size={12} className="text-stone-500" /><span className="text-stone-400">Color:</span><span className="font-bold">{custom.color ? 'Custom' : 'Default'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <Ruler size={12} className="text-stone-500" /><span className="text-stone-400">Fit:</span><span className="font-bold">{custom.fit || 'Select'}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* OUTFIT BUILDER & PRICING */}
      <section ref={outfitRef} className="py-20 sm:py-32 px-4 sm:px-6 bg-[#141414] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
            {/* Visual Outfit Preview */}
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#c9a66b]/10 rounded-2xl flex items-center justify-center">
                  <Shirt size={24} className="text-[#c9a66b]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Your Outfit</h3>
                  <p className="text-stone-400 text-sm">Drag to rearrange • Click to customize</p>
                </div>
              </div>
              <div className="bg-[#0f0f0f] rounded-[3rem] p-6 sm:p-8 min-h-[400px] sm:min-h-[500px] border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-48 h-[600px] bg-gradient-to-b from-[#c9a66b]/20 to-transparent rounded-full" />
                </div>
                <div className="relative z-10 space-y-4 sm:space-y-6">
                  <AnimatePresence>
                    {selectedItems.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                        <SparkleIcon size={48} className="mx-auto text-stone-700 mb-4" />
                        <p className="text-stone-500">Start building with Corrosell or select pieces above</p>
                      </motion.div>
                    ) : (
                      selectedItems.map((item) => {
                        const custom = customizations[item.id] || {};
                        return (
                          <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="flex gap-4 items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#c9a66b]/30 transition-all group">
                            <div className="w-20 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold uppercase tracking-tight truncate">{item.name}</h4>
                                <button onClick={(e) => { e.stopPropagation(); toggleItemSelection(item); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {custom.color && <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: custom.color }} /> Color</span>}
                                {custom.fabric && <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase tracking-wider">{custom.fabric}</span>}
                                {custom.fit && <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase tracking-wider">{custom.fit} Fit</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-[#c9a66b]">${item.basePrice + (custom.fabric?.includes('Cashmere') ? 45 : 0) + (custom.fit === 'Tailored' ? 30 : 0)}</p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
                {selectedItems.length > 0 && selectedItems.length < 4 && (
                  <button onClick={() => { document.querySelector('section:nth-child(2)')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-[#c9a66b]/10 hover:bg-[#c9a66b]/20 border border-[#c9a66b]/30 rounded-full flex items-center justify-center transition-colors">
                    <Plus size={24} className="text-[#c9a66b]" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Customization Panel & Pricing */}
            <div className="space-y-6 sm:space-y-8 sticky top-24 sm:top-32">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Finalize</h3>
                <p className="text-stone-400">Adjust details. See price update instantly.</p>
              </div>
              <motion.div layout className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[2.5rem] p-6 sm:p-8 border border-white/5 space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-white/5">
                  <span className="text-stone-400 uppercase tracking-widest text-[10px] font-black">Subtotal</span>
                  <motion.span key={calculateTotal()} initial={{ scale: 1.1, color: '#c9a66b' }} animate={{ scale: 1, color: '#f8f5f0' }} className="text-2xl sm:text-3xl font-black">
                    ${calculateTotal().toLocaleString()}
                  </motion.span>
                </div>
                {selectedItems.length > 0 && (
                  <div className="space-y-6">
                    {selectedItems.map((item) => {
                      const custom = customizations[item.id] || {};
                      return (
                        <div key={item.id} className="space-y-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold uppercase tracking-tight text-sm">{item.name}</span>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Palette size={12} /> Color</label>
                            <div className="flex gap-2">
                              {item.colors.map((color, i) => (
                                <button key={i} onClick={() => updateCustomization(item.id, 'color', color)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${custom.color === color ? 'border-[#c9a66b] scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} title={color} />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Scan size={12} /> Fabric</label>
                            <div className="flex flex-wrap gap-2">
                              {item.fabrics.map((fabric, i) => {
                                const premium = fabric.includes('Cashmere') || fabric.includes('Silk');
                                return (
                                  <button key={i} onClick={() => updateCustomization(item.id, 'fabric', fabric)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${custom.fabric === fabric ? 'bg-[#c9a66b] text-[#0f0f0f]' : 'bg-white/5 hover:bg-white/10 text-stone-300'}`}>
                                    {fabric} {premium && <span className="text-[#c9a66b]">+</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Ruler size={12} /> Fit</label>
                            <div className="flex gap-2">
                              {item.fits.map((fit, i) => (
                                <button key={i} onClick={() => updateCustomization(item.id, 'fit', fit)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${custom.fit === fit ? 'bg-[#c9a66b] text-[#0f0f0f]' : 'bg-white/5 hover:bg-white/10 text-stone-300'}`}>
                                  {fit}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="pt-4 space-y-4">
                  <div className="flex gap-3">
                    <input type="text" value={outfitName} onChange={(e) => setOutfitName(e.target.value)} placeholder="Name your outfit..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#c9a66b]/50 transition-colors placeholder:text-stone-500" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveOutfit} disabled={!outfitName.trim() || selectedItems.length === 0}
                      className="bg-[#c9a66b] text-[#0f0f0f] px-6 rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a68a5c] transition-colors flex items-center gap-2">
                      <Heart size={14} /> Save
                    </motion.button>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 sm:py-5 bg-white text-[#0f0f0f] rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-stone-100 transition-all shadow-lg flex items-center justify-center gap-3">
                    <ShoppingBag size={16} /> Add to Cart — ${calculateTotal().toLocaleString()}
                  </motion.button>
                  <p className="text-center text-[10px] text-stone-500 uppercase tracking-widest">Free shipping • 30-day returns • Lifetime alterations</p>
                </div>
              </motion.div>
              {savedOutfits.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Saved Looks</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {savedOutfits.slice(0, 3).map((outfit) => (
                      <div key={outfit.id} className="flex-shrink-0 w-32 bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-white/5">
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-500">{outfit.items.length} pcs</div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-tight truncate">{outfit.name}</p>
                        <p className="text-[#c9a66b] text-xs font-black">${outfit.total}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW TOAST */}
      <AnimatePresence>
        {previewMode && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-[#c9a66b] text-[#0f0f0f] px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-3">
            <Check size={14} /> Outfit saved! View in your closet.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CorroWearHome;
