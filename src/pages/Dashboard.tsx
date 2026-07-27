import { useEffect, useState } from 'react';

import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '../firebase';

import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



interface Stats {

  totalDrivers: number;

  onlineDrivers: number;

  pendingVerifications: number;

  totalUsers: number;

  totalRides: number;

  activeRides: number;

  todayRides: number;

  totalEarnings: number;

  totalDueAmount: number;

}

interface ChartData {

  name: string;

  value: number;

}

interface TimeSeriesData {

  date: string;

  rides: number;

  revenue: number;

}



export default function Dashboard() {

  const [stats, setStats] = useState<Stats>({

    totalDrivers: 0, onlineDrivers: 0, pendingVerifications: 0,

    totalUsers: 0, totalRides: 0, activeRides: 0, todayRides: 0,

    totalEarnings: 0, totalDueAmount: 0,

  });

  const [loading, setLoading] = useState(true);

  const [weeklyData, setWeeklyData] = useState<TimeSeriesData[]>([]);

  const [vehicleData, setVehicleData] = useState<ChartData[]>([]);



  useEffect(() => {

    (async () => {

      try {

        const now = new Date();

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());



        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);

        const [driversSnap, usersSnap, ridesSnap, todayRidesSnap, weeklyRidesSnap] = await Promise.all([

          getDocs(collection(db, 'drivers')),

          getDocs(collection(db, 'users')),

          getDocs(collection(db, 'rides')),

          getDocs(query(collection(db, 'rides'), where('createdAt', '>=', startOfToday))),

          getDocs(query(collection(db, 'rides'), where('createdAt', '>=', startOfWeek))),

        ]);



        let online = 0, pendingVer = 0, active = 0, earnings = 0, dues = 0;

        const vehicleCounts: { [key: string]: number } = {};

        driversSnap.forEach((d) => {

          const data = d.data();

          if (data.isOnline) online++;

          if (data.verificationStatus === 'pending') pendingVer++;

          earnings += data.earnings || 0;

          dues += data.totalDueAmount || 0;

          const vehicle = data.vehicleType || 'other';

          vehicleCounts[vehicle] = (vehicleCounts[vehicle] || 0) + 1;

        });



        ridesSnap.forEach((r) => {

          if (r.data().status === 'accepted' || r.data().status === 'ongoing') active++;

        });

        const vehicleChartData = Object.entries(vehicleCounts).map(([name, value]) => ({ name, value }));

        setVehicleData(vehicleChartData);

        const weeklyChartData: TimeSeriesData[] = [];

        for (let i = 6; i >= 0; i--) {

          const date = new Date(now);

          date.setDate(now.getDate() - i);

          const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

          const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

          const dayRides = weeklyRidesSnap.docs.filter(doc => {

            const createdAt = doc.data().createdAt?.toDate();

            return createdAt && createdAt >= startOfDay && createdAt < endOfDay;

          });

          const dayRevenue = dayRides.reduce((sum, doc) => sum + (doc.data().fare || 0), 0);

          weeklyChartData.push({

            date: date.toLocaleDateString('en-US', { weekday: 'short' }),

            rides: dayRides.length,

            revenue: dayRevenue,

          });

        }

        setWeeklyData(weeklyChartData);



        setStats({

          totalDrivers: driversSnap.size,

          onlineDrivers: online,

          pendingVerifications: pendingVer,

          totalUsers: usersSnap.size,

          totalRides: ridesSnap.size,

          activeRides: active,

          todayRides: todayRidesSnap.size,

          totalEarnings: earnings,

          totalDueAmount: dues,

        });

      } catch (e) {
        console.error('Dashboard fetch error:', e);
        console.error('Dashboard error details:', JSON.stringify(e, null, 2));
      } finally {

        setLoading(false);

      }

    })();

  }, []);



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />

      </div>

    );

  }



  const cards = [

    { label: 'Total Drivers', value: stats.totalDrivers, color: 'from-blue-500 to-blue-600', text: 'text-blue-600', shadow: 'shadow-blue-500/20' },

    { label: 'Online Now', value: stats.onlineDrivers, color: 'from-emerald-400 to-emerald-500', text: 'text-emerald-600', shadow: 'shadow-emerald-500/20' },

    { label: 'Pending Docs', value: stats.pendingVerifications, color: 'from-amber-400 to-amber-500', text: 'text-amber-600', shadow: 'shadow-amber-500/20' },

    { label: 'Total Passengers', value: stats.totalUsers, color: 'from-purple-500 to-purple-600', text: 'text-purple-600', shadow: 'shadow-purple-500/20' },

    { label: 'Total Rides', value: stats.totalRides, color: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', shadow: 'shadow-indigo-500/20' },

    { label: 'Active Rides', value: stats.activeRides, color: 'from-cyan-400 to-cyan-500', text: 'text-cyan-600', shadow: 'shadow-cyan-500/20' },

    { label: "Today's Rides", value: stats.todayRides, color: 'from-sky-400 to-sky-500', text: 'text-sky-600', shadow: 'shadow-sky-500/20' },

    { label: 'Driver Earnings', value: `₹${stats.totalEarnings.toLocaleString()}`, color: 'from-teal-400 to-teal-500', text: 'text-teal-600', shadow: 'shadow-teal-500/20' },

    { label: 'Commission Dues', value: `₹${stats.totalDueAmount.toLocaleString()}`, color: 'from-rose-500 to-rose-600', text: 'text-rose-600', shadow: 'shadow-rose-500/20' },

  ];



  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (

    <div className="fade-in">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Platform Overview</h1>

          <p className="text-gray-500 mt-1">Monitor all metrics and activity in real-time.</p>

        </div>

      </div>

      

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">

        {cards.map((c) => (

          <div key={c.label} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1">

            <div className="flex items-center justify-between mb-4">

              <span className="text-sm text-gray-500 font-semibold tracking-wide uppercase">{c.label}</span>

              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${c.color} ${c.shadow} shadow-lg`} />

            </div>

            <p className={`text-4xl font-black ${c.text}`}>{c.value}</p>

          </div>

        ))}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6">

          <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Rides & Revenue</h2>

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={weeklyData}>

              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

              <XAxis dataKey="date" stroke="#6B7280" />

              <YAxis yAxisId="rides" stroke="#6B7280" />

              <YAxis yAxisId="revenue" orientation="right" stroke="#6B7280" />

              <Tooltip />

              <Legend />

              <Line yAxisId="rides" type="monotone" dataKey="rides" stroke="#10B981" strokeWidth={3} name="Rides" dot={{ fill: '#10B981', r: 6 }} />

              <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Revenue (₹)" dot={{ fill: '#3B82F6', r: 6 }} />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6">

          <h2 className="text-xl font-bold text-gray-900 mb-6">Vehicle Distribution</h2>

          <ResponsiveContainer width="100%" height={300}>

            <PieChart>

              <Pie

                data={vehicleData}

                cx="50%"

                cy="50%"

                labelLine={false}

                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}

                outerRadius={100}

                fill="#8884d8"

                dataKey="value"

              >

                {vehicleData.map((_, index) => (

                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

                ))}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>

  );

}

