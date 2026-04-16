'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/common/Loader';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  type: 'success' | 'error';
  message: string;
}

function Toast({ type, message }: ToastProps) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-lg text-sm font-medium transition-all animate-fade-in ${
        isSuccess
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {isSuccess ? (
        <FiCheckCircle size={18} className="text-green-600" />
      ) : (
        <FiAlertCircle size={18} className="text-red-500" />
      )}
      {message}
    </div>
  );
}

// ─── Field components ─────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  icon: React.ElementType;
  id: string;
  children: React.ReactNode;
}

function Field({ label, icon: Icon, id, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700"
      >
        <Icon size={13} className="text-gray-400" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 placeholder:text-gray-400';

const readonlyClass =
  'w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed';

// ─── Page ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, updateUser } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Populate form when user loads
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        city: user.city ?? '',
        state: user.state ?? '',
        pincode: user.pincode ?? '',
      });
    }
  }, [user]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim()) {
      setToast({ type: 'error', message: 'Name is required.' });
      return;
    }
    if (!form.phone.trim()) {
      setToast({ type: 'error', message: 'Phone number is required.' });
      return;
    }

    try {
      setSaving(true);
      await updateUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      });
      setToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update profile. Please try again.';
      setToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white"
          >
            <FiArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white">
            Profile Settings
          </h1>
          <p className="mt-1 text-blue-300">
            Keep your account information up to date.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Avatar section */}
          <div className="flex items-center gap-5 border-b border-gray-100 bg-gray-50/60 px-7 py-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-2xl font-bold text-white select-none">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-orange-700">
                {user.role}
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="px-7 py-8 space-y-6">
            {/* Personal info */}
            <div>
              <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-gray-400">
                Personal Information
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full Name" icon={FiUser} id="name">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={inputClass}
                    required
                  />
                </Field>

                <Field label="Email Address" icon={FiMail} id="email">
                  <div className={readonlyClass}>{user.email}</div>
                  <p className="mt-1 text-xs text-gray-400">
                    Email cannot be changed.
                  </p>
                </Field>

                <Field label="Phone Number" icon={FiPhone} id="phone">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={inputClass}
                    required
                  />
                </Field>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Address info */}
            <div>
              <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-gray-400">
                Address Details
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Address" icon={FiMapPin} id="address">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="House / flat / street"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="City" icon={FiMapPin} id="city">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className={inputClass}
                  />
                </Field>

                <Field label="State" icon={FiMapPin} id="state">
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className={inputClass}
                  />
                </Field>

                <Field label="Pincode" icon={FiMapPin} id="pincode">
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer / Save */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-7 py-5">
            <p className="text-xs text-gray-400">
              Last updated:{' '}
              {new Date(user.updatedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d5a8e] disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast notification */}
      {toast && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}
