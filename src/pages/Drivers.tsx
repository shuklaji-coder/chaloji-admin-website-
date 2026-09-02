import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DriverDoc {
  id: string;
  name?: string;
  phone?: string;
  vehicle?: string;
  vehicleType?: string;
  plateText?: string;
  isOnline?: boolean;
  verificationStatus?: string;
  accountStatus?: string;
  earnings?: number;
  totalDueAmount?: number;
  totalRides?: number;
  rating?: number;
  photoURL?: string;
  profilePhoto?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  licenseFront?: string;
  rcFront?: string;
  vehicleFrontPhoto?: string;
  createdAt?: any;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<DriverDoc | null>(null);
  const [verificationData, setVerificationData] = useState<any[]>([]);
  const [vehicleData, setVehicleData] = useState<any[]>([]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      console.log('[Admin] Fetching drivers from Firestore...');
      const snap = await getDocs(collection(db, 'drivers'));
      console.log('[Admin] Drivers count:', snap.docs.length);
      console.log('[Admin] Driver IDs:', snap.docs.map(d => d.id));
      const driversData = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DriverDoc));
      setDrivers(driversData);

      // Calculate verification status distribution
      const verificationCounts: { [key: string]: number } = {};
      const vehicleCounts: { [key: string]: number } = {};

      driversData.forEach((d) => {
        const status = d.verificationStatus || 'unknown';
        verificationCounts[status] = (verificationCounts[status] || 0) + 1;

        const vehicle = d.vehicleType || 'other';
        vehicleCounts[vehicle] = (vehicleCounts[vehicle] || 0) + 1;
      });

      setVerificationData(Object.entries(verificationCounts).map(([name, value]) => ({ name, value })));
      setVehicleData(Object.entries(vehicleCounts).map(([name, value]) => ({ name, value })));
    } catch (e) {
      console.error('[Admin] fetch drivers error:', e);
      console.error('[Admin] Error details:', JSON.stringify(e, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const updateVerification = async (driverId: string, status: string) => {
    try {
      const updateData: Record<string, any> = { verificationStatus: status };
      if (status === 'approved') {
        updateData.accountStatus = 'active';
      }
      await updateDoc(doc(db, 'drivers', driverId), updateData);
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, ...updateData } : d))
      );
      if (selectedDriver?.id === driverId) {
        setSelectedDriver((prev) => (prev ? { ...prev, ...updateData } : null));
      }
    } catch (e: any) {
      console.error('update verification error:', e);
      alert(`Failed to update driver status: ${e.message || 'Permission denied'}`);
    }
  };

  const toggleAccountStatus = async (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const actionName = newStatus === 'suspended' ? 'FREEZE (Suspend)' : 'UNFREEZE (Activate)';
    
    if (!confirm(`Are you sure you want to ${actionName} this driver's account?`)) return;
    
    try {
      await updateDoc(doc(db, 'drivers', driverId), { accountStatus: newStatus });
      setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, accountStatus: newStatus } : d)));
      if (selectedDriver?.id === driverId) {
        setSelectedDriver((prev) => (prev ? { ...prev, accountStatus: newStatus } : null));
      }
    } catch (e) {
      console.error('freeze error:', e);
    }
  };

  const deleteDriver = async (driverId: string) => {
    if (!confirm('Delete this driver permanently?')) return;
    try {
      await deleteDoc(doc(db, 'drivers', driverId));
      setDrivers((prev) => prev.filter((d) => d.id !== driverId));
      setSelectedDriver(null);
    } catch (e) {
      console.error('delete driver error:', e);
    }
  };

  const filtered = filter === 'all' ? drivers : drivers.filter((d) => d.verificationStatus === filter);

  const getBadge = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Driver Management</h1>
          <p className="text-gray-500 mt-1">Review verifications, track drivers, and enforce platform quality.</p>
        </div>
        <button onClick={fetchDrivers} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-xs sm:text-sm text-gray-700 hover:text-emerald-700 hover:border-emerald-200 transition-all font-semibold flex items-center gap-2">
          <span className="text-lg leading-none">↻</span> Refresh List
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100/50 w-full overflow-x-auto">
        {['all', 'pending', 'approved', 'rejected', 'not_submitted'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              filter === f ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {f === 'not_submitted' ? 'Incomplete' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Verification Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={verificationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {verificationData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Vehicle Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vehicleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drivers table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left p-3 pl-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Driver Info</th>
              <th className="text-left p-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Vehicle</th>
              <th className="text-left p-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Status</th>
              <th className="text-left p-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">KYC Tag</th>
              <th className="text-left p-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Financials</th>
              <th className="text-left p-3 pr-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center p-8 sm:p-12 text-gray-400 font-medium text-xs sm:text-sm">No drivers match your criteria.</td></tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-3 pl-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img src={d.profilePhoto || d.photoURL || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200 object-cover bg-gray-50" />
                    <div>
                      <button
                        onClick={() => setSelectedDriver(d)}
                        className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors text-xs sm:text-sm"
                      >
                        {d.name || 'Skipped Name'}
                      </button>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">{d.phone || 'No Phone'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className="capitalize font-semibold text-gray-800 text-xs sm:text-sm">{d.vehicleType || '—'}</span>
                  {d.plateText && <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">{d.plateText}</p>}
                </td>
                <td className="p-3">
                  <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${d.isOnline ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${d.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`} />
                    <span className="text-[9px] sm:text-[11px] font-bold tracking-wide uppercase">{d.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[11px] font-bold uppercase tracking-wider ${getBadge(d.verificationStatus)}`}>
                    {d.verificationStatus || 'N/A'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-700 text-[10px] sm:text-xs">E: ₹{(d.earnings || 0).toLocaleString()}</p>
                    <p className={`font-bold text-[10px] sm:text-xs ${d.totalDueAmount ? 'text-rose-600' : 'text-gray-400'}`}>D: ₹{(d.totalDueAmount || 0).toLocaleString()}</p>
                  </div>
                </td>
                <td className="p-3 pr-4">
                  <button onClick={() => setSelectedDriver(d)} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-[10px] sm:text-xs font-bold transition-colors">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in" onClick={() => setSelectedDriver(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col transform animate-in slide-in-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
              <div className="flex items-center gap-3 sm:gap-4">
                <img src={selectedDriver.profilePhoto || selectedDriver.photoURL || 'https://via.placeholder.com/60'} alt="Profile" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-md object-cover" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{selectedDriver.name || 'Unknown Driver'}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">{selectedDriver.phone}</p>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm ${selectedDriver.accountStatus === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                     {selectedDriver.accountStatus === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                  </span>
                  <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm ${getBadge(selectedDriver.verificationStatus)}`}>
                    {selectedDriver.verificationStatus || 'Unknown KYC'}
                  </span>
                </div>
                <button onClick={() => setSelectedDriver(null)} className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-colors text-lg leading-none pb-0.5">&times;</button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <span className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Vehicle</span>
                  <p className="font-bold text-gray-900 capitalize">{selectedDriver.vehicleType || '—'} <br/><span className="text-gray-500 font-medium text-sm">{selectedDriver.plateText || '—'}</span></p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <span className="block text-xs uppercase tracking-wider text-emerald-600/80 font-bold mb-1">Total Earned</span>
                  <p className="font-black text-emerald-700 text-lg">₹{(selectedDriver.earnings || 0).toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                  <span className="block text-xs uppercase tracking-wider text-rose-600/80 font-bold mb-1">Total Due</span>
                  <p className="font-black text-rose-700 text-lg">₹{(selectedDriver.totalDueAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <span className="block text-xs uppercase tracking-wider text-amber-600/80 font-bold mb-1">Completed</span>
                  <p className="font-black text-amber-700 text-lg">{selectedDriver.totalRides || 0} Rides</p>
                </div>
              </div>

              {/* Legal Documents */}
              {(() => {
                const docs = [
                  { key: 'Aadhaar Card (Front)', url: selectedDriver.aadhaarFront },
                  { key: 'Aadhaar Card (Back)', url: selectedDriver.aadhaarBack },
                  { key: 'Driving License', url: selectedDriver.licenseFront },
                  { key: 'Registration Cert (RC)', url: selectedDriver.rcFront },
                  { key: 'Vehicle Photo', url: selectedDriver.vehicleFrontPhoto }
                ].filter(d => Boolean(d.url));

                if (docs.length > 0) {
                  return (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Verification Documents</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map((d) => (
                          <a key={d.key} href={d.url} target="_blank" rel="noopener noreferrer" className="group block bg-gray-50 rounded-2xl p-2 border border-gray-100 hover:border-gray-300 transition-all hover:shadow-md">
                            <img src={d.url} alt={d.key} className="w-full h-32 object-cover rounded-xl border border-black/5" />
                            <p className="text-[11px] font-bold text-gray-600 mt-2 text-center group-hover:text-gray-900">{d.key}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

            </div>

             {/* Modal Actions */}
             <div className="px-4 sm:px-8 py-4 sm:py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
                  <button onClick={() => deleteDriver(selectedDriver.id)} className="px-4 py-2 sm:px-5 sm:py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs sm:text-sm font-bold transition-colors">
                    Delete Driver...
                  </button>
                  <button 
                    onClick={() => toggleAccountStatus(selectedDriver.id, selectedDriver.accountStatus || 'active')} 
                    className={`border px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${selectedDriver.accountStatus === 'suspended' ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100' : 'text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100'}`}
                  >
                    {selectedDriver.accountStatus === 'suspended' ? 'Unfreeze Account' : 'Freeze Account'}
                  </button>
                </div>

                {selectedDriver.verificationStatus !== 'approved' && (
                  <div className="flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button onClick={() => updateVerification(selectedDriver.id, 'rejected')} className="px-4 py-2 sm:px-6 sm:py-2.5 bg-white border-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 rounded-xl font-bold transition-all shadow-sm text-xs sm:text-sm">
                      Reject Application
                    </button>
                    <button onClick={() => updateVerification(selectedDriver.id, 'approved')} className="px-4 py-2 sm:px-8 sm:py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold transition-all shadow-[0_4px_14px_rgba(5,150,105,0.4)] text-xs sm:text-sm">
                      Approve Driver
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
