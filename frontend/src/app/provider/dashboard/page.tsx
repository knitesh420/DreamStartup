'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Loader from '@/components/common/Loader';
import StatusBadge from '@/components/common/StatusBadge';
import { ServiceProviderProfile, Job } from '@/types';

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error';

interface ToastMsg {
  id: number;
  message: string;
  type: ToastType;
}

function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium min-w-[260px] transition-all ${
            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-white/70 hover:text-white leading-none text-base">&times;</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  let nextId = 0;

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, remove };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-5 shadow-sm border ${accent ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-orange-500' : 'text-[#1e3a5f]'}`}>{value}</p>
    </div>
  );
}

// ─── Create Profile Form ──────────────────────────────────────────────────────

interface CreateProfileFormProps {
  onCreated: (profile: ServiceProviderProfile) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

function CreateProfileForm({ onCreated, showToast }: CreateProfileFormProps) {
  const [form, setForm] = useState({
    profession: 'carpenter' as 'carpenter' | 'electrician' | 'plumber',
    experienceYears: '',
    serviceAreas: '',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.experienceYears || isNaN(Number(form.experienceYears))) {
      showToast('Please enter valid experience years.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        profession: form.profession,
        experienceYears: Number(form.experienceYears),
        serviceAreas: form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.post('/providers/profile', payload);
      showToast('Provider profile created successfully!');
      onCreated(res.data.data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(msg || 'Failed to create profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Create Provider Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your service provider profile to start receiving jobs.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
            <select name="profession" value={form.profession} onChange={handleChange} className={inputCls} required>
              <option value="carpenter">Carpenter</option>
              <option value="electrician">Electrician</option>
              <option value="plumber">Plumber</option>
            </select>
          </div>

          {/* Experience Years */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
            <input
              type="number"
              name="experienceYears"
              value={form.experienceYears}
              onChange={handleChange}
              min={0}
              placeholder="e.g. 5"
              className={inputCls}
              required
            />
          </div>

          {/* Service Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Areas</label>
            <input
              type="text"
              name="serviceAreas"
              value={form.serviceAreas}
              onChange={handleChange}
              placeholder="e.g. Mumbai, Pune, Thane"
              className={inputCls}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated list of areas you serve.</p>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. Furniture repair, Cabinet making"
              className={inputCls}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated list of your skills.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {submitting ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Availability Toggle ──────────────────────────────────────────────────────

function AvailabilityToggle({
  available,
  onToggle,
  loading,
}: {
  available: boolean;
  onToggle: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="flex items-center gap-2 focus:outline-none disabled:opacity-60"
      aria-label="Toggle availability"
    >
      <span className="text-sm font-medium text-gray-600">Available</span>
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          available ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            available ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
      <span className={`text-xs font-semibold ${available ? 'text-green-600' : 'text-gray-400'}`}>
        {available ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

// ─── Job Row ──────────────────────────────────────────────────────────────────

interface JobRowProps {
  job: Job;
  onStatusUpdate: (jobId: string, newStatus: 'in_progress' | 'completed') => Promise<void>;
  updating: boolean;
}

function JobRow({ job, onStatusUpdate, updating }: JobRowProps) {
  const canUpdate = job.status === 'assigned' || job.status === 'in_progress';
  const nextStatus: 'in_progress' | 'completed' | null =
    job.status === 'assigned' ? 'in_progress' : job.status === 'in_progress' ? 'completed' : null;
  const nextLabel = nextStatus === 'in_progress' ? 'Mark In Progress' : nextStatus === 'completed' ? 'Mark Completed' : null;

  const scheduledDate = job.scheduledDate
    ? new Date(job.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
      <td className="px-4 py-3">
        <p className="font-medium text-[#1e3a5f] text-sm">{job.title}</p>
        {job.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{job.description}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{job.serviceType}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.location || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{scheduledDate}</td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-[#1e3a5f]">
        ₹{job.earningsAmount?.toLocaleString('en-IN') ?? '—'}
      </td>
      <td className="px-4 py-3">
        {canUpdate && nextStatus && nextLabel ? (
          <button
            onClick={() => onStatusUpdate(job._id, nextStatus)}
            disabled={updating}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#16304f] disabled:opacity-50 transition whitespace-nowrap"
          >
            {nextLabel}
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, show: showToast, remove: removeToast } = useToast();

  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'vendor') {
        router.replace('/login');
      }
    }
  }, [user, authLoading, router]);

  // Fetch profile + jobs
  const fetchData = useCallback(async () => {
    setPageLoading(true);
    try {
      const [profileRes, jobsRes] = await Promise.allSettled([
        api.get('/providers/profile/me'),
        api.get('/jobs/my'),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data.data ?? null);
      } else {
        // 404 means no profile yet — not an error
        const err = profileRes.reason as { response?: { status?: number } };
        if (err?.response?.status !== 404) {
          showToast('Failed to load profile.', 'error');
        }
        setProfile(null);
      }

      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value.data.data ?? []);
      } else {
        showToast('Failed to load jobs.', 'error');
      }
    } finally {
      setPageLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user && user.role === 'vendor') {
      fetchData();
    }
  }, [user, fetchData]);

  // Toggle availability
  const handleToggleAvailability = async () => {
    if (!profile) return;
    setAvailabilityLoading(true);
    try {
      const res = await api.put('/providers/profile/me', { available: !profile.available });
      setProfile(res.data.data);
      showToast(`Availability set to ${!profile.available ? 'Available' : 'Unavailable'}.`);
    } catch {
      showToast('Failed to update availability.', 'error');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Update job status
  const handleJobStatusUpdate = async (jobId: string, newStatus: 'in_progress' | 'completed') => {
    setUpdatingJobId(jobId);
    try {
      const res = await api.put(`/jobs/${jobId}/status`, { status: newStatus });
      setJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, ...res.data.data } : j)));
      showToast(`Job marked as ${newStatus.replace('_', ' ')}.`);
    } catch {
      showToast('Failed to update job status.', 'error');
    } finally {
      setUpdatingJobId(null);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────

  if (authLoading || (!user && !authLoading)) {
    return <Loader />;
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // No profile — show create form
  if (!profile) {
    return (
      <>
        <Toast toasts={toasts} remove={removeToast} />
        <CreateProfileForm
          onCreated={(newProfile) => {
            setProfile(newProfile);
          }}
          showToast={showToast}
        />
      </>
    );
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const totalEarnings = jobs
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + (j.earningsAmount ?? 0), 0);

  return (
    <>
      <Toast toasts={toasts} remove={removeToast} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-6 md:py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Provider Dashboard</h1>
              <p className="text-blue-200 text-sm mt-0.5 capitalize">{profile.profession} &bull; {profile.experienceYears} yrs experience</p>
            </div>
            <AvailabilityToggle
              available={profile.available}
              onToggle={handleToggleAvailability}
              loading={availabilityLoading}
            />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Profile Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Profession</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-800 capitalize">{profile.profession}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Experience</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-800">{profile.experienceYears} years</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Approval Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={profile.isApproved ? 'approved' : 'pending'} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Commission Rate</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-800">{profile.commissionRate ?? 0}%</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Service Areas</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.serviceAreas.length > 0 ? (
                    profile.serviceAreas.map((area) => (
                      <span key={area} className="text-xs bg-blue-50 text-[#1e3a5f] border border-blue-100 px-2 py-0.5 rounded-full">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Skills</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Jobs" value={totalJobs} />
            <StatCard label="Completed Jobs" value={completedJobs} />
            <StatCard label="Total Earnings" value={`₹${totalEarnings.toLocaleString('en-IN')}`} accent />
            <StatCard
              label="Availability"
              value={profile.available ? 'Available' : 'Unavailable'}
              accent={profile.available}
            />
          </div>

          {/* Jobs List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1e3a5f]">My Jobs</h2>
              <span className="text-xs text-gray-400 font-medium">{totalJobs} total</span>
            </div>

            {jobs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-400 text-sm">No jobs assigned yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3">Job Title</th>
                      <th className="px-4 py-3">Service Type</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Scheduled Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Earnings</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <JobRow
                        key={job._id}
                        job={job}
                        onStatusUpdate={handleJobStatusUpdate}
                        updating={updatingJobId === job._id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
