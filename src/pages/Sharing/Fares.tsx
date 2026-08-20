import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { SharingRoute, SharingPickupPoint, SharingFare } from '../../types/sharing';

export default function Fares() {
  const [routes, setRoutes] = useState<SharingRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [points, setPoints] = useState<SharingPickupPoint[]>([]);
  const [fares, setFares] = useState<SharingFare[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pickupPointId, setPickupPointId] = useState<string>('');
  const [dropPointId, setDropPointId] = useState<string>('');
  const [fareAmount, setFareAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch routes on mount
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

  // Fetch points & fares whenever selected route changes
  const fetchRouteData = async (routeId: string) => {
    if (!routeId) {
      setPoints([]);
      setFares([]);
      return;
    }
    setLoadingData(true);
    try {
      // 1. Fetch points for route
      const pointsQuery = query(collection(db, 'sharing_points'), where('routeId', '==', routeId));
      const pointsSnap = await getDocs(pointsQuery);
      const pointsData: SharingPickupPoint[] = pointsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as SharingPickupPoint));
      pointsData.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      setPoints(pointsData);

      // 2. Fetch fares for route
      const faresQuery = query(collection(db, 'sharing_fares'), where('routeId', '==', routeId));
      const faresSnap = await getDocs(faresQuery);
      const faresData: SharingFare[] = faresSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as SharingFare));
      setFares(faresData);
    } catch (e) {
      console.error('Error fetching fares and points:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteData(selectedRouteId);
    }
  }, [selectedRouteId]);

  const openAddModal = (presetOriginId?: string, presetDropId?: string, currentFare?: number) => {
    setPickupPointId(presetOriginId || (points.length > 0 ? points[0].id : ''));
    setDropPointId(
      presetDropId ||
        (points.length > 1 ? points[1].id : points.length > 0 ? points[0].id : '')
    );
    setFareAmount(currentFare !== undefined ? currentFare.toString() : '');
    setIsModalOpen(true);
  };

  const handleSaveFare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupPointId || !dropPointId) {
      alert('Please select origin pickup point and destination drop point.');
      return;
    }
    if (pickupPointId === dropPointId) {
      alert('Origin and destination point cannot be the same.');
      return;
    }
    if (!fareAmount || isNaN(Number(fareAmount)) || Number(fareAmount) < 0) {
      alert('Please enter a valid fare amount.');
      return;
    }

    setSubmitting(true);
    try {
      // Deterministic Doc ID logic: `${routeId}_${pickupPointId}_${dropPointId}`
      const docId = `${selectedRouteId}_${pickupPointId}_${dropPointId}`;
      const farePayload: SharingFare = {
        id: docId,
        routeId: selectedRouteId,
        pickupPointId,
        dropPointId,
        fare: Number(fareAmount),
      };

      // Authoritative setDoc for fast server lookup
      await setDoc(doc(db, 'sharing_fares', docId), farePayload);

      setIsModalOpen(false);
      fetchRouteData(selectedRouteId);
    } catch (err) {
      console.error('Error saving fare:', err);
      alert('Failed to save fare configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFare = async (fareId: string) => {
    if (!confirm('Are you sure you want to delete this fare rule?')) return;
    try {
      await deleteDoc(doc(db, 'sharing_fares', fareId));
      setFares((prev) => prev.filter((f) => f.id !== fareId));
    } catch (e) {
      console.error('Error deleting fare:', e);
      alert('Failed to delete fare.');
    }
  };

  // Helper map for fast lookup docId -> fare
  const fareMap = new Map<string, SharingFare>();
  fares.forEach((f) => {
    fareMap.set(`${f.pickupPointId}_${f.dropPointId}`, f);
  });

  const getPointName = (id: string) => points.find((p) => p.id === id)?.name || id;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>💰</span>
            <span>ChaloJi Fixed Fare Matrix</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Configure per-seat fixed fares between pickup stops & drop points.
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          disabled={!selectedRouteId || points.length < 2}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(5,150,105,0.4)] transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Set Fixed Fare
        </button>
      </div>

      {/* Route Selector */}
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
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Doc ID Format: <code className="bg-gray-100 px-2 py-1 rounded text-emerald-700 font-mono">{`{routeId}_{pickupId}_{dropId}`}</code>
        </div>
      </div>

      {/* Main Fare Matrix & Table */}
      {!selectedRouteId ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          Please select a route to view and edit its fare matrix.
        </div>
      ) : loadingData ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
      ) : points.length < 2 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700 mb-1">
            At least 2 pickup points required
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Add at least two sequential pickup stops for this route before setting up fares.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Fare Matrix Grid */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Fare Matrix (Origin ➔ Destination)</span>
              <span className="text-xs font-normal text-gray-500">Click cell to add/update fare</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="p-3 bg-gray-100/80 font-bold text-gray-600 text-left rounded-tl-xl border border-gray-200">
                      Origin \ Destination
                    </th>
                    {points.map((p) => (
                      <th key={p.id} className="p-3 bg-gray-50 font-bold text-gray-800 border border-gray-200">
                        #{p.sequence} {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {points.map((origin) => (
                    <tr key={origin.id}>
                      <td className="p-3 bg-gray-50 font-bold text-gray-800 text-left border border-gray-200">
                        #{origin.sequence} {origin.name}
                      </td>
                      {points.map((drop) => {
                        if (origin.id === drop.id) {
                          return (
                            <td key={drop.id} className="p-3 bg-gray-100 text-gray-400 border border-gray-200 font-mono">
                              —
                            </td>
                          );
                        }
                        const existingFare = fareMap.get(`${origin.id}_${drop.id}`);
                        return (
                          <td key={drop.id} className="p-2 border border-gray-200">
                            {existingFare ? (
                              <button
                                onClick={() => openAddModal(origin.id, drop.id, existingFare.fare)}
                                className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <span>₹{existingFare.fare}</span>
                                <span className="text-[9px] text-emerald-600 font-normal">✎</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openAddModal(origin.id, drop.id)}
                                className="w-full py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 font-medium rounded-lg border border-dashed border-gray-300 transition-colors"
                              >
                                + Set
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configured Fares Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Active Fare Rules ({fares.length})
              </span>
              <span className="text-xs text-gray-400">
                Authoritative per-seat server fares
              </span>
            </div>

            {fares.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No fixed fare rules configured for this route yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-3 pl-4">Origin Pickup Point</th>
                      <th className="p-3">Destination Drop Point</th>
                      <th className="p-3">Fixed Fare (Per Seat)</th>
                      <th className="p-3">Doc ID</th>
                      <th className="p-3 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fares.map((f) => (
                      <tr key={f.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="p-3 pl-4 font-bold text-gray-800">
                          {getPointName(f.pickupPointId)}
                        </td>
                        <td className="p-3 font-bold text-gray-800">
                          {getPointName(f.dropPointId)}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-lg text-xs">
                            ₹{f.fare}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] font-mono text-gray-400">
                          {f.id}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAddModal(f.pickupPointId, f.dropPointId, f.fare)}
                              className="px-3 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteFare(f.id)}
                              className="px-3 py-1 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Update Fare Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform animate-in slide-in-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Set Fixed Fare</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFare} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Origin Pickup Point <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pickupPointId}
                  onChange={(e) => setPickupPointId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.sequence} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Destination Drop Point <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dropPointId}
                  onChange={(e) => setDropPointId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === pickupPointId}>
                      #{p.sequence} {p.name} {p.id === pickupPointId ? '(Origin)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Fixed Fare (₹ Per Seat) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="20"
                    value={fareAmount}
                    onChange={(e) => setFareAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-emerald-700 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800">
                <span className="font-bold block mb-0.5">Authoritative Doc ID:</span>
                <code className="font-mono text-[10px] break-all">{`${selectedRouteId}_${pickupPointId}_${dropPointId}`}</code>
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
                  {submitting ? 'Saving...' : 'Save Fixed Fare'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
