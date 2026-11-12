// src/pages/dailyknead/pages/Wholesale.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Check, Building2, Coffee, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wholesale = () => {
  const [formData, setFormData] = useState({
    businessName: '', contactName: '', email: '', phone: '', type: '', message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Inquiry sent! We\'ll be in touch within 24 hours.');
    setFormData({ businessName: '', contactName: '', email: '', phone: '', type: '', message: '' });
  };

  const partnershipTypes = [
    { icon: Coffee, title: "Cafés & Coffee Shops", desc: "Pair our artisan breads with your specialty coffee. Consistent supply, flexible ordering." },
    { icon: UtensilsCrossed, title: "Restaurants", desc: "Elevate your table service with house-made focaccia, dinner rolls, and specialty loaves." },
    { icon: Building2, title: "Hotels & Catering", desc: "Bulk orders for breakfast service, events, and in-house dining experiences." }
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
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-orange-200/40 uppercase tracking-[0.4em] text-[10px] font-black mb-6 sm:mb-8">
            <span className="w-8 h-[1px] bg-current"></span> B2B Partnerships
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-6 sm:mb-8">
            Supply Your <br/><span className="italic font-light text-stone-500">Establishment.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-stone-400 max-w-2xl leading-relaxed">
            We partner with select cafés, restaurants, and hotels in Central Texas to provide consistently exceptional bread. Small-batch quality at wholesale scale.
          </p>
        </div>
      </section>

      {/* PARTNERSHIP TYPES */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0f0f0f] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {partnershipTypes.map((type, i) => (
              <motion.div key={type.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-white/5 hover:border-orange-900/30 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-900/20 flex items-center justify-center mb-4 sm:mb-6">
                  <type.icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-200/80" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tighter mb-3 sm:mb-4">{type.title}</h3>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">{type.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-tighter italic mb-6 sm:mb-8">
              What We <span className="font-black not-italic">Provide</span>
            </h2>
            <ul className="space-y-3 sm:space-y-4">
              {["Weekly delivery schedule (Wed–Sun)", "Consistent quality, batch-tested", "Custom sizing and formulations", "Dedicated account manager", "Flexible minimum orders", "Staff training on storage & service"].map((item, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5 sm:gap-3 text-stone-300">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-orange-200/60 flex-shrink-0" />
                  <span className="text-xs sm:text-base">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="relative h-[300px] sm:h-[400px] md:h-[500px] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-white/5">
            <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="wholesale bread production" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
          </div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white text-black">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3 sm:mb-4 text-center">
            Start the <span className="italic font-light">Conversation</span>
          </h2>
          <p className="text-stone-500 text-center mb-8 sm:mb-12 text-sm sm:text-base">Tell us about your establishment and needs.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Business Name</label>
                <input type="text" required className="w-full bg-stone-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 ring-orange-200"
                  value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Contact Name</label>
                <input type="text" required className="w-full bg-stone-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 ring-orange-200"
                  value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Email</label>
                <input type="email" required className="w-full bg-stone-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 ring-orange-200"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Phone</label>
                <input type="tel" required className="w-full bg-stone-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 ring-orange-200"
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Business Type</label>
              <select required className="w-full bg-stone-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 ring-orange-200"
                value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="">Select...</option>
                <option value="cafe">Café / Coffee Shop</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="catering">Catering</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2">Message</label>
              <textarea rows={4} className="w-full bg-stone-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 ring-orange-200 resize-none"
                placeholder="Tell us about your volume needs, delivery schedule, etc." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-black text-white py-4 sm:py-5 rounded-full font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-orange-900 transition-colors">
              Send Inquiry
            </button>
          </form>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
            <a href="mailto:wholesale@dailyknead.com" className="flex items-center justify-center gap-2 text-stone-600 hover:text-black transition-colors">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> wholesale@dailyknead.com
            </a>
            <a href="tel:+15125551234" className="flex items-center justify-center gap-2 text-stone-600 hover:text-black transition-colors">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> (512) 555-1234
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Wholesale;
