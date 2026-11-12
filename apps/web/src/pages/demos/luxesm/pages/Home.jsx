// src/pages/luxesm/pages/Home.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PHONE = "6822848837";
const PHONE_DISPLAY = "(682) 284-8837";
const PHONE_HREF = `tel:${PHONE}`;

const SERVICES = [
  { icon: "✂", name: "Precision Cut", desc: "Structural cuts engineered to last weeks past the appointment.", price: "$65+", tag: "Most Popular" },
  { icon: "🎨", name: "Balayage & Color", desc: "Hand-painted sun-kissed dimensions. Natural in any Texas light.", price: "$145+", tag: "" },
  { icon: "💛", name: "Platinum Blonding", desc: "Integrity-first lightening with zero compromise on your health.", price: "$220+", tag: "Specialty" },
  { icon: "✨", name: "Extensions", desc: "Great Lengths certified volume and length you'll never want to take out.", price: "$350+", tag: "" },
  { icon: "🌈", name: "Vivid Color", desc: "Bold tones that hold and make every room stop.", price: "$185+", tag: "" },
  { icon: "💆", name: "Blowout & Style", desc: "Walk in. Walk out glowing. Perfect for any event.", price: "$55+", tag: "" },
];

const STYLISTS = [
  { name: "Jessica Rivera", role: "Master Artistry Director", rating: 5.0, tags: ["Platinum Blonding", "Extensions"], desc: "14 years of editorial experience. Jessica engineers confidence through chemical precision.", img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=600" },
  { name: "Michael Vance", role: "Senior Creative Stylist", rating: 4.9, tags: ["Precision Cuts", "Editorial"], desc: "Treats every cut like a structural asset. Sharp, long-lasting shapes that hold for weeks.", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600" },
  { name: "Sofia Laurent", role: "Color Alchemist", rating: 4.8, tags: ["Balayage", "Vivid Color"], desc: "Sun-kissed color that looks effortlessly natural in any Texas light.", img: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=600" },
];

// Color tokens
const C = {
  cream: "#faf9f6", sand: "#f5ede2", stone: "#c4a98a", muted: "#9b8270",
  body: "#5c4a3a", dark: "#2e1f12", accent: "#8b6343", border: "rgba(139,99,67,0.15)",
  borderSoft: "rgba(139,99,67,0.08)", shadow: "rgba(46,31,18,0.07)", shadowMd: "rgba(46,31,18,0.12)", green: "#22c55e"
};

// Stars component
function Stars({ rating }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= Math.round(rating) ? "#c49a6c" : "#e0cfc0"} style={{ flexShrink: 0 }}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span style={{ fontSize: 13, color: C.muted, marginLeft: 6, fontWeight: 500 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

const LuxeSMHome = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", stylist: "", datetime: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => { setSubmitted(true); setForm({ name: "", phone: "", email: "", service: "", stylist: "", datetime: "", notes: "" }); }, 800);
  };

  const inp = { width: "100%", padding: "14px 18px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: C.dark, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" };
  const sel = { ...inp, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23c4a98a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" };

  return (
    <>
      {/* HERO */}
      <section id="hero" className="pt-24 sm:pt-28 px-4 sm:px-6 pb-12 sm:pb-16" style={{ maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2" style={{ background: C.sand, border: `1px solid ${C.border}`, borderRadius: 999, padding: "7px 18px", fontSize: 11, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>
          ⭐ Top Rated Salon · San Marcos 2024
        </motion.div>

        <h1 className="font-['Playfair_Display'] mb-4" style={{ fontSize: "clamp(42px, 9vw, 80px)", fontWeight: 400, lineHeight: 0.95, letterSpacing: -0.5, color: C.dark }}>
          The Art of<br /><em style={{ fontStyle: "italic", color: C.stone, fontWeight: 400 }}>Beautiful Hair.</em>
        </h1>

        <p style={{ fontSize: 17, color: C.body, lineHeight: 1.7, maxWidth: 480, marginBottom: 30 }}>
          Boutique color, cuts, and extensions. San Marcos' premier destination for precision hair transformation.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
          <button onClick={() => scrollTo("booking")} style={{ background: C.dark, color: "#fff", border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 24px ${C.shadowMd}` }}>
            Book Appointment →
          </button>
          <a href={PHONE_HREF} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 22px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, fontSize: 14, fontWeight: 500, color: C.dark, textDecoration: "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0 }} /> {PHONE_DISPLAY}
          </a>
        </div>

        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", aspectRatio: "16/7", boxShadow: `0 20px 64px ${C.shadowMd}` }}>
          <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1400" alt="Luxe SM Salon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(46,31,18,0.6) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", inset: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,0.15)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "0 12px", width: "100%", pointerEvents: "none" }}>
            {["⭐ 4.9 Rating", "500+ Clients", "📍 San Marcos"].map(s => (
              <div key={s} style={{ background: "rgba(250,249,246,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", pointerEvents: "auto" }}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: C.stone, fontWeight: 600, marginBottom: 10 }}>What we offer</div>
            <h2 className="font-['Playfair_Display']" style={{ fontSize: "clamp(30px, 5.5vw, 48px)", fontWeight: 400, color: C.dark, letterSpacing: -0.3, lineHeight: 1.1 }}>
              Our <em style={{ fontStyle: "italic", color: C.stone, fontWeight: 400 }}>Services</em>
            </h2>
            <p style={{ color: C.muted, fontSize: 16, marginTop: 12, lineHeight: 1.6 }}>Precision, care, and results that last.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {SERVICES.map(s => (
              <motion.div key={s.name} whileHover={{ y: -6 }} style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 20, padding: "26px 22px", boxShadow: `0 3px 12px ${C.shadow}`, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 320 }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 64, height: 64, background: `radial-gradient(circle at top right, ${C.sand}, transparent)`, borderRadius: "0 20px 0 0" }} />
                {s.tag && <span style={{ display: "inline-block", background: C.dark, color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{s.tag}</span>}
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.dark, marginBottom: 8, lineHeight: 1.3 }}>{s.name}</div>
                <div style={{ fontSize: 14, color: C.body, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{s.desc}</div>
                <div style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <div>
                    <div className="font-['Playfair_Display']" style={{ fontSize: 24, fontWeight: 400, color: C.dark, lineHeight: 1 }}>{s.price}</div>
                    <div style={{ fontSize: 10, color: C.stone, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Starting price</div>
                  </div>
                  <button onClick={() => scrollTo("booking")} style={{ background: C.dark, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Book →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <div style={{ background: C.dark, padding: "60px 24px", textAlign: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(196,169,138,0.08) 0%, transparent 65%)" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <p className="font-['Playfair_Display']" style={{ fontSize: "clamp(22px, 4.5vw, 36px)", fontWeight: 400, color: "#fff", marginBottom: 30, lineHeight: 1.35 }}>
            Ready for your <em style={{ fontStyle: "italic", color: "#c8b89a", fontWeight: 400 }}>transformation?</em>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => scrollTo("booking")} style={{ background: "#fff", color: C.dark, border: "none", borderRadius: 999, padding: "14px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Book Now
            </button>
            <a href={PHONE_HREF} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "14px 24px", background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 999, color: "#fff", fontSize: 14, textDecoration: "none" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />{PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      {/* STYLISTS */}
      <section id="stylists" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: "#1c1410", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "#6a5545", fontWeight: 600, marginBottom: 10 }}>Meet the artists</div>
            <h2 className="font-['Playfair_Display']" style={{ fontSize: "clamp(30px, 5.5vw, 48px)", fontWeight: 400, color: "#fff", letterSpacing: -0.3, lineHeight: 1.1 }}>
              Our <em style={{ fontStyle: "italic", color: "#a8896c", fontWeight: 400 }}>Stylists</em>
            </h2>
            <p style={{ color: "#6a5545", fontSize: 16, marginTop: 12, lineHeight: 1.6 }}>Ranked by client retention and performance.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {STYLISTS.map(st => (
              <motion.div key={st.name} whileHover={{ y: -8 }} style={{ background: "#251c16", border: "1px solid rgba(196,169,138,0.13)", borderRadius: 22, overflow: "hidden", boxShadow: "0 6px 32px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <img src={st.img} alt={st.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", filter: "sepia(15%) saturate(0.9)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(37,28,22,0.6) 0%, transparent 55%)" }} />
                  <div style={{ position: "absolute", inset: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", pointerEvents: "none" }} />
                </div>
                <div style={{ padding: "24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "#6a5545", marginBottom: 6, fontWeight: 600 }}>{st.role}</div>
                  <div className="font-['Playfair_Display']" style={{ fontSize: 22, fontWeight: 400, color: "#fff", marginBottom: 14, lineHeight: 1.2 }}>{st.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                    {st.tags.map(t => (
                      <span key={t} style={{ background: "rgba(196,169,138,0.1)", border: "1px solid rgba(196,169,138,0.2)", borderRadius: 7, padding: "4px 11px", fontSize: 10, color: "#b89a7c", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: "#7a6455", lineHeight: 1.65, marginBottom: 20, flex: 1 }}>{st.desc}</p>
                  <div style={{ borderTop: "1px solid rgba(196,169,138,0.12)", paddingTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <Stars rating={st.rating} />
                    <button onClick={() => scrollTo("booking")} style={{ background: "rgba(196,169,138,0.1)", border: "1px solid rgba(196,169,138,0.22)", borderRadius: 9, padding: "9px 16px", fontSize: 11, color: "#c4a98a", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      Book with me
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.cream, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: C.stone, fontWeight: 600, marginBottom: 10 }}>Portfolio</div>
            <h2 className="font-['Playfair_Display']" style={{ fontSize: "clamp(30px, 5.5vw, 48px)", fontWeight: 400, color: C.dark, letterSpacing: -0.3, lineHeight: 1.1 }}>
              The <em style={{ fontStyle: "italic", color: C.stone, fontWeight: 400 }}>Work</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              "https://images.unsplash.com/photo-1601397922721-4326b5f54f57?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=600",
              "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&q=80&w=600",
            ].map((src, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className={`${i === 0 ? 'md:row-span-2' : ''} rounded-xl sm:rounded-2xl overflow-hidden border`} style={{ borderColor: C.border, aspectRatio: i === 0 ? 'auto' : '1/1' }}>
                <img src={src} alt={`Portfolio ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(10%)", transition: "filter 0.3s ease" }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: C.stone, fontWeight: 600, marginBottom: 10 }}>Ready to transform?</div>
            <h2 className="font-['Playfair_Display']" style={{ fontSize: "clamp(30px, 5.5vw, 48px)", fontWeight: 400, color: C.dark, marginBottom: 10, lineHeight: 1.1 }}>
              Book Your <em style={{ fontStyle: "italic", color: C.stone, fontWeight: 400 }}>Appointment</em>
            </h2>
            <p style={{ color: C.muted, fontSize: 16, marginBottom: 20, lineHeight: 1.6 }}>We'll confirm via text message within minutes.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 999, padding: "8px 18px", fontSize: 12, color: "#16a34a", fontWeight: 500 }}>
              ✅ SMS confirmation sent automatically
            </div>
          </div>

          {submitted ? (
            <div style={{ background: C.cream, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "36px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>🎉</div>
              <h3 className="font-['Playfair_Display']" style={{ fontSize: 28, fontWeight: 400, color: C.dark, marginBottom: 10, lineHeight: 1.2 }}>Request Received!</h3>
              <p style={{ color: C.body, fontSize: 16, lineHeight: 1.6 }}>We'll text <strong>{form.phone}</strong> to confirm shortly.</p>
              <a href={PHONE_HREF} style={{ display: "inline-block", marginTop: 22, color: C.accent, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>Call us: {PHONE_DISPLAY}</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: C.cream, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: "36px", display: "grid", gap: 16, boxShadow: `0 8px 40px ${C.shadow}` }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required style={inp} placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input required type="tel" style={inp} placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <input type="email" style={inp} placeholder="Email (optional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <select required style={sel} value={form.service} onChange={e => setForm({...form, service: e.target.value})}>
                <option value="" disabled>Select a Service</option>
                {SERVICES.map(s => <option key={s.name}>{s.name} – {s.price}</option>)}
              </select>
              <select style={sel} value={form.stylist} onChange={e => setForm({...form, stylist: e.target.value})}>
                <option value="">Preferred Stylist (optional)</option>
                {STYLISTS.map(s => <option key={s.name}>{s.name}</option>)}
                <option>No preference</option>
              </select>
              <input style={inp} placeholder="Preferred Date & Time" value={form.datetime} onChange={e => setForm({...form, datetime: e.target.value})} />
              <textarea style={{...inp, resize: "vertical", minHeight: 100, fontFamily: "'DM Sans', sans-serif"}} placeholder="Tell us about your hair goals..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              <button type="submit" style={{ background: C.dark, color: "#fff", border: "none", borderRadius: 12, padding: "18px 0", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Request Appointment →
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: C.stone, marginTop: 4 }}>
                Questions? Call <a href={PHONE_HREF} style={{ color: C.accent, fontWeight: 600 }}>{PHONE_DISPLAY}</a>
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default LuxeSMHome;
