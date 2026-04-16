'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminService } from '@/services/admin.service';

// ─── Types ───────────────────────────────────────────────────────────────────

type Profession = 'carpenter' | 'electrician' | 'plumber';

interface Commission {
  _id: string;
  profession: Profession;
  defaultCommissionRate: number;
  isActive: boolean;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastCounter = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto transition-all duration-300 ${
            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-70 hover:opacity-100 text-white font-bold text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Profession display helpers ───────────────────────────────────────────────

const PROFESSION_LABELS: Record<Profession, string> = {
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  plumber: 'Plumber',
};

const PROFESSION_ICONS: Record<Profession, string> = {
  carpenter: '🪚',
  electrician: '⚡',
  plumber: '🔧',
};

const ALL_PROFESSIONS: Profession[] = ['carpenter', 'electrician', 'plumber'];

// ─── Commission Card ─────────────────────────────────────────────────────────

interface CommissionCardProps {
  commission: Commission;
  onSave: (id: string, rate: number) => Promise<void>;
}

function CommissionCard({ commission, onSave }: CommissionCardProps) {
  const [editRate, setEditRate] = useState<string>(String(commission.defaultCommissionRate));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = (val: string) => {
    setEditRate(val);
    setDirty(Number(val) !== commission.defaultCommissionRate);
  };

  const handleSave = async () => {
    const rate = Number(editRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    setSaving(true);
    await onSave(commission._id, rate);
    setSaving(false);
    setDirty(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditRate(String(commission.defaultCommissionRate));
      setDirty(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={commission.profession}>
            {PROFESSION_ICONS[commission.profession]}
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#1e3a5f] capitalize">
              {PROFESSION_LABELS[commission.profession]}
            </h3>
            <p className="text-xs text-gray-400">Commission Setting</p>
          </div>
        </div>

        {/* Active badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            commission.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              commission.isActive ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          {commission.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Rate display */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
        <span className="text-3xl font-extrabold text-[#1e3a5f]">
          {commission.defaultCommissionRate}
          <span className="text-lg font-semibold text-gray-400">%</span>
        </span>
        <span className="text-xs text-gray-400 ml-1">current rate</span>
      </div>

      {/* Inline edit */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Edit Rate (%)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={editRate}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Enter rate"
          />
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              dirty && !saving
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Saving
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400">Press Enter to save, Escape to cancel.</p>
      </div>
    </div>
  );
}

// ─── Add Commission Form ──────────────────────────────────────────────────────

interface AddCommissionFormProps {
  existingProfessions: Profession[];
  onCreate: (profession: Profession, rate: number) => Promise<void>;
}

function AddCommissionForm({ existingProfessions, onCreate }: AddCommissionFormProps) {
  const available = ALL_PROFESSIONS.filter((p) => !existingProfessions.includes(p));
  const [profession, setProfession] = useState<Profession>(available[0] ?? 'carpenter');
  const [rate, setRate] = useState<string>('10');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (available.length > 0) setProfession(available[0]);
  }, [available.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (available.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numRate = Number(rate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) return;
    setCreating(true);
    await onCreate(profession, numRate);
    setCreating(false);
    setRate('10');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-dashed border-orange-300 p-6 mt-2">
      <h3 className="text-base font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
        <span className="text-orange-500 text-xl">+</span>
        Add New Commission Setting
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
        {/* Profession dropdown */}
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Profession
          </label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value as Profession)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {available.map((p) => (
              <option key={p} value={p}>
                {PROFESSION_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        {/* Rate input */}
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Commission Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g. 10"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={creating}
          className="px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              Creating…
            </span>
          ) : (
            'Create Setting'
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCommissions();
      const data: Commission[] = res.data?.commissions ?? res.data?.data ?? res.data ?? [];
      setCommissions(data);
    } catch (err) {
      console.error('Failed to fetch commissions', err);
      addToast('Failed to load commissions. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  // ── Update commission ──────────────────────────────────────────────────────

  const handleUpdate = async (id: string, defaultCommissionRate: number) => {
    try {
      await adminService.updateCommission(id, { defaultCommissionRate });
      setCommissions((prev) =>
        prev.map((c) => (c._id === id ? { ...c, defaultCommissionRate } : c))
      );
      addToast('Commission rate updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update commission', err);
      addToast('Failed to update commission rate. Please try again.', 'error');
    }
  };

  // ── Create commission ──────────────────────────────────────────────────────

  const handleCreate = async (profession: Profession, defaultCommissionRate: number) => {
    try {
      const res = await adminService.createCommission({ profession, defaultCommissionRate });
      const created: Commission = res.data?.commission ?? res.data;
      setCommissions((prev) => [...prev, created]);
      addToast(
        `Commission setting for ${PROFESSION_LABELS[profession]} created successfully.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to create commission', err);
      addToast('Failed to create commission setting. Please try again.', 'error');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const existingProfessions = commissions.map((c) => c.profession);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-6 py-5 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Commission Settings</h1>
        <p className="text-sm text-blue-200 mt-0.5">
          Configure default commission rates per profession
        </p>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <strong className="text-[#1e3a5f]">{commissions.length}</strong> of{' '}
                {ALL_PROFESSIONS.length} professions configured
              </span>
              <span className="text-gray-300">|</span>
              <span>
                <strong className="text-green-600">
                  {commissions.filter((c) => c.isActive).length}
                </strong>{' '}
                active
              </span>
            </div>

            {/* Cards grid */}
            {commissions.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No commission settings found. Add one below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {commissions.map((commission) => (
                  <CommissionCard
                    key={commission._id}
                    commission={commission}
                    onSave={handleUpdate}
                  />
                ))}
              </div>
            )}

            {/* Add new form */}
            <AddCommissionForm
              existingProfessions={existingProfessions}
              onCreate={handleCreate}
            />
          </>
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
