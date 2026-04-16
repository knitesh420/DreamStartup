'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPackage, FiTruck, FiCheckCircle, FiBox } from 'react-icons/fi';

const TRACKING_STEPS = [
  { id: 1, label: 'Order Placed', icon: <FiBox />, active: true },
  { id: 2, label: 'Packed', icon: <FiPackage />, active: true },
  { id: 3, label: 'In Transit', icon: <FiTruck />, active: true },
  { id: 4, label: 'Delivered', icon: <FiCheckCircle />, active: false },
];

export default function OrderTrackingPage() {
  const [mounted, setMounted] = useState(false);
  const [trackId, setTrackId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    setIsTracking(true);
    // Simulate API call
    setTimeout(() => {
      setIsTracking(false);
      setShowStatus(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#1e3a5f] py-24 px-4 overflow-hidden relative selection:bg-emerald-500/30">
      <div className="absolute bottom-0 right-10 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
      
      <div className={`max-w-4xl mx-auto transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 items-center justify-center text-3xl border border-emerald-100 mb-6 shadow-sm">
            <FiTruck />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#1e3a5f] tracking-tight mb-4 leading-tight">
            Track Your Order
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-light">
            Enter your tracking number or Order ID below to see the live status of your delivery.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-lg relative z-10 max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 mb-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-slate-400">
                <FiSearch size={20} />
              </div>
              <input 
                type="text" 
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                placeholder="e.g. TRK-98765432" 
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 rounded-2xl pl-12 pr-4 py-4 text-[#1e3a5f] font-bold outline-none transition-all shadow-inner"
              />
            </div>
            <button 
              type="submit" 
              disabled={isTracking || !trackId.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-md flex items-center justify-center min-w-[140px]"
            >
              {isTracking ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Track Now'}
            </button>
          </form>
        </div>

        {/* Tracking Status Display */}
        <div className={`mt-16 transition-all duration-700 ${showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-100 pb-8 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Order Number</p>
                <h3 className="text-2xl font-extrabold text-[#1e3a5f]">{trackId.toUpperCase() || 'TRK-98765432'}</h3>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Delivery</p>
                <h3 className="text-xl font-extrabold text-emerald-500">Tomorrow, by 8 PM</h3>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="relative z-10">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block" />
              {/* Active Progress Bar */}
              <div className="absolute top-1/2 left-0 w-[66%] h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 -translate-y-1/2 rounded-full hidden md:block shadow-sm" />

              <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-0">
                {TRACKING_STEPS.map((step, i) => (
                  <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                    {/* Mobile connecting line */}
                    {i !== TRACKING_STEPS.length - 1 && (
                      <div className={`absolute left-7 top-14 w-0.5 h-full -z-10 md:hidden ${step.active ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                    )}
                    
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 shadow-sm ${step.active ? 'bg-emerald-500 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                      {step.icon}
                    </div>
                    
                    <div className="md:text-center">
                      <h4 className={`font-bold ${step.active ? 'text-[#1e3a5f]' : 'text-slate-400'}`}>{step.label}</h4>
                      {step.active && <p className="text-xs text-emerald-500 mt-1 uppercase tracking-wider font-bold">Completed</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
