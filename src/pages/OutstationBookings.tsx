import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

type OutstationStatus = 'PENDING' | 'CONTACTED' | 'QUOTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

interface OutstationBooking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  vehicleType: 'car' | 'suv' | 'tempo';
  pickupLocation: string;
  dropLocation: string;
  startDate: string;
  returnDate?: string | null;
  passengers: number;
  luggage?: string;
  specialRequests?: string;
  status: OutstationStatus;
  quotedAmount?: number | null;
  adminNotes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const VEHICLE_LABELS: Record<string, string> = {
  car: '🚗 Sedan',
  suv: '🚙 SUV',
  tempo: '🚌 Tempo Traveller',
};

export default function OutstationBookings() {
  const [bookings, setBookings] = useState<OutstationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Quote modal
  const [quoteModal, setQuoteModal] = useState<OutstationBooking | null>(null);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    setLoading(true);
    let q;
    try {
      q = query(collection(db, 'outstationBookings'), orderBy('createdAt', 'desc'));
    } catch {
      q = collection(db, 'outstationBookings');
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: OutstationBooking[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as OutstationBooking));
        setBookings(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching outstation bookings:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateStatus = async (id: string, status: OutstationStatus) => {
    try {
      await updateDoc(doc(db, 'outstationBookings', id), { status, updatedAt: serverTimestamp() });
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  const openQuoteModal = (b: OutstationBooking) => {
    setQuoteModal(b);
    setQuotedAmount(b.quotedAmount ? b.quotedAmount.toString() : '');
    setAdminNotes(b.adminNotes || '');
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModal) return;
    if (!quotedAmount || isNaN(Number(quotedAmount)) || Number(quotedAmount) <= 0) {
      alert('Please enter a valid quoted amount in ₹.');
      return;
    }
    setSubmittingQuote(true);
    try {
      await updateDoc(doc(db, 'outstationBookings', quoteModal.id), {
        quotedAmount: Number(quotedAmount),
        adminNotes: adminNotes.trim(),
        status: 'QUOTED',
        updatedAt: serverTimestamp(),
      });
      setQuoteModal(null);
    } catch {
      alert('Failed to save quote.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const getStatusClass = (status: OutstationStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'QUOTED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED': return 'bg-gray-800 text-white border-gray-900';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === 'ALL' || b.status === filter;
    const matchesSearch =
      !searchTerm ||
      b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.dropLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>✈️</span>
            <span>Outstation Ride Requests</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Manage intercity ride bookings — contact customers and send quotes.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Requests', value: total, color: 'bg-slate-50 border-slate-200', text: 'text-slate-900', icon: '📋' },
          { label: 'Pending', value: pending, color: 'bg-blue-50 border-blue-200', text: 'text-blue-900', icon: '🕐' },
          { label: 'Confirmed', value: confirmed, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900', icon: '✅' },
          { label: 'Completed', value: completed, color: 'bg-gray-50 border-gray-200', text: 'text-gray-900', icon: '🏁' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} border rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.text}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, pickup, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'QUOTED', label: 'Quoted' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          <p className="text-4xl mb-3">✈️</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">No outstation requests found</p>
          <p className="text-xs text-gray-400">
            {bookings.length === 0
              ? 'No outstation requests have been submitted yet.'
              : 'No requests match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col justify-between hover:border-sky-200 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-sky-50 text-sky-800 text-[10px] font-extrabold uppercase tracking-wider rounded-md mb-1 border border-sky-100">
                      {b.tripType === 'ROUND_TRIP' ? '🔄 Round Trip' : '➡️ One Way'} • {VEHICLE_LABELS[b.vehicleType] || b.vehicleType}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-sky-700 transition-colors">
                      {b.userName || 'Anonymous'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">📞 {b.userPhone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border shadow-sm ${getStatusClass(b.status)}`}>
                    {b.status}
                  </span>
                </div>

                {/* Route Details */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-gray-400 font-medium">From:</span>
                    <span className="font-semibold text-gray-800">{b.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-gray-400 font-medium">To:</span>
                    <span className="font-semibold text-gray-800">{b.dropLocation}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 font-medium block">Travel Date</span>
                      <span className="font-bold text-gray-800">🗓️ {b.startDate}</span>
                    </div>
                    {b.returnDate && (
                      <div>
                        <span className="text-gray-400 font-medium block">Return Date</span>
                        <span className="font-bold text-gray-800">🗓️ {b.returnDate}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 font-medium block">Passengers</span>
                      <span className="font-bold text-gray-800">👥 {b.passengers}</span>
                    </div>
                    {b.luggage && (
                      <div>
                        <span className="text-gray-400 font-medium block">Luggage</span>
                        <span className="font-bold text-gray-800">🧳 {b.luggage}</span>
                      </div>
                    )}
                  </div>
                  {b.specialRequests && (
                    <div className="pt-2 border-t border-gray-200/60">
                      <span className="text-gray-400 font-medium block">Special Requests</span>
                      <p className="text-gray-700 italic">{b.specialRequests}</p>
                    </div>
                  )}
                </div>

                {/* Quote info */}
                {b.quotedAmount && (
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs mb-4">
                    <span className="text-amber-800/80 font-bold block text-[10px] uppercase">Quoted Amount</span>
                    <span className="text-amber-900 font-black text-base">₹{b.quotedAmount.toLocaleString()}</span>
                    {b.adminNotes && <p className="text-gray-500 mt-1 italic">{b.adminNotes}</p>}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openQuoteModal(b)}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    💬 {b.quotedAmount ? 'Update Quote' : 'Send Quote'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {b.status === 'PENDING' && (
                    <button
                      onClick={() => updateStatus(b.id, 'CONTACTED')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold"
                    >
                      Contacted
                    </button>
                  )}
                  {b.status !== 'CONFIRMED' && b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus(b.id, 'CONFIRMED')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                    >
                      Confirm
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateStatus(b.id, 'COMPLETED')}
                      className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold"
                    >
                      Complete
                    </button>
                  )}
                  {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                    <button
                      onClick={() => updateStatus(b.id, 'CANCELLED')}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {quoteModal && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setQuoteModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform animate-in slide-in-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send Outstation Quote</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  For {quoteModal.userName} — {quoteModal.pickupLocation} → {quoteModal.dropLocation}
                </p>
              </div>
              <button
                onClick={() => setQuoteModal(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Quoted Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 3500"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-amber-900 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Notes / Inclusions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Includes toll, fuel, driver stay for 2 days..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setQuoteModal(null)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(217,119,6,0.4)] transition-all"
                >
                  {submittingQuote ? 'Sending...' : 'Send Quote (Set QUOTED)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
