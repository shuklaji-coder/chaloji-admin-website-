import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import type { SharingRoute } from '../../types/sharing';

export default function Routes() {
  const [routes, setRoutes] = useState<SharingRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<SharingRoute | null>(null);
  const [name, setName] = useState<string>('');
  const [startPointName, setStartPointName] = useState<string>('');
  const [endPointName, setEndPointName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'sharing_routes'), orderBy('createdAt', 'desc'));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err) {
        // Fallback if index not created or empty
        snap = await getDocs(collection(db, 'sharing_routes'));
      }
      const data: SharingRoute[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as SharingRoute));
      setRoutes(data);
    } catch (e) {
      console.error('Error fetching routes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const openCreateModal = () => {
    setEditingRoute(null);
    setName('');
    setStartPointName('');
    setEndPointName('');
    setDescription('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (route: SharingRoute) => {
    setEditingRoute(route);
    setName(route.name || '');
    setStartPointName(route.startPointName || '');
    setEndPointName(route.endPointName || '');
    setDescription(route.description || '');
    setStatus(route.status || 'ACTIVE');
    setIsModalOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startPointName.trim() || !endPointName.trim()) {
      alert('Please fill in Name, Start Point, and End Point.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRoute) {
        const routeRef = doc(db, 'sharing_routes', editingRoute.id);
        await updateDoc(routeRef, {
          name: name.trim(),
          startPointName: startPointName.trim(),
          endPointName: endPointName.trim(),
          description: description.trim(),
          status,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'sharing_routes'), {
          name: name.trim(),
          startPointName: startPointName.trim(),
          endPointName: endPointName.trim(),
          description: description.trim(),
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (err) {
      console.error('Error saving route:', err);
      alert('Failed to save route. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (route: SharingRoute) => {
    const newStatus = route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateDoc(doc(db, 'sharing_routes', route.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setRoutes((prev) =>
        prev.map((r) => (r.id === route.id ? { ...r, status: newStatus } : r))
      );
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Failed to update status.');
    }
  };

  const handleDeleteRoute = async (id: string, routeName: string) => {
    if (!confirm(`Are you sure you want to delete route "${routeName}"?`)) return;
    try {
      await deleteDoc(doc(db, 'sharing_routes', id));
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Error deleting route:', e);
      alert('Failed to delete route.');
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.startPointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.endPointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>🛺</span>
            <span>ChaloJi Sharing Routes</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Manage digital fixed-fare shared transport routes, start & end terminals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoutes}
            className="px-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-xs sm:text-sm text-gray-700 hover:text-emerald-700 hover:border-emerald-200 transition-all font-semibold flex items-center gap-2"
          >
            <span className="text-lg leading-none">↻</span> Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(5,150,105,0.4)] transition-all flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Add New Route
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search route name, start or end point..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content / Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700 mb-1">No routes found</p>
          <p className="text-xs text-gray-400 mb-4">
            {routes.length === 0
              ? 'Get started by adding your first fixed route.'
              : 'No routes match your search filters.'}
          </p>
          {routes.length === 0 && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              + Create Route
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoutes.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-5 flex flex-col justify-between hover:border-emerald-200 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">
                    {r.name}
                  </h3>
                  <button
                    onClick={() => toggleStatus(r)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all ${
                      r.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r.status}
                  </button>
                </div>

                {r.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{r.description}</p>
                )}

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-400 font-medium">Start:</span>
                    <span className="font-semibold text-gray-800">{r.startPointName}</span>
                  </div>
                  <div className="w-0.5 h-3 bg-gray-300 ml-0.5"></div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-gray-400 font-medium">End:</span>
                    <span className="font-semibold text-gray-800">{r.endPointName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium">
                  ID: {r.id.substring(0, 8)}...
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(r)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(r.id, r.name)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Route Modal */}
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
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Route Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoolpur to Main Market"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Start Point Terminal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoolpur Chauraha"
                    value={startPointName}
                    onChange={(e) => setStartPointName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    End Point Terminal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Market"
                    value={endPointName}
                    onChange={(e) => setEndPointName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional route notes or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Route Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
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
                  {submitting ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
