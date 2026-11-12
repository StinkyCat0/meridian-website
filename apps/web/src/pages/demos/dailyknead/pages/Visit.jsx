// src/pages/dailyknead/pages/Visit.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Phone, Mail, Instagram, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Visit = () => {
  const menuItems = [
    { name: "The 36-Hour Sourdough", price: "$12", desc: "Wild yeast, stone-ground rye, Texas honey", tag: "Signature" },
    { name: "Oat-Milk Croissant", price: "$7", desc: "256 layers, plant-based butter", tag: "Vegan" },
    { name: "Sea Salt Focaccia", price: "$14", desc: "Rosemary oil, Gulf sea salt", tag: "Chef's Pick" },
    { name: "Black Sesame Brioche", price: "$9", desc: "Toasted sesame, nigella finish", tag: "New" },
    { name: "Cardamom Rose Loaf", price: "$11", desc: "Persian rosewater, honey glaze", tag: "Limited" },
    { name: "Olive & Thyme Ciabatta", price: "$10", desc: "Kalamata olives, fresh thyme", tag: "" },
    { name: "Brown Butter Kouign-Amann", price: "$8", desc: "Caramelized layers, sea salt", tag: "Fan Favorite" },
    { name: "Spelt & Fig Loaf", price: "$13", desc: "Ancient grain, mission figs, balsamic", tag: "Seasonal" },
  ];

  const hours = [
    { day: "Wednesday", time: "6:00 AM – 2:00 PM" },
    { day: "Thursday", time: "6:00 AM – 2:00 PM" },
    { day: "Friday", time: "6:00 AM – 2:00 PM" },
    { day: "Saturday", time: "6:00 AM – 2:00 PM" },
    { day: "Sunday", time: "6:00 AM – 2:00 PM" },
    { day: "Monday–Tuesday", time: "Closed (R&D + Fermentation)" },
  ];

  return (
    <div className="bg-[#121212] text-[#FAF9F6] min-h-screen font-sans selection:bg-orange-900/30 pt-20">
      
      {/* BACK LINK */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto mb-8 sm:mb-12">
        <Link to="/bakery" className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Back to Bakery</span>
        </Link>
      </div>

      {/* HERO */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
          <div className="flex items-center gap-3 text-orange-200/40 uppercase tracking-[0.4em] text-[10px] font-black mb-6 sm:mb-8">
            <span className="w-8 h-[1px] bg-current"></span> Visit Us
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-4 sm:mb-6">
            The <span className="italic font-light text-stone-500">Atelier</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-stone-400 leading-relaxed">
            San Marcos, Texas • Walk-ins welcome • Pre-orders recommended for weekends
          </p>
        </motion.div>
      </section>

      {/* LOCATION + HOURS GRID */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
          
          {/* Location Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#1a1a1a] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-5 h-5 text-orange-200/60" />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Find Us</h3>
            </div>
            
            <div className="space-y-4 text-stone-300">
              <p className="font-medium text-sm sm:text-base">128 Henderson St, San Marcos, TX 78666</p>
              <p className="text-xs sm:text-sm text-stone-500">Corner of Henderson & University • Street parking + bike racks</p>
              
              <div className="pt-4 border-t border-white/5">
                <a href="https://maps.google.com/?q=128+Henderson+St+San+Marcos+TX" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-200 hover:text-orange-100 transition-colors font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
                  Get Directions <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="mt-6 sm:mt-8 aspect-video rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 bg-[#0f0f0f] flex items-center justify-center">
              <div className="text-center text-stone-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-200/40" />
                <p className="text-xs">Interactive map coming soon</p>
              </div>
            </div>
          </motion.div>

          {/* Hours Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#1a1a1a] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-orange-200/60" />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Hours</h3>
            </div>
            
            <div className="space-y-3">
              {hours.map((slot, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm font-medium">{slot.day}</span>
                  <span className="text-sm text-stone-400">{slot.time}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-stone-500">
                <span className="text-orange-200/60">●</span> First come, first served • Pre-orders open 48h in advance
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MENU PREVIEW */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0f0f0f] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-tighter italic">Today's <br/><span className="font-black not-italic">Selection</span></h2>
              <p className="text-stone-400 mt-2 text-sm">Quantities limited • Items sell out by early afternoon</p>
            </div>
            <Link to="/bakery#menu" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-orange-200 hover:text-orange-100 transition-colors">
              View Full Menu →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {menuItems.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#121212] rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5 hover:border-orange-900/30 transition-all"
              >
                {item.tag && (
                  <span className="inline-block bg-orange-900/30 text-orange-200 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full mb-3">
                    {item.tag}
                  </span>
                )}
                <h4 className="text-base sm:text-lg font-bold uppercase tracking-tighter leading-tight mb-1">{item.name}</h4>
                <p className="text-stone-500 text-xs sm:text-sm mb-3">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-orange-200 font-bold">{item.price}</span>
                  <button className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-orange-200 transition-colors">
                    Pre-Order
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-white/5 text-center">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-4">Questions?</h3>
          <p className="text-stone-400 mb-6 sm:mb-8 max-w-md mx-auto">
            Wholesale inquiries, catering, or special requests — we'd love to hear from you.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <a href="mailto:hello@dailyknead.com" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <Mail className="w-4 h-4" /> <span className="text-sm font-medium">hello@dailyknead.com</span>
            </a>
            <a href="tel:+15125551234" className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
              <Phone className="w-4 h-4" /> <span className="text-sm font-medium">(512) 555-1234</span>
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-6">
            <a href="#" className="flex items-center gap-2 text-stone-500 hover:text-orange-200 transition-colors">
              <Instagram className="w-4 h-4" /> <span className="text-[10px] uppercase tracking-widest">@dailyknead</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Visit;
