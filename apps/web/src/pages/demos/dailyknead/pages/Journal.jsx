// src/pages/dailyknead/pages/Journal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Journal = () => {
  const articles = [
    { id: 1, title: "The Science of 36-Hour Fermentation", excerpt: "Why we wait a day and a half to bake your bread, and what happens to the dough during that time.", category: "Process", date: "May 3, 2026", readTime: "8 min read", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80" },
    { id: 2, title: "Sourcing Texas Heritage Grains", excerpt: "Our partnership with local mills and why ancient wheat varieties matter for flavor and nutrition.", category: "Sourcing", date: "Apr 28, 2026", readTime: "6 min read", image: "https://images.unsplash.com/photo-1574323344406-b646a73f9a60?auto=format&fit=crop&q=80" },
    { id: 3, title: "Lamination Architecture: 256 Layers", excerpt: "The mathematical precision behind our oat-milk croissants and the physics of butter layers.", category: "Technique", date: "Apr 15, 2026", readTime: "10 min read", image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&q=80" },
    { id: 4, title: "Zero-Waste Baking Initiative", excerpt: "How we repurpose every gram of dough, from stale bread croutons to spent grain animal feed.", category: "Sustainability", date: "Apr 2, 2026", readTime: "5 min read", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80" },
    { id: 5, title: "The Perfect Crust: Maillard Reaction", excerpt: "Understanding the chemistry of browning and why 500°F is our magic number.", category: "Science", date: "Mar 20, 2026", readTime: "7 min read", image: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80" },
    { id: 6, title: "Seasonal Baking: Spring Edition", excerpt: "Incorporating Texas wildflowers, early strawberries, and fresh herbs into our spring menu.", category: "Seasonal", date: "Mar 1, 2026", readTime: "6 min read", image: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&q=80" }
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
      <section className="pb-8 sm:pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
          <div className="flex items-center gap-3 text-orange-200/40 uppercase tracking-[0.4em] text-[10px] font-black mb-6 sm:mb-8">
            <span className="w-8 h-[1px] bg-current"></span> Stories & Techniques
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-4 sm:mb-6">
            The <span className="italic font-light text-stone-500">Journal</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-stone-400 leading-relaxed">
            Deep dives into our process, the science of bread, seasonal ingredients, and the people behind the loaves.
          </p>
        </motion.div>
      </section>

      {/* ARTICLES GRID */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {articles.map((article, i) => (
            <motion.article key={article.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-white/5">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                  <span className="bg-[#121212]/80 backdrop-blur-sm text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">{article.category}</span>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tighter leading-tight group-hover:text-orange-200 transition-colors">{article.title}</h2>
                <p className="text-stone-500 text-xs sm:text-sm leading-relaxed line-clamp-3">{article.excerpt}</p>
                <div className="pt-1 sm:pt-2">
                  <span className="inline-flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-orange-200/60 group-hover:text-orange-200 transition-colors">
                    Read Article <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0f0f0f] border-y border-white/5">
        <div className="max-w-2xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter">
            Get Stories in Your <span className="italic font-light text-stone-500">Inbox</span>
          </h2>
          <p className="text-stone-400 text-sm sm:text-base">
            Monthly dispatches on baking techniques, seasonal menus, and behind-the-scenes from the atelier.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-md mx-auto">
            <input type="email" placeholder="YOUR EMAIL" className="flex-grow bg-[#1a1a1a] border border-white/10 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full text-xs font-bold outline-none focus:border-orange-900/50 transition-colors" />
            <button className="bg-white text-black px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-orange-100 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Journal;
