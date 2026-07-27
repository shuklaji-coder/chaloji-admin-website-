import { useEffect, useState } from 'react';

import { collection, getDocs } from 'firebase/firestore';

import { db } from '../firebase';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';



interface Location {

  address: string;

}



interface RideDoc {

  id: string;

  passengerName?: string;

  driverId?: string | null;

  status?: string;

  vehicleType?: string;

  pickup?: Location;

  drop?: Location;

  fare?: number;

  createdAt?: any;

}



export default function Rides() {

  const [rides, setRides] = useState<RideDoc[]>([]);

  const [loading, setLoading] = useState(true);

  const [statusData, setStatusData] = useState<any[]>([]);

  const [vehicleData, setVehicleData] = useState<any[]>([]);



  const fetchRides = async () => {

    setLoading(true);

    try {

      const snap = await getDocs(collection(db, 'rides'));

      const ridesData = snap.docs.map(d => ({ id: d.id, ...d.data() } as RideDoc));

      // Calculate status distribution
      const statusCounts: { [key: string]: number } = {};
      const vehicleCounts: { [key: string]: number } = {};

      ridesData.forEach((r) => {
        const status = r.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        const vehicle = r.vehicleType || 'other';
        vehicleCounts[vehicle] = (vehicleCounts[vehicle] || 0) + 1;
      });

      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
      setVehicleData(Object.entries(vehicleCounts).map(([name, value]) => ({ name, value })));

      // Sort locally by creation date (newest first)

      const sorted = ridesData.sort((a, b) => {

         const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;

         const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;

         return t2 - t1;

      });



      setRides(sorted.slice(0, 100)); // Last 100 rides

    } catch (e) {

      console.error('fetch rides error', e);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => { fetchRides(); }, []);



  const getStatusBadge = (status?: string) => {

    switch (status) {

      case 'completed': return 'bg-emerald-100 text-emerald-700';

      case 'ongoing': return 'bg-blue-100 text-blue-700';

      case 'accepted': return 'bg-indigo-100 text-indigo-700';

      case 'requested': return 'bg-amber-100 text-amber-700 animate-pulse';

      case 'cancelled': return 'bg-rose-100 text-rose-700';

      default: return 'bg-gray-100 text-gray-700';

    }

  };



  if (loading) {

    return (

      <div className="flex justify-center items-center h-64">

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>

      </div>

    );

  }



  return (

    <div className="animate-in fade-in duration-300">

      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Live Rides & History</h1>

          <p className="text-gray-500 mt-1">Track requested, ongoing, and completed trips in real-time.</p>

        </div>

        <button onClick={fetchRides} className="px-5 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-sm text-gray-700 hover:text-emerald-700 font-semibold flex items-center gap-2">

           ↻ Refresh

        </button>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ride Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
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
                  <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Type Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
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

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-x-auto">

        <table className="w-full text-sm min-w-[800px]">

          <thead>

            <tr className="bg-gray-50/80 border-b border-gray-100">

              <th className="text-left p-4 pl-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Ride ID</th>

              <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Passenger</th>

              <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Route</th>

              <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Vehicle</th>

              <th className="text-left p-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Fare</th>

              <th className="text-right p-4 pr-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-50">

            {rides.length === 0 && (

              <tr><td colSpan={6} className="text-center p-12 text-gray-400">No rides scheduled today.</td></tr>

            )}

            {rides.map(r => (

              <tr key={r.id} className="hover:bg-gray-50 transition-colors">

                <td className="p-4 pl-6 text-gray-500 font-mono text-[11px] whitespace-nowrap">

                  {r.id.substring(0, 8)}<br/>

                  <span className="text-gray-400 tracking-tighter">

                    {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : ''}

                  </span>

                </td>

                <td className="p-4">

                   <p className="font-bold text-gray-900">{r.passengerName || 'Unknown'}</p>

                   {r.driverId && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 block mt-0.5">Driver Assigned</span>}

                </td>

                <td className="p-4 max-w-xs">

                  <div className="flex flex-col gap-1.5 text-xs">

                    <div className="flex items-start gap-2">

                       <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>

                       <p className="text-gray-600 truncate">{r.pickup?.address || '—'}</p>

                    </div>

                    <div className="flex items-start gap-2">

                       <div className="w-2 h-2 rounded bg-rose-500 mt-1 shrink-0"></div>

                       <p className="text-gray-600 truncate">{r.drop?.address || '—'}</p>

                    </div>

                  </div>

                </td>

                <td className="p-4 text-gray-600 capitalize font-medium">{r.vehicleType || '—'}</td>

                <td className="p-4 font-black tracking-wide text-gray-800">₹{(r.fare || 0).toLocaleString()}</td>

                <td className="p-4 pr-6 text-right">

                  <span className={`inline-block px-3 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider ${getStatusBadge(r.status)}`}>

                    {r.status || 'requested'}

                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

