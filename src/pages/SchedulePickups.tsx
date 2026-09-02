import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ScheduleStatus = 'pending_admin' | 'confirmed' | 'rejected' | 'completed';

interface ScheduleRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  vehicleType: 'bike' | 'auto' | 'car' | 'jeep';
  passengers: number;
  pickup: { address: string };
  drop: { address: string };
  scheduledDateLabel: string;
  scheduledTimeLabel: string;
  scheduledTimestamp?: number;
  note?: string;
  status: ScheduleStatus;
  adminNote?: string;
  createdAt?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const VEHICLE_ICONS: Record<string, string> = {
  bike: '🛵',
  auto: '🛺',
  car: '🚗',
  jeep: '🚙',
};

const STATUS_META: Record<ScheduleStatus, { label: string; cls: string }> = {
  pending_admin: { label: 'Pending', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed:     { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected:      { label: 'Rejected', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  completed:     { label: 'Completed', cls: 'bg-gray-800 text-white border-gray-900' },
};

const FILTER_TABS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'pending_admin', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'completed', label: 'Completed' },
];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function SchedulePickups() {
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<ScheduleRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Real‑time listener ──────────────────────
  useEffect(() => {
    let q;
    try {
      q = query(collection(db, 'scheduleRequests'), orderBy('createdAt', 'desc'));
    } catch {
      q = collection(db, 'scheduleRequests');
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: ScheduleRequest[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleRequest));
        setRequests(data);
        setLoading(false);
        // Keep selected in sync
        setSelected((prev) => prev ? (data.find((r) => r.id === prev.id) ?? null) : null);
      },
      (err) => { console.error('scheduleRequests error:', err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  // ── Admin action ────────────────────────────
  const handleAction = async (req: ScheduleRequest, newStatus: ScheduleStatus) => {
    setSaving(true);
    try {
      // 1) Update request doc
      await updateDoc(doc(db, 'scheduleRequests', req.id), {
        status: newStatus,
        adminNote: adminNote.trim() || null,
        updatedAt: serverTimestamp(),
      });

      // 2) Create notification for passenger
      if (newStatus === 'confirmed' || newStatus === 'rejected') {
        const msgMap: Record<string, string> = {
          confirmed: `✅ Your scheduled pickup on ${req.scheduledDateLabel} at ${req.scheduledTimeLabel} has been confirmed!`,
          rejected:  `❌ Your scheduled pickup request on ${req.scheduledDateLabel} could not be confirmed. Please try again or contact support.`,
        };
        await addDoc(collection(db, 'notifications'), {
          userId: req.passengerId,
          title: newStatus === 'confirmed' ? 'Pickup Confirmed 🎉' : 'Pickup Rejected',
          message: msgMap[newStatus],
          type: 'schedule_pickup',
          requestId: req.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      setAdminNote('');
    } catch (e) {
      console.error(e);
      alert('Failed to update request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived data ────────────────────────────
  const filtered = requests.filter((r) => filter === 'ALL' || r.status === filter);
  const total     = requests.length;
  const pending   = requests.filter((r) => r.status === 'pending_admin').length;
  const confirmed = requests.filter((r) => r.status === 'confirmed').length;
  const completed = requests.filter((r) => r.status === 'completed').length;

  const stats = [
    { label: 'Total',     value: total,     icon: '📋', color: 'bg-slate-50 border-slate-200',   text: 'text-slate-900' },
    { label: 'Pending',   value: pending,   icon: '⏳', color: 'bg-amber-50 border-amber-200',   text: 'text-amber-900' },
    { label: 'Confirmed', value: confirmed, icon: '✅', color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900' },
    { label: 'Completed', value: completed, icon: '🏁', color: 'bg-gray-50 border-gray-200',      text: 'text-gray-900' },
  ];

  // ─────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-full">

      {/* ── Header ─────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <span>🗓️</span> Schedule Pickups
        </h1>
        <p className="text-gray-500 mt-1 text-xs sm:text-sm">
          Review, confirm, or reject passenger scheduled pickup requests in real‑time.
        </p>
      </div>

      {/* ── Stats Banner ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-3 sm:p-4`}>
            <div className="text-xl sm:text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl sm:text-2xl font-black ${s.text}`}>{s.value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-5 bg-white border border-gray-100 rounded-2xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filter === tab.id
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {tab.id !== 'ALL' && (
              <span className="ml-1.5 opacity-60 font-bold text-[10px]">
                {tab.id === 'pending_admin' ? pending
                 : tab.id === 'confirmed' ? confirmed
                 : tab.id === 'completed' ? completed
                 : requests.filter((r) => r.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Body: List + Detail Panel ──────────── */}
      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">🗓️</p>
              <p className="text-lg font-semibold text-gray-700 mb-1">No requests found</p>
              <p className="text-xs text-gray-400">
                {requests.length === 0 ? 'No scheduled pickup requests yet.' : 'No requests match the current filter.'}
              </p>
            </div>
          ) : (
            filtered.map((req) => {
              const sm = STATUS_META[req.status] ?? STATUS_META.pending_admin;
              const isSelected = selected?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => { setSelected(req); setAdminNote(req.adminNote || ''); }}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md group ${
                    isSelected ? 'border-emerald-400 shadow-md ring-1 ring-emerald-200' : 'border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
                        {VEHICLE_ICONS[req.vehicleType] ?? '🚗'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{req.passengerName}</p>
                        <p className="text-[11px] text-gray-400 font-medium">📞 {req.passengerPhone}</p>
                        <p className="text-xs text-gray-600 mt-1 font-medium truncate">
                          🗓️ {req.scheduledDateLabel} &nbsp;⏰ {req.scheduledTimeLabel}
                        </p>
                      </div>
                    </div>
                    {/* Right */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${sm.cls}`}>
                        {sm.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium capitalize">
                        {VEHICLE_ICONS[req.vehicleType]} {req.vehicleType} • {req.passengers} pax
                      </span>
                    </div>
                  </div>

                  {/* Route mini */}
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 block">Pickup</span>
                      <span className="font-semibold text-gray-700 truncate block">{req.pickup?.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Drop</span>
                      <span className="font-semibold text-gray-700 truncate block">{req.drop?.address}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Detail Panel ───────────────────────── */}
        {selected ? (
          <div className="xl:w-[380px] flex-shrink-0">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 sticky top-0 overflow-y-auto max-h-[85vh] custom-scrollbar">

              {/* Panel header */}
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.passengerName}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">📞 {selected.passengerPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${(STATUS_META[selected.status] ?? STATUS_META.pending_admin).cls}`}>
                    {(STATUS_META[selected.status] ?? STATUS_META.pending_admin).label}
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full text-xs transition-colors"
                  >✕</button>
                </div>
              </div>

              {/* Info grid */}
              <div className="space-y-4 mb-5">

                {/* Schedule */}
                <InfoSection label="Scheduled For">
                  <p className="text-sm font-bold text-gray-800">🗓️ {selected.scheduledDateLabel}</p>
                  <p className="text-sm font-bold text-gray-800">⏰ {selected.scheduledTimeLabel}</p>
                </InfoSection>

                {/* Vehicle + Pax */}
                <InfoSection label="Vehicle & Passengers">
                  <p className="text-sm font-bold text-gray-800 capitalize">
                    {VEHICLE_ICONS[selected.vehicleType]} {selected.vehicleType} &mdash; {selected.passengers} passenger{selected.passengers !== 1 ? 's' : ''}
                  </p>
                </InfoSection>

                {/* Route */}
                <InfoSection label="Route">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-gray-400 font-medium w-12 flex-shrink-0">Pickup</span>
                      <span className="font-semibold text-gray-700">{selected.pickup?.address}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="text-gray-400 font-medium w-12 flex-shrink-0">Drop</span>
                      <span className="font-semibold text-gray-700">{selected.drop?.address}</span>
                    </div>
                  </div>
                </InfoSection>

                {/* Passenger note */}
                {selected.note && (
                  <InfoSection label="Passenger Note">
                    <p className="text-xs text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">{selected.note}</p>
                  </InfoSection>
                )}

                {/* Previous admin note */}
                {selected.adminNote && (
                  <InfoSection label="Admin Note (saved)">
                    <p className="text-xs text-gray-600 italic bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">{selected.adminNote}</p>
                  </InfoSection>
                )}

                {/* Submitted at */}
                <InfoSection label="Submitted">
                  <p className="text-xs text-gray-500 font-medium">{fmtDate(selected.createdAt)}</p>
                </InfoSection>
              </div>

              {/* Admin Note Input */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Admin Note (optional)
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note for the passenger or internal records..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400 transition-all resize-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                {/* Confirm */}
                {(selected.status === 'pending_admin') && (
                  <button
                    disabled={saving}
                    onClick={() => handleAction(selected, 'confirmed')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-[0_4px_14px_rgba(5,150,105,0.35)] transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <span className="animate-spin">⏳</span> : '✅'} Confirm Pickup
                  </button>
                )}

                {/* Reject */}
                {(selected.status === 'pending_admin') && (
                  <button
                    disabled={saving}
                    onClick={() => handleAction(selected, 'rejected')}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    ❌ Reject Request
                  </button>
                )}

                {/* Mark Completed */}
                {selected.status === 'confirmed' && (
                  <button
                    disabled={saving}
                    onClick={() => handleAction(selected, 'completed')}
                    className="w-full py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    🏁 Mark as Completed
                  </button>
                )}

                {/* Already terminal */}
                {(selected.status === 'rejected' || selected.status === 'completed') && (
                  <div className="text-center text-xs text-gray-400 py-2 font-medium">
                    This request is <span className="font-bold capitalize">{selected.status}</span> — no further actions required.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden xl:flex xl:w-[380px] flex-shrink-0 items-center justify-center bg-white/60 border border-dashed border-gray-200 rounded-3xl text-gray-400 flex-col gap-3 min-h-[300px]">
            <span className="text-5xl">🗓️</span>
            <p className="text-sm font-semibold">Select a request to view details</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub‑component: info section
// ─────────────────────────────────────────────
function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  );
}
