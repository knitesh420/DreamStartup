'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { startupService } from '@/services/startup.service';
import StartupKitCard from '@/components/common/StartupKitCard';
import { StartupKit } from '@/types';

const BUSINESS_TYPES = ['Hardware', 'Sanitary', 'Electrical', 'Other'] as const;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  businessType: string;
  selectedKit: string;
  budget: string;
  message: string;
}

const EMPTY_FORM: FormData = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  businessType: '',
  selectedKit: '',
  budget: '',
  message: '',
};

export default function StartupPage() {
  const [kits, setKits] = useState<StartupKit[]>([]);
  const [kitsLoading, setKitsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    (async () => {
      try {
        const res = await startupService.getKits();
        const data = res.data;
        const kitList: StartupKit[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setKits(kitList);
      } catch {
        toast.error('Failed to load startup kits.');
      } finally {
        setKitsLoading(false);
      }
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedKit) {
      toast.error('Please select a startup kit.');
      return;
    }
    setSubmitting(true);
    try {
      await startupService.submitApplication(formData as unknown as Record<string, string>);
      toast.success('Application submitted! We will contact you soon.');
      setFormData(EMPTY_FORM);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-[#1e3a5f] dark:text-gray-100 overflow-hidden relative selection:bg-orange-500/30">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -mr-40 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[20%] w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero */}
      <section className={`relative pt-32 pb-24 px-4 transition-all duration-1000 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80" alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold tracking-wide uppercase mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Business Starter Kits
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg leading-tight">
            Launch Your Dream
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
            Everything you need. Curation, inventory, branding, and guidance. Pick your tailored kit below and let’s start building.
          </p>
          <a
            href="#apply-form"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-orange-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 hover:bg-orange-600 hover:shadow-lg shadow-sm overflow-hidden"
          >
            <span className="relative">Apply Now</span>
          </a>
        </div>
      </section>

      {/* Startup Kits */}
      <section className="relative z-10 py-24 px-4 overflow-hidden border-t border-slate-200 dark:border-gray-700">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-slate-50/90 dark:bg-gray-900/90 backdrop-blur-sm z-10" />
          <img src="https://www.the-future-of-commerce.com/wp-content/uploads/2020/01/thumbnail-d771a7f4e38fcf7614f297ea6c90f497-1200x370.jpeg" alt="Kits Background" className="w-full h-full object-cover opacity-50" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1e3a5f] dark:text-gray-100">Choose Your Starter Kit</h2>
          </div>

          {kitsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-3xl shadow-sm animate-pulse h-80" />
              ))}
            </div>
          ) : kits.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-gray-300 py-12 text-lg">
              No startup kits available right now. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {kits.map((kit, i) => (
                <div key={kit._id} className="group relative transition-all duration-500 hover:-translate-y-3 z-10" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="relative h-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(30,58,95,0.15)] rounded-3xl p-8 flex flex-col transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-[#1e3a5f] dark:text-gray-100 rounded-xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800 group-hover:bg-[#1e3a5f] group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#1e3a5f] dark:text-gray-100 mb-3">{kit.title}</h3>
                    <div className="text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full mb-4 inline-flex mr-auto border border-orange-200 dark:border-orange-800">
                      Starting from ₹{kit.startingPrice.toLocaleString('en-IN')}
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {kit.description}
                    </p>
                    <a href="#apply-form" className="w-full py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-center font-bold text-sm text-[#1e3a5f] dark:text-gray-100 bg-slate-50 dark:bg-gray-700 hover:bg-[#1e3a5f] hover:text-white transition-colors">
                      Select Kit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Application Form */}
      <section id="apply-form" className="relative z-10 py-32 px-4 scroll-mt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-sm z-10" />
          {/* using another startup themed background */}
          <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1920&q=80" alt="Apply Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">Apply for a Kit</h2>
            <p className="text-white/70 mt-4 text-lg">We review requests daily and get back within 24h.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required pattern="[6-9][0-9]{9}"
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">State</label>
                <select name="state" value={formData.state} onChange={handleChange} required
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner">
                  <option value="">Select</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Business Type</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} required
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner">
                  <option value="">Select</option>
                  {BUSINESS_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Select Kit</label>
                <select name="selectedKit" value={formData.selectedKit} onChange={handleChange} required
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner">
                  <option value="">Select a Kit</option>
                  {kits.map((k) => <option key={k._id} value={k._id}>{k.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Notes / Ideas</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows={3}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-[#1e3a5f] dark:text-gray-100 font-medium focus:outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner resize-none" />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="relative z-10 w-full mt-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-md">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
