'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiLogOut, FiShield } from 'react-icons/fi';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#1e3a5f] py-24 px-4 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" />

      <div className={`max-w-4xl mx-auto transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-12 gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200 rounded-full blur animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#2d5a8e] flex items-center justify-center text-3xl font-extrabold text-white shadow-xl relative z-10">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-[#1e3a5f] tracking-tight">{user.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-orange-600 mt-2 font-bold bg-orange-100/80 inline-flex px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                <FiShield size={14} />
                <span className="uppercase text-xs tracking-wider">{user.role}</span>
              </div>
            </div>
          </div>
          
          <button onClick={() => { logout(); router.push('/login'); }} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold text-sm shadow-sm group">
            <FiLogOut className="group-hover:scale-110 transition-transform" /> Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_15px_40px_-15px_rgba(30,58,95,0.1)] relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-[#1e3a5f]" />
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-[#1e3a5f]">Personal Information</h2>
            <button className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
              <FiEdit3 /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-[#1e3a5f] mt-1 bg-blue-100 p-2 rounded-lg"><FiUser size={18} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                  <p className="font-bold text-slate-700">{user.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-[#1e3a5f] mt-1 bg-blue-100 p-2 rounded-lg"><FiMail size={18} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-bold text-slate-700">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-[#1e3a5f] mt-1 bg-blue-100 p-2 rounded-lg"><FiPhone size={18} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="font-bold text-slate-700">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-[#1e3a5f] mt-1 bg-blue-100 p-2 rounded-lg"><FiMapPin size={18} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-bold text-slate-700">
                    {user.city || user.state ? `${user.city || ''}, ${user.state || ''}` : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
