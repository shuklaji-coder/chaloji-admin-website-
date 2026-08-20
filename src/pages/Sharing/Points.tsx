import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { SharingRoute, SharingPickupPoint } from '../../types/sharing';

export default function Points() {
  const [routes, setRoutes] = useState<SharingRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [points, setPoints] = useState<SharingPickupPoint[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(true);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPoint, setEditingPoint] = useState<SharingPickupPoint | null>(null);
  const [name, setName] = useState<string>('');
  const [sequence, setSequence] = useState<number>(1);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch available routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      setLoadingRoutes(true);
      try {
        const snap = await getDocs(collection(db, 'sharing_routes'));
        const routeData: SharingRoute[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as SharingRoute));
        setRoutes(routeData);

        if (routeData.length > 0) {
          setSelectedRouteId(routeData[0].id);
        }
      } catch (e) {
        console.error('Error fetching routes:', e);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, []);

  // Fetch pickup points whenever selected route changes
  const fetchPointsForRoute = async (routeId: string) => {
    if (!routeId) {
      setPoints([]);
      return;
    }
    setLoadingPoints(true);
    try {
      const q = query(collection(db, 'sharing_points'), where('routeId', '==', routeId));
      const snap = await getDocs(q);
      const pointsData: SharingPickupPoint[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as SharingPickupPoint));

      // Sort client-side by sequence number (ascending)
      pointsData.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      setPoints(pointsData);
    } catch (e) {
      console.error('Error fetching pickup points:', e);
    } finally {
      setLoadingPoints(false);
    }
  };

  useEffect(() => {
    if (selectedRouteId) {
      fetchPointsForRoute(selectedRouteId);
    }
  }, [selectedRouteId]);

  const openCreateModal = () => {
    setEditingPoint(null);
    setName('');
    // Auto calculate next sequence number
    const maxSeq = points.length > 0 ? Math.max(...points.map((p) => p.sequence || 0)) : 0;
    setSequence(maxSeq + 1);
    setLatitude('');
    setLongitude('');
    setAddress('');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (point: SharingPickupPoint) => {
    setEditingPoint(point);
    setName(point.name || '');
    setSequence(point.sequence || 1);
    setLatitude(point.latitude !== undefined ? point.latitude.toString() : '');
    setLongitude(point.longitude !== undefined ? point.longitude.toString() : '');
    setAddress(point.address || '');
    setActive(point.active !== undefined ? point.active : true);
    setIsModalOpen(true);
  };

  const handleSavePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter point name.');
      return;
    }
    if (!latitude || !longitude || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      alert('Please enter valid numeric latitude and longitude.');
      return;
    }
    if (!selectedRouteId) {
      alert('Please select a route first.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        routeId: selectedRouteId,
        name: name.trim(),
        sequence: Number(sequence),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address.trim(),
        active,
      };

      if (editingPoint) {
        await updateDoc(doc(db, 'sharing_points', editingPoint.id), payload);
      } else {
        await addDoc(collection(db, 'sharing_points'), payload);
      }

      setIsModalOpen(false);
      fetchPointsForRoute(selectedRouteId);
    } catch (err) {
      console.error('Error saving pickup point:', err);
      alert('Failed to save pickup point.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePointActive = async (point: SharingPickupPoint) => {
    try {
      const newStatus = !point.active;
      await updateDoc(doc(db, 'sharing_points', point.id), { active: newStatus });
      setPoints((prev) =>
        prev.map((p) => (p.id === point.id ? { ...p, active: newStatus } : p))
      );
    } catch (e) {
      console.error('Error toggling point status:', e);
      alert('Failed to update active status.');
    }
  };

  const handleDeletePoint = async (id: string, pointName: string) => {
    if (!confirm(`Are you sure you want to delete pickup point "${pointName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'sharing_points', id));
      setPoints((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Error deleting point:', e);
      alert('Failed to delete point.');
    }
  };

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>📍</span>
            <span>ChaloJi Sequential Pickup Points</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Configure GPS pickup stops & sequence order for each shared route.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedRouteId}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(5,150,105,0.4)] transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Add Pickup Point
        </button>
      </div>

      {/* Route Selector Banner */}
      <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
            Select Route:
          </label>
          {loadingRoutes ? (
            <div className="text-xs text-gray-400">Loading routes...</div>
          ) : routes.length === 0 ? (
            <div className="text-xs text-rose-500">No routes found. Please add a route first!</div>
          ) : (
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full sm:w-72 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-emerald-500 transition-all"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.startPointName} → {r.endPointName})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedRouteObj && (
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-semibold">
            <span>Route Terminals:</span>
            <span className="font-bold">{selectedRouteObj.startPointName}</span>
            <span>➔</span>
            <span className="font-bold">{selectedRouteObj.endPointName}</span>
          </div>
        )}
      </div>

      {/* Sequential Points List */}
      {!selectedRouteId ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          Please select a route to view its pickup points.
        </div>
      ) : loadingPoints ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
      ) : points.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700 mb-1">No pickup points added yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Add sequential pickup stops along this route for passenger bookings.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
          >
            + Add First Pickup Point
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Sequential Stops ({points.length})
            </span>
            <span className="text-xs text-gray-400">
              Arranged in chronological pickup order
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {points.map((p) => (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-emerald-50/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Sequence Badge */}
                  <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-bold text-base flex items-center justify-center shadow-md flex-shrink-0">
                    #{p.sequence}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h4>
                      <button
                        onClick={() => togglePointActive(p)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          p.active
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {p.address && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">{p.address}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 font-mono">
                      <span>Lat: {p.latitude}</span>
                      <span>•</span>
                      <span>Lng: {p.longitude}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePoint(p.id, p.name)}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Pickup Point Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 transform animate-in slide-in-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPoint ? 'Edit Pickup Point' : 'Add New Pickup Point'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePoint} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Point Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sabzi Mandi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sequence # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={sequence}
                    onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Latitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 25.4358"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Longitude <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 81.8463"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Street Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="Optional address details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-bold text-gray-700">
                  Point is Active for Bookings
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-[0_4px_14px_rgba(5,150,105,0.4)] transition-all"
                >
                  {submitting ? 'Saving...' : editingPoint ? 'Update Point' : 'Add Pickup Point'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
