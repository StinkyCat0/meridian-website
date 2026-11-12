// src/pages/dailyknead/pages/Home.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  ShoppingBag, ArrowRight, Clock, X, MapPin 
} from 'lucide-react';

const DailyKneadHome = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const scrollRef = useRef(null);
  const scrollX = useMotionValue(0);

  const menu = [
    { id: 1, name: "The 36-Hour Sourdough", price: "$12", desc: "Wild yeast, stone-ground rye, and a hint of Texas honey.", img: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb", tag: "Signature" },
    { id: 2, name: "Oat-Milk Laminated Croissant", price: "$7", desc: "256 layers of plant-based butter and architectural precision.", img: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd", tag: "Vegan" },
    { id: 3, name: "Sea Salt Focaccia", price: "$14", desc: "Infused with rosemary oil and harvested Gulf sea salt.", img: "https://images.unsplash.com/photo-1598144819059-6414893b0633", tag: "Chef's Pick" },
    { id: 4, name: "Black Sesame Brioche", price: "$9", desc: "Toasted sesame paste folded into enriched dough, finished with nigella seeds.", img: "https://images.unsplash.com/photo-1623334044303-241021148842", tag: "New" },
    { id: 5, name: "Cardamom Rose Loaf", price: "$11", desc: "Persian rosewater, crushed cardamom, and a honey glaze.", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff", tag: "Limited" },
    { id: 6, name: "Olive & Thyme Ciabatta", price: "$10", desc: "Kalamata olives, fresh thyme, and a crackling crust.", img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d", tag: "" },
    { id: 7, name: "Brown Butter Kouign-Amann", price: "$8", desc: "Caramelized layers, sea salt finish, best served warm.", img: "https://images.unsplash.com/photo-1606312619070-2e58c5a8c5e5", tag: "Fan Favorite" },
    { id: 8, name: "Spelt & Fig Loaf", price: "$13", desc: "Ancient grain flour, dried mission figs, and a touch of balsamic.", img: "https://images.unsplash.com/photo-1549488482-7c8a1c5f8c7a", tag: "Seasonal" },
    { id: 9, name: "Everything Bagel", price: "$6", desc: "Hand-rolled, boiled in barley malt, topped with house blend.", img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141", tag: "" },
    { id: 10, name: "Chocolate-Cherry Pain au Levain", price: "$10", desc: "70% dark chocolate, dried tart cherries, 48-hour ferment.", img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35", tag: "Weekend Only" }
  ];

  return (
    <>
      {/* ARCHITECTURAL HERO */}
      <section className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 max-w-7xl mx-auto pt-20 pb-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end z-10">
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center gap-2 sm:gap-3 text-orange-200/40 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[8px] sm:text-[10px] font-black"
            >
              <span className="w-6 sm:w-8 h-[1px] bg-current"></span> <span className="hidden sm:inline">Small Batch •</span> San Marcos, TX
            </motion.div>
            
            {/* ✅ FIXED: Proper motion.h1 syntax with space after tag name */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-[18vw] sm:text-[14vw] lg:text-[10rem] font-light leading-[0.8] tracking-tighter italic"
            >
              Taste the <br/> 
              <span className="font-black not-italic text-white">time.</span>
            </motion.h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-orange-100/90 font-medium max-w-lg italic">
              Don't half-loaf your mornings.
            </p>
            <p className="text-base sm:text-xl text-stone-500 max-w-md font-light leading-relaxed">
              We treat dough like concrete. 40 hours of fermentation. 500 degrees of heat. One perfect result.
            </p>
          </div>
          <div className="lg:col-span-4 pb-8 sm:pb-12 flex flex-col items-start lg:items-end gap-4 sm:gap-6">
            <button className="bg-white text-black px-8 sm:px-12 py-5 sm:py-7 rounded-full font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] hover:bg-orange-100 transition-all shadow-2xl flex items-center gap-2 w-full sm:w-auto justify-center">
              Reserve a Loaf <ArrowRight className="w-3 h-3" />
            </button>
            {/* WHITE BACKGROUND FOR VISIBILITY */}
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2">
              <Clock className="w-3 h-3" /> Next Batch: 06:00 AM Tomorrow
            </span>
          </div>
        </div>

        {/* BACKGROUND ACCENT */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full z-0 opacity-20 pointer-events-none hidden lg:block">
          <img 
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover rounded-l-[10rem]" 
            alt="artisan bread texture" 
          />
        </div>
      </section>

      {/* HORIZONTAL SCROLL MENU */}
      <section id="menu" className="py-20 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tighter italic">The Morning <br/><span className="font-black not-italic">Architecture</span></h2>
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-600">01 / 10</div>
        </div>

        {/* Glass Scrollbar Indicator */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-900/50 to-orange-200/50 rounded-full"
              style={{ 
                width: useTransform(scrollX, [0, -((menu.length * 320) - window.innerWidth)], ["0%", "100%"]) 
              }}
            />
          </div>
          <span className="text-[9px] uppercase tracking-widest text-stone-600 whitespace-nowrap">Drag →</span>
        </div>

        {/* Smooth Drag Scroll Container */}
        <motion.div 
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 cursor-grab active:cursor-grabbing"
          drag="x"
          dragMomentum={true}
          dragElastic={0.1}
          style={{ x: scrollX }}
        >
          {menu.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedProduct(item)}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] group cursor-pointer bg-[#1a1a1a] p-6 sm:p-8 border border-white/5 hover:border-orange-900/50 transition-all flex flex-col justify-between h-[480px] sm:h-[520px] rounded-2xl"
            >
              <div className="relative">
                {item.tag && (
                  <span className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 bg-orange-900/30 text-orange-200 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-3 py-1 rounded-full">
                    {item.tag}
                  </span>
                )}
                <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={item.img} className="w-full h-full object-cover" alt={item.name} loading="lazy" />
                </div>
              </div>
              <div>
                <span className="text-orange-200/20 text-4xl sm:text-5xl font-black italic block mb-2 sm:mb-3">0{item.id}</span>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tighter leading-none">{item.name}</h3>
                <p className="text-stone-500 text-[10px] sm:text-xs mt-2 sm:mt-3 uppercase tracking-widest">{item.price} — Limited Quantity</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* THE PROCESS */}
      <section id="process" className="py-20 sm:py-32 px-4 sm:px-6 bg-[#0f0f0f] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <span className="w-8 sm:w-12 h-[1px] bg-orange-900/50"></span>
            <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tighter italic">The <span className="font-black not-italic">Process</span></h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              { icon: "🌾", title: "Mill", desc: "Stone-ground flour from Texas heritage grains" },
              { icon: "⏱️", title: "Ferment", desc: "36–48 hour cold fermentation for depth" },
              { icon: "🤲", title: "Shape", desc: "Hand-formed using traditional tension techniques" },
              { icon: "🚚", title: "Deliver", desc: "Baked at dawn, available by 6AM" }
            ].map((step, i) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 sm:p-6"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-tighter mb-2 sm:mb-3">{step.title}</h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VISIT US */}
      <section id="visit" className="py-20 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tighter italic">Visit the <br/><span className="font-black not-italic">Atelier</span></h2>
            <div className="space-y-4 sm:space-y-6 text-stone-300">
              <div className="flex items-start gap-3 sm:gap-4">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-200/60 mt-1" />
                <div>
                  <p className="font-medium text-sm sm:text-base">128 Henderson St, San Marcos, TX</p>
                  <p className="text-stone-500 text-xs sm:text-sm">Corner of Henderson & University • Street parking + bike racks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-200/60 mt-1" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Wed–Sun: 6:00 AM – 2:00 PM</p>
                  <p className="text-stone-500 text-xs sm:text-sm">Closed Mon–Tue for R&D and deep fermentation</p>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 sm:gap-3 text-orange-200 hover:text-orange-100 transition-colors font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
              Get Directions <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="relative h-[300px] sm:h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5">
            <img 
              src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
              alt="bakery interior" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <p className="text-stone-400 text-[9px] sm:text-xs uppercase tracking-widest mb-2">Inside the Atelier</p>
              <p className="text-white/90 font-light text-sm sm:text-base">Where architecture meets aroma.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE */}
      <section className="bg-white text-black py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Join the <br/> <span className="italic font-light">Secret Batch.</span>
          </h2>
          <p className="text-base sm:text-xl text-stone-500 font-medium max-w-lg mx-auto">
            Our most intricate bakes sell out in minutes. Get a text notification when the oven doors open.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto pt-4 sm:pt-8">
            <input 
              type="tel" 
              placeholder="YOUR PHONE NUMBER" 
              className="flex-grow bg-stone-100 px-6 sm:px-8 py-4 sm:py-6 rounded-full text-xs font-bold outline-none focus:ring-2 ring-orange-200 transition-all"
            />
            <button className="bg-black text-white px-8 sm:px-10 py-4 sm:py-6 rounded-full font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
              Notify Me
            </button>
          </div>
        </div>
      </section>

      {/* PRODUCT OVERLAY */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-5xl w-full grid md:grid-cols-2 gap-8 sm:gap-12 items-center relative bg-[#1a1a1a] p-6 sm:p-12 rounded-2xl sm:rounded-[3rem] border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 sm:top-8 right-4 sm:right-8 p-2 text-white/40 hover:text-white bg-white/5 rounded-full">
                <X className="w-5 h-5 sm:w-6 sm:h-6"/>
              </button>
              <div className="aspect-square rounded-xl sm:rounded-[2rem] overflow-hidden relative">
                {selectedProduct.tag && (
                  <span className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 bg-orange-900/40 text-orange-100 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    {selectedProduct.tag}
                  </span>
                )}
                <img src={selectedProduct.img} className="w-full h-full object-cover" alt={selectedProduct.name} />
              </div>
              <div className="space-y-4 sm:space-y-8">
                <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none">{selectedProduct.name}</h3>
                <p className="text-stone-400 text-base sm:text-lg leading-relaxed">{selectedProduct.desc}</p>
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="text-2xl sm:text-3xl font-light italic">{selectedProduct.price}</span>
                  <button className="flex-grow bg-white text-black py-4 sm:py-6 rounded-full font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center justify-center gap-2">
                    Pre-Order <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="pt-4 sm:pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-stone-500 text-xs">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ready in 2 hours</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickup only</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyKneadHome;
