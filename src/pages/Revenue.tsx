import { useEffect, useState } from 'react';

import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '../firebase';

import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



interface RideDoc {

  id: string;

  fare?: number;

  commission?: number;

  status?: string;

  vehicleType?: string;

  createdAt?: any;

  passengerName?: string;

}



export default function Revenue() {

  const [rides, setRides] = useState<RideDoc[]>([]);

  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({

    totalGMV: 0,

    totalCommission: 0,

    completedRides: 0,

  });

  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  const [vehicleRevenue, setVehicleRevenue] = useState<any[]>([]);



  const fetchRevenue = async () => {

    setLoading(true);

    try {

      // Get all completed rides to calculate total GMV and Commission

      const ridesQuery = query(collection(db, 'rides'), where('status', '==', 'completed'));

      const snap = await getDocs(ridesQuery);

      

      let gmv = 0;

      let comm = 0;

      const ridesData: RideDoc[] = [];

      const vehicleRevenueMap: { [key: string]: number } = {};



      snap.forEach(d => {

        const data = d.data();

        const fare = data.fare || 0;
        const commission = data.commission || 0;

        gmv += fare;

        comm += commission;

        ridesData.push({ id: d.id, ...data } as RideDoc);

        // Track revenue by vehicle type
        const vehicle = data.vehicleType || 'other';
        vehicleRevenueMap[vehicle] = (vehicleRevenueMap[vehicle] || 0) + fare;
      });

      

      setMetrics({

        totalGMV: gmv,

        totalCommission: comm,

        completedRides: snap.size,

      });

      // Calculate weekly revenue data
      const now = new Date();
      const weeklyChartData: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const dayRides = ridesData.filter(doc => {
          const createdAt = doc.createdAt?.toDate();
          return createdAt && createdAt >= startOfDay && createdAt < endOfDay;
        });

        const dayRevenue = dayRides.reduce((sum, doc) => sum + (doc.fare || 0), 0);
        const dayCommission = dayRides.reduce((sum, doc) => sum + (doc.commission || 0), 0);

        weeklyChartData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: dayRevenue,
          commission: dayCommission,
        });
      }

      setWeeklyData(weeklyChartData);

      // Set vehicle revenue data
      setVehicleRevenue(Object.entries(vehicleRevenueMap).map(([name, value]) => ({ name, value })));

      // Sort rides locally for recent table (if 'createdAt' is available)

      const sortedRides = ridesData.sort((a, b) => {

         const t1 = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;

         const t2 = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;

         return t2 - t1;

      });



      setRides(sortedRides.slice(0, 50)); // Last 50 completed rides



    } catch (e) {

      console.error('fetch revenue error', e);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => { fetchRevenue(); }, []);



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

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Revenue Center</h1>

          <p className="text-gray-500 mt-1 text-xs sm:text-sm">Track financial metrics, GMV, and your platform cut.</p>

        </div>

        <button onClick={fetchRevenue} className="self-start sm:self-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-xs sm:text-sm text-gray-700 hover:text-emerald-700 font-semibold flex items-center gap-2">

           ↻ Refresh

        </button>

      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">

           <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest block mb-1 sm:mb-2">Total GMV</span>

           <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">₹{metrics.totalGMV.toLocaleString()}</p>

           <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">Total volume of all transactions</p>

        </div>

        

        <div className="bg-emerald-50 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgba(16,185,129,0.08)] border border-emerald-100/60 p-4 sm:p-6 relative overflow-hidden">

           <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-200/50 rounded-full blur-2xl"></div>

           <span className="text-xs sm:text-sm font-semibold text-emerald-700/70 uppercase tracking-widest block mb-1 sm:mb-2 relative z-10">Platform Commission</span>

           <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-700 relative z-10">₹{metrics.totalCommission.toLocaleString()}</p>

           <p className="text-xs sm:text-sm text-emerald-600/70 font-medium mt-1 relative z-10">Total revenue generated by the app</p>

        </div>



        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">

           <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest block mb-1 sm:mb-2">Completed Transactions</span>

           <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">{metrics.completedRides.toLocaleString()}</p>

           <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">Successfully fulfilled rides</p>

        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Weekly Revenue & Commission</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue (₹)" dot={{ fill: '#10B981', r: 5 }} />
              <Line type="monotone" dataKey="commission" stroke="#3B82F6" strokeWidth={3} name="Commission (₹)" dot={{ fill: '#3B82F6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Revenue by Vehicle Type</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={vehicleRevenue}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {vehicleRevenue.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">50 Most Recent Transactions</h2>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-x-auto custom-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">

        <table className="w-full text-sm min-w-[600px]">

          <thead>

            <tr className="bg-gray-50/80 border-b border-gray-100">

              <th className="text-left p-3 sm:p-4 pl-4 sm:pl-6 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Ride ID</th>

              <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Date</th>

              <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Passenger</th>

              <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Vehicle</th>

              <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Ride Fare</th>

              <th className="text-left p-3 sm:p-4 pr-4 sm:pr-6 font-bold text-emerald-600 uppercase tracking-wider text-[10px] sm:text-xs">Platform Cut</th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-50">

            {rides.length === 0 && (

              <tr><td colSpan={6} className="text-center p-8 sm:p-12 text-gray-400 text-xs sm:text-sm">No completed rides yet.</td></tr>

            )}

            {rides.map(r => (

              <tr key={r.id} className="hover:bg-gray-50 transition-colors">

                <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-mono text-[10px] sm:text-xs text-gray-500">{r.id.substring(0, 8)}</td>

                <td className="p-3 sm:p-4 text-gray-600 font-medium text-xs sm:text-sm">

                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : '—'}

                </td>

                <td className="p-3 sm:p-4 font-bold text-gray-900 text-xs sm:text-sm">{r.passengerName || 'Unknown'}</td>

                <td className="p-3 sm:p-4 text-gray-600 capitalize text-xs sm:text-sm">{r.vehicleType || '—'}</td>

                <td className="p-3 sm:p-4 font-bold text-gray-700 text-xs sm:text-sm">₹{(r.fare || 0).toLocaleString()}</td>

                <td className="p-3 sm:p-4 pr-4 sm:pr-6">

                  <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] sm:text-xs">

                    ₹{(r.commission || 0).toLocaleString()}

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

