// src/pages/dailyknead/pages/Process.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wheat, Timer, Flame, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Process = () => {
  const steps = [
    {
      icon: <Wheat className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Source",
      desc: "We partner with Texas heritage grain mills for stone-ground flour that retains nutrients and flavor compounds lost in industrial milling.",
      detail: "Grains: Red Fife wheat, Sonora white, rye • Mills: Barton Springs Mill, Grist & Toll",
      img: "https://images.unsplash.com/photo-1574323344406-b646a73f9a60?auto=format&fit=crop&q=80"
    },
    {
      icon: <Timer className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Ferment",
      desc: "36–48 hour cold fermentation develops complex flavors, improves digestibility, and creates the signature open crumb structure.",
      detail: "Starter: 10+ year-old wild yeast culture • Temp: 38°F • Time: 36–48 hours",
      img: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80"
    },
    {
      icon: <Heart className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Shape",
      desc: "Each loaf is hand-formed using traditional tension techniques that create the perfect crust-to-crumb ratio.",
      detail: "Technique: French fold + final proof in banneton • Rest: 2–4 hours at room temp",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80"
    },
    {
      icon: <Flame className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Bake",
      desc: "Stone-deck ovens at 500°F with steam injection create the crackling crust and caramelized notes that define our bread.",
      detail: "Oven: Wood-fired stone deck • Steam: 30 seconds at load • Bake: 22–28 minutes",
      img: "https://images.unsplash.com/photo-1598144819059-6414893b0633?auto=format&fit=crop&q=80"
    }
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
            <span className="w-8 h-[1px] bg-current"></span> Our Method
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-4 sm:mb-6">
            The <span className="italic font-light text-stone-500">Process</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-stone-400 leading-relaxed">
            Four days. Four steps. One perfect loaf.
          </p>
        </motion.div>
      </section>

      {/* PROCESS TIMELINE */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="space-y-12 sm:space-y-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              {/* Image */}
              <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5">
                <img 
                  src={step.img} 
                  alt={step.title} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-orange-200/60">
                    {step.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">Step {i + 1} of 4</span>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tighter mb-2">{step.title}</h3>
                  <p className="text-stone-400 text-base leading-relaxed">{step.desc}</p>
                </div>
                
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Technical Details</p>
                  <p className="text-sm text-stone-300">{step.detail}</p>
                </div>
                
                {i === steps.length - 1 && (
                  <div className="pt-4 border-t border-white/5">
                    <Link to="/bakery#menu" className="inline-flex items-center gap-2 text-orange-200 hover:text-orange-100 transition-colors font-black uppercase tracking-widest text-[9px] sm:text-[10px]">
                      Taste the Result <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY BANNER */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0f0f0f] border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-900/20 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-200">
              <Heart className="w-3 h-3" /> Craft, Not Compromise
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
              Why Time Matters
            </h3>
            <p className="text-stone-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Industrial bread is made in hours. Ours takes days. That time allows enzymes to break down complex sugars, yeast to develop nuanced flavors, and gluten to strengthen naturally — resulting in bread that's not just delicious, but easier to digest and more nourishing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Ready to Taste the Difference?</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/bakery#menu" className="px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-orange-100 transition-colors">
              View Today's Loaves
            </Link>
            <Link to="/bakery/wholesale" className="px-8 py-4 bg-[#1a1a1a] border border-white/10 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#252525] transition-colors">
              Wholesale Inquiries
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Process;
