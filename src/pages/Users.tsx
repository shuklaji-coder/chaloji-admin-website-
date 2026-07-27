import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserDoc {
  id: string;
  phone?: string;
  name?: string;
  createdAt?: any;
  totalRides?: number;
}

export default function Users() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState<any[]>([]);
  const [ridesData, setRidesData] = useState<any[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('[Admin] Fetching users from Firestore...');
      const snap = await getDocs(collection(db, 'users'));
      console.log('[Admin] Users count:', snap.docs.length);
      const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc));
      setUsers(usersData);

      // Calculate registration data by month
      const monthCounts: { [key: string]: number } = {};
      const ridesCounts: { [key: string]: number } = {
        '0 rides': 0,
        '1-5 rides': 0,
        '5-10 rides': 0,
        '10+ rides': 0
      };

      usersData.forEach((u) => {
        if (u.createdAt?.toDate) {
          const date = u.createdAt.toDate();
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }

        const rides = u.totalRides || 0;
        if (rides === 0) ridesCounts['0 rides']++;
        else if (rides <= 5) ridesCounts['1-5 rides']++;
        else if (rides <= 10) ridesCounts['5-10 rides']++;
        else ridesCounts['10+ rides']++;
      });

      setRegistrationData(Object.entries(monthCounts).map(([name, value]) => ({ name, value })));
      setRidesData(Object.entries(ridesCounts).map(([name, value]) => ({ name, value })));
    } catch (e) {
      console.error('[Admin] fetch users error:', e);
      console.error('[Admin] Error details:', JSON.stringify(e, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Passenger Management</h1>
          <p className="text-gray-500 mt-1">View and manage all registered users.</p>
        </div>
        <button onClick={fetchUsers} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-xs sm:text-sm text-gray-700 hover:text-emerald-700 font-semibold flex items-center gap-2">
           ↻ Refresh
        </button>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">User Registrations by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">User Rides Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ridesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ridesData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left p-3 pl-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">User ID</th>
              <th className="text-left p-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Name</th>
              <th className="text-left p-3 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Phone Number</th>
              <th className="text-left p-3 pr-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 && (
              <tr><td colSpan={4} className="text-center p-8 sm:p-12 text-gray-400 text-xs sm:text-sm">No users found.</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 pl-4 text-gray-500 font-mono text-[9px] sm:text-xs">{u.id.substring(0, 8)}...</td>
                <td className="p-3 font-bold text-gray-900 text-xs sm:text-sm">{u.name || 'No Name'}</td>
                <td className="p-3 text-gray-600 font-medium text-xs sm:text-sm">{u.phone || '—'}</td>
                <td className="p-3 pr-4 text-gray-500 text-xs sm:text-sm">
                  {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
