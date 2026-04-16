'use client';

import { useState, useEffect } from 'react';
import { FiTarget, FiHeart, FiGlobe, FiUsers } from 'react-icons/fi';

const STATS = [
  { val: '10K+', label: 'Products Delivered' },
  { val: '500+', label: 'Startups Launched' },
  { val: '50+', label: 'Cities Covered' },
  { val: '4.9/5', label: 'Average Rating' }
];

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-slate-50 text-[#1e3a5f] overflow-hidden relative">
      {/* Soft abstract shapes for light mode */}
      <div className="absolute top-0 right-0 -mr-40 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero */}
      <section className={`relative pt-32 pb-24 px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-orange-100 border border-orange-200 text-orange-600 text-xs font-bold uppercase py-1.5 px-4 rounded-full mb-6 relative overflow-hidden group shadow-sm">
            <span className="relative z-10">About DreamStartup</span>
            <div className="absolute inset-0 bg-orange-200 opacity-0 group-hover:opacity-30 transition-opacity" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-[#1e3a5f] leading-tight tracking-tight">
            Our Mission is <span className="text-orange-500 relative">
              Your Success
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-300 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
            We are building India's most comprehensive ecosystem for small businesses. Enabling wholesale trade, specialized startup kits, and a trusted network of service professionals.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="relative z-10 py-12 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={s.label} className="group relative p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-100 hover:shadow-[0_20px_40px_-15px_rgba(30,58,95,0.1)] transition-all duration-500 transform hover:-translate-y-2 text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-4xl md:text-5xl font-extrabold text-[#1e3a5f] mb-2 group-hover:scale-110 transition-transform origin-bottom">{s.val}</div>
              <div className="text-sm font-bold text-orange-500 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="relative z-10 py-24 px-4 mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">What Drives Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <FiTarget />, title: 'Purpose', desc: 'Every kit built and order shipped must add undeniable value to our customers.' },
              { icon: <FiHeart />, title: 'Empathy', desc: 'We understand the hurdles of starting fresh. We design our process to be deeply supportive.' },
              { icon: <FiGlobe />, title: 'Reach', desc: 'From tier-1 cities to deep rural markets, we want our impact to be ubiquitous across India.' },
              { icon: <FiUsers />, title: 'Community', desc: 'We aren’t just a vendor. We are a partner mapping the success stories of countless entrepreneurs.' }
            ].map((v, i) => (
              <div key={v.title} className="text-center group bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 mx-auto bg-blue-50 border border-blue-100 text-[#1e3a5f] text-2xl flex items-center justify-center rounded-2xl mb-6 group-hover:bg-[#1e3a5f] group-hover:text-white group-hover:scale-110 transition-all shadow-[0_0_0_0_rgba(30,58,95,0)] group-hover:shadow-[0_10px_30px_rgba(30,58,95,0.3)]">
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-loose">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-24"></div>
    </div>
  );
}
