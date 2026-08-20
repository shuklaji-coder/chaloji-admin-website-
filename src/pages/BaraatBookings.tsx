import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BaraatBooking, BaraatAssignment } from '../types/baraat';

export default function BaraatBookings() {
  const [bookings, setBookings] = useState<BaraatBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Quote Modal State
  const [quoteModalBooking, setQuoteModalBooking] = useState<BaraatBooking | null>(null);
  const [quotedAmount, setQuotedAmount] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);

  // Assignment Modal State
  const [assignModalBooking, setAssignModalBooking] = useState<BaraatBooking | null>(null);
  const [assignments, setAssignments] = useState<BaraatAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('Auto');
  const [submittingAssignment, setSubmittingAssignment] = useState<boolean>(false);

  // Fetch / Listen to Baraat Bookings
  useEffect(() => {
    setLoading(true);
    let q;
    try {
      q = query(collection(db, 'baraatBookings'), orderBy('createdAt', 'desc'));
    } catch (e) {
      q = collection(db, 'baraatBookings');
    }

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data: BaraatBooking[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as BaraatBooking));
        setBookings(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching baraat bookings:', err);
        // Fallback fetch if onSnapshot listener fails
        getDocs(collection(db, 'baraatBookings')).then((snap) => {
          const fallbackData: BaraatBooking[] = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as BaraatBooking));
          setBookings(fallbackData);
          setLoading(false);
        }).catch(() => setLoading(false));
      }
    );

    return () => unsubscribe();
  }, []);

  // Open Quote Modal
  const openQuoteModal = (booking: BaraatBooking) => {
    setQuoteModalBooking(booking);
    setQuotedAmount(booking.quotedAmount ? booking.quotedAmount.toString() : '');
    setAdminNotes(booking.adminNotes || '');
  };

  // Submit Official Pricing Quote
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalBooking) return;
    if (!quotedAmount || isNaN(Number(quotedAmount)) || Number(quotedAmount) <= 0) {
      alert('Please enter a valid quoted amount in ₹.');
      return;
    }

    setSubmittingQuote(true);
    try {
      const bookingRef = doc(db, 'baraatBookings', quoteModalBooking.id);
      await updateDoc(bookingRef, {
        quotedAmount: Number(quotedAmount),
        adminNotes: adminNotes.trim(),
        status: 'QUOTED',
        updatedAt: serverTimestamp(),
      });

      setQuoteModalBooking(null);
    } catch (err) {
      console.error('Error saving quote:', err);
      alert('Failed to send quote.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Status Action Handler
  const updateBookingStatus = async (bookingId: string, newStatus: BaraatBooking['status']) => {
    try {
      await updateDoc(doc(db, 'baraatBookings', bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Failed to update booking status.');
    }
  };

  // Open Sub-collection Assignment Manager Modal
  const openAssignModal = async (booking: BaraatBooking) => {
    setAssignModalBooking(booking);
    setDriverName('');
    setDriverPhone('');
    setVehicleType(booking.vehiclePreference || 'Auto');
    fetchAssignments(booking.id);
  };

  // Fetch driver assignments from subcollection `baraatBookings/{id}/assignments`
  const fetchAssignments = async (bookingId: string) => {
    setLoadingAssignments(true);
    try {
      const assignRef = collection(db, 'baraatBookings', bookingId, 'assignments');
      const snap = await getDocs(assignRef);
      const data: BaraatAssignment[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as BaraatAssignment));
      setAssignments(data);
    } catch (e) {
      console.error('Error fetching assignments:', e);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Add Assignment to subcollection
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalBooking) return;
    if (!driverName.trim() || !driverPhone.trim()) {
      alert('Please fill in driver name and phone number.');
      return;
    }

    setSubmittingAssignment(true);
    try {
      const assignRef = collection(db, 'baraatBookings', assignModalBooking.id, 'assignments');
      await addDoc(assignRef, {
        bookingId: assignModalBooking.id,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        vehicleType: vehicleType.trim(),
        assignedAt: serverTimestamp(),
      });

      // Update assigned vehicles count on parent doc
      const newCount = assignments.length + 1;
      await updateDoc(doc(db, 'baraatBookings', assignModalBooking.id), {
        assignedVehiclesCount: newCount,
        updatedAt: serverTimestamp(),
      });

      setDriverName('');
      setDriverPhone('');
      fetchAssignments(assignModalBooking.id);
    } catch (err) {
      console.error('Error adding driver assignment:', err);
      alert('Failed to assign driver.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Delete Assignment from subcollection
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!assignModalBooking) return;
    if (!confirm('Remove this driver assignment?')) return;

    try {
      await deleteDoc(doc(db, 'baraatBookings', assignModalBooking.id, 'assignments', assignmentId));
      const updatedList = assignments.filter((a) => a.id !== assignmentId);
      setAssignments(updatedList);

      await updateDoc(doc(db, 'baraatBookings', assignModalBooking.id), {
        assignedVehiclesCount: updatedList.length,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error deleting assignment:', e);
      alert('Failed to remove assignment.');
    }
  };

  // Filtering
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'NEW' && b.status === 'NEW') ||
      (filter === 'QUOTED' && b.status === 'QUOTED') ||
      (filter === 'CONFIRMED' && b.status === 'CONFIRMED') ||
      (filter === 'COMPLETED' && b.status === 'COMPLETED') ||
      b.status === filter;

    const matchesSearch =
      b.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passengerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.eventType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.destination?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeClass = (status: BaraatBooking['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'QUOTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CUSTOMER_ACCEPTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PAYMENT_PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED':
        return 'bg-gray-800 text-white border-gray-900';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>🥁</span>
            <span>ChaloJi Baraat & Multi-Vehicle Event Bookings</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Manage bulk vehicle requests for weddings, baraat processions & special functions.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search passenger, phone, event, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'NEW', label: 'New Requests' },
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700 mb-1">No event bookings found</p>
          <p className="text-xs text-gray-400">
            {bookings.length === 0
              ? 'No Baraat or event requests have been submitted yet.'
              : 'No requests match your current search filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col justify-between hover:border-emerald-200 transition-all group"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider rounded-md mb-1 border border-emerald-100">
                      {b.eventType || 'Event Booking'}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">
                      {b.passengerName || 'Anonymous Customer'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">📞 {b.passengerPhone}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border shadow-sm ${getStatusBadgeClass(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Event Details Box */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 mb-4 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400 font-medium block">Event Date & Time</span>
                      <span className="font-bold text-gray-800">
                        🗓️ {b.eventDate} {b.pickupTime ? `@ ${b.pickupTime}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Vehicles Needed</span>
                      <span className="font-extrabold text-emerald-700">
                        🚗 {b.vehiclesRequired}x {b.vehiclePreference || 'Vehicles'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-gray-400 font-medium">Pickup:</span>
                      <span className="font-semibold text-gray-800">{b.pickupLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="text-gray-400 font-medium">Destination:</span>
                      <span className="font-semibold text-gray-800">{b.destination}</span>
                    </div>
                  </div>

                  {b.specialRequirements && (
                    <div className="pt-2 border-t border-gray-200/60">
                      <span className="text-gray-400 font-medium block">Special Notes:</span>
                      <p className="text-gray-700 italic">{b.specialRequirements}</p>
                    </div>
                  )}
                </div>

                {/* Quoted & Assigned Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs">
                    <span className="text-amber-800/80 font-bold block text-[10px] uppercase">
                      Quoted Amount
                    </span>
                    <span className="text-amber-900 font-black text-base">
                      {b.quotedAmount ? `₹${b.quotedAmount.toLocaleString()}` : 'Not Quoted'}
                    </span>
                  </div>
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs">
                    <span className="text-emerald-800/80 font-bold block text-[10px] uppercase">
                      Fleet Assigned
                    </span>
                    <span className="text-emerald-900 font-black text-base">
                      {b.assignedVehiclesCount || 0} / {b.vehiclesRequired} Vehicles
                    </span>
                  </div>
                </div>

                {b.adminNotes && (
                  <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="text-gray-700">Admin Note:</strong> {b.adminNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openQuoteModal(b)}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    💬 {b.quotedAmount ? 'Update Quote' : 'Send Quote'}
                  </button>
                  <button
                    onClick={() => openAssignModal(b)}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    🚕 Fleet Drivers ({b.assignedVehiclesCount || 0})
                  </button>
                </div>

                {/* Status Quick Actions */}
                <div className="flex items-center gap-1.5">
                  {b.status === 'NEW' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'CONTACTED')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold"
                    >
                      Contacted
                    </button>
                  )}
                  {b.status !== 'CONFIRMED' && b.status !== 'COMPLETED' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'CONFIRMED')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                    >
                      Confirm
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'COMPLETED')}
                      className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Quote Modal */}
      {quoteModalBooking && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setQuoteModalBooking(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform animate-in slide-in-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Official Pricing Quote</h2>
              <button
                onClick={() => setQuoteModalBooking(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Quoted Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 15000"
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
                  placeholder="Include details like fuel allowance, driver stay, hours included..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setQuoteModalBooking(null)}
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

      {/* Sub-collection Fleet Drivers Assignment Manager Modal */}
      {assignModalBooking && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setAssignModalBooking(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col transform animate-in slide-in-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Assign Fleet Drivers & Vehicles
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Booking for {assignModalBooking.passengerName} ({assignModalBooking.vehiclesRequired}x{' '}
                  {assignModalBooking.vehiclePreference})
                </p>
              </div>
              <button
                onClick={() => setAssignModalBooking(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add Assignment Form */}
              <form onSubmit={handleAddAssignment} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  + Add Driver to Booking
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                      Driver Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Auto">Auto</option>
                      <option value="Car">Car / Sedan</option>
                      <option value="SUV">SUV / Ertiga</option>
                      <option value="Tempo Traveller">Tempo Traveller</option>
                      <option value="Bus">Bus</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submittingAssignment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    {submittingAssignment ? 'Assigning...' : 'Assign Driver'}
                  </button>
                </div>
              </form>

              {/* Assigned List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Current Assigned Fleet ({assignments.length})
                </h3>

                {loadingAssignments ? (
                  <div className="text-center py-6 text-xs text-gray-400">Loading assignments...</div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                    No drivers assigned yet. Use the form above to assign fleet drivers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between hover:border-gray-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            🚗
                          </span>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{a.driverName}</p>
                            <p className="text-[11px] text-gray-500">
                              📞 {a.driverPhone} • <span className="font-semibold">{a.vehicleType}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => a.id && handleDeleteAssignment(a.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setAssignModalBooking(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
