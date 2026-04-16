'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiTool, FiZap, FiDroplet, FiArrowRight } from 'react-icons/fi';

const PROFESSIONS = [
  { icon: <FiTool />, title: 'Carpenter', desc: 'Custom furniture, woodwork, door installations, and modular repairs.' },
  { icon: <FiZap />, title: 'Electrician', desc: 'Wiring, fixture setups, and electrical repairs for all client sizes.' },
  { icon: <FiDroplet />, title: 'Plumber', desc: 'Pipeline installations, leak fixes, and complete bathroom setups.' },
];

export default function ProvidersPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-[#1e3a5f] dark:text-gray-100 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[0] right-[-10%] w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className={`relative pt-32 pb-24 px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1920&q=80" alt="Providers Background" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block border border-white/20 bg-white/10 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 shadow-sm">
            Service Providers
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white drop-shadow-lg leading-tight">
            Elevate Your <span className="text-orange-500">Trade</span>
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
            Turn your skills into steady, reliable income. Join DreamStartup's elite network of professionals and let the work come to you.
          </p>
          <Link
            href="/register?role=vendor"
            className="group inline-flex items-center gap-3 bg-[#1e3a5f] text-white font-bold px-8 py-4 rounded-full overflow-hidden relative transition-all hover:scale-105 hover:bg-[#16304f] shadow-lg"
          >
            <span className="relative z-10">Join the Network</span>
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform z-10">
              <FiArrowRight />
            </span>
          </Link>
        </div>
      </section>

      {/* Professions Grid */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1e3a5f] dark:text-gray-100 mb-4">Professions We Elevate</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROFESSIONS.map((prof, i) => (
              <div key={prof.title} className="group relative transition-all duration-500 hover:-translate-y-2" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="relative h-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-blue-200 overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[40px] group-hover:bg-blue-100 transition-all pointer-events-none" />
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-[#1e3a5f] dark:text-gray-100 border border-blue-100 dark:border-blue-800 flex items-center justify-center rounded-2xl text-3xl mb-6 group-hover:scale-110 transition-transform origin-left group-hover:bg-[#1e3a5f] group-hover:text-white">
                    {prof.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-[#1e3a5f] dark:text-gray-100 mb-4">{prof.title}</h3>
                  <p className="text-slate-500 dark:text-gray-300 leading-relaxed font-medium">
                    {prof.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works with Timeline */}
      <section className="relative z-10 py-32 px-4 border-y border-slate-100 dark:border-gray-700 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px] z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/60 via-transparent to-[#0f172a]/80 z-10" />
          <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1920&q=80" alt="Journey Background" className="w-full h-full object-cover opacity-80" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md tracking-tight">The Journey</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto drop-shadow-sm font-light">4 easy steps to recurring jobs and elevating your trade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {/* Custom glowing timeline line */}
            <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-white/10">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 w-full opacity-50" />
            </div>
            {[
              { num: '01', title: 'Register', p: 'Create a professional account.' },
              { num: '02', title: 'Verify', p: 'Pass the 48h quality review.' },
              { num: '03', title: 'Connect', p: 'Receive direct job leads.' },
              { num: '04', title: 'Earn', p: 'Complete jobs & collect pay.' }
            ].map((step, i) => (
              <div key={step.num} className="text-center relative group">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/5 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white/50 relative z-10 group-hover:border-orange-500 group-hover:bg-orange-500/10 group-hover:text-white transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] cursor-default">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 group-hover:text-orange-300">Step</span>
                  <span className="text-2xl font-black">{step.num}</span>
                </div>
                <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 group-hover:bg-white/10 transition-colors duration-500 hover:border-white/20">
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-white/70 font-medium leading-relaxed">{step.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 text-center relative z-10">
        <h2 className="text-4xl font-extrabold text-[#1e3a5f] dark:text-gray-100 mb-8">Ready to revolutionize your work?</h2>
        <Link href="/register?role=vendor" className="inline-block bg-orange-500 text-white font-bold py-4 px-12 rounded-full hover:bg-orange-600 hover:shadow-lg transition-all transform hover:-translate-y-1">
          Start Now
        </Link>
      </section>
    </div>
  );
}
