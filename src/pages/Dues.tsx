import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DriverDues {
  id: string;
  name?: string;
  phone?: string;
  totalDueAmount?: number;
  earnings?: number;
  isOnline?: boolean;
  accountStatus?: string;
}

export default function Dues() {
  const [drivers, setDrivers] = useState<DriverDues[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [dueRangeData, setDueRangeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'drivers'));
      const duesList = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as DriverDues))
        .filter(d => (d.totalDueAmount || 0) > 0)
        .sort((a, b) => (b.totalDueAmount || 0) - (a.totalDueAmount || 0));
        
      setDrivers(duesList);

      // Calculate due range distribution
      const dueRanges: { [key: string]: number } = {
        '0-500': 0,
        '500-1000': 0,
        '1000-2000': 0,
        '2000-5000': 0,
        '5000+': 0
      };

      const statusCounts: { [key: string]: number } = {};

      duesList.forEach((d) => {
        const due = d.totalDueAmount || 0;
        if (due < 500) dueRanges['0-500']++;
        else if (due < 1000) dueRanges['500-1000']++;
        else if (due < 2000) dueRanges['1000-2000']++;
        else if (due < 5000) dueRanges['2000-5000']++;
        else dueRanges['5000+']++;

        const status = d.accountStatus || 'active';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      setDueRangeData(Object.entries(dueRanges).map(([name, value]) => ({ name, value })));
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
    } catch (e) {
      console.error('fetch dues error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDues(); }, []);

  const clearDues = async (driverId: string, currentDue: number) => {
    if (!confirm(`Are you sure you want to clear ₹${currentDue} dues for this driver? (Mark as Paid)`)) return;
    setClearing(driverId);
    try {
      await updateDoc(doc(db, 'drivers', driverId), {
        totalDueAmount: 0,
        dueSince: null,
        paymentHistory: arrayUnion({
          amount: currentDue,
          clearedAt: new Date().toISOString(),
          clearedBy: 'admin',
        }),
      });
      setDrivers(prev => prev.filter(d => d.id !== driverId));
    } catch (e) {
      console.error('clear dues error', e);
      alert('Failed to clear Dues');
    } finally {
      setClearing(null);
    }
  };

  const toggleAccountStatus = async (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const actionName = newStatus === 'suspended' ? 'FREEZE (Suspend)' : 'UNFREEZE (Activate)';
    
    if (!confirm(`Are you sure you want to ${actionName} this driver's account?`)) return;
    
    try {
      await updateDoc(doc(db, 'drivers', driverId), { accountStatus: newStatus });
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, accountStatus: newStatus } : d));
    } catch (e) {
      console.error('freeze error', e);
      alert('Failed to update account status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  const grandTotal = drivers.reduce((acc, curr) => acc + (curr.totalDueAmount || 0), 0);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Pending Dues & Settlements</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">Drivers whose total commission hasn't been collected yet.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="bg-rose-50 text-rose-700 px-3 py-1.5 sm:px-4 sm:py-2 border border-rose-100 rounded-xl">
             <span className="text-[9px] sm:text-xs uppercase tracking-wider font-bold opacity-80 block mb-0.5">Grand Total Due</span>
             <span className="text-base sm:text-xl font-black">₹{grandTotal.toLocaleString()}</span>
          </div>
          <button onClick={fetchDues} className="px-4 py-2 sm:px-5 sm:py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-xs sm:text-sm text-gray-700 hover:text-emerald-700 font-semibold flex items-center gap-1.5">
             ↻ Refresh
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Due Amount Ranges</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dueRangeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Account Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={['#10B981', '#EF4444', '#F59E0B'][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-x-auto custom-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left p-3 sm:p-4 pl-4 sm:pl-6 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Driver</th>
              <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Phone</th>
              <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Lifetime Earnings</th>
              <th className="text-left p-3 sm:p-4 font-bold text-rose-500 uppercase tracking-wider text-[10px] sm:text-xs bg-rose-50/30">Total Pending Due</th>
              <th className="text-right p-3 sm:p-4 pr-4 sm:pr-6 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drivers.length === 0 && (
              <tr><td colSpan={5} className="text-center p-8 sm:p-12 text-gray-400 font-medium text-xs sm:text-sm">No pending dues right now! 👍</td></tr>
            )}
            {drivers.map(d => (
              <tr key={d.id} className="hover:bg-rose-50/20 transition-colors">
                <td className="p-3 sm:p-4 pl-4 sm:pl-6">
                   <p className="font-bold text-gray-900 text-xs sm:text-sm">{d.name || 'Unnamed Driver'}</p>
                   {d.isOnline && <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-green-600 block mt-0.5">Online Now</span>}
                </td>
                <td className="p-3 sm:p-4 text-gray-600 font-medium text-xs sm:text-sm">{d.phone || '—'}</td>
                <td className="p-3 sm:p-4 text-gray-700 font-bold text-xs sm:text-sm">₹{(d.earnings || 0).toLocaleString()}</td>
                <td className="p-3 sm:p-4">
                  <span className="inline-block bg-rose-100 text-rose-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg font-black tracking-wide text-xs sm:text-sm">
                     ₹{d.totalDueAmount?.toLocaleString()}
                  </span>
                </td>
                <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-right">
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => toggleAccountStatus(d.id, d.accountStatus || 'active')}
                      className={`px-2.5 py-1.5 sm:px-3 sm:py-2 border rounded-xl text-[10px] sm:text-xs font-bold transition-all ${d.accountStatus === 'suspended' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                    >
                      {d.accountStatus === 'suspended' ? 'Unfreeze' : 'Freeze'}
                    </button>
                    <button 
                      onClick={() => clearDues(d.id, d.totalDueAmount || 0)}
                      disabled={clearing === d.id}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {clearing === d.id ? 'Processing...' : 'Mark as Paid'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
