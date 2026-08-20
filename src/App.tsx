import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

import { AuthProvider, useAuth } from './AuthContext';

import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';

import Dashboard from './pages/Dashboard';

import Drivers from './pages/Drivers';

import Users from './pages/Users';

import Dues from './pages/Dues';

import Revenue from './pages/Revenue';

import Rides from './pages/Rides';

import Radar from './pages/Radar';

import Settings from './pages/Settings';

import Broadcasts from './pages/Broadcasts';

import Feedback from './pages/Feedback';

import SharingRoutes from './pages/Sharing/Routes';

import SharingPoints from './pages/Sharing/Points';

import SharingFares from './pages/Sharing/Fares';

import BaraatBookings from './pages/BaraatBookings';
import OutstationBookings from './pages/OutstationBookings';



function PrivateLayout({ children }: { children: React.ReactNode }) {

  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }



  return (

    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">

      {/* Premium Sidebar */}

      <div className="w-[280px] bg-gradient-to-b from-gray-900 to-gray-950 text-white min-h-screen p-6 relative shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-20 flex flex-col">

        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-gray-800/50">

          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">

             <span className="font-bold text-white text-lg leading-none">C</span>

          </div>

          <h1 className="text-xl font-bold tracking-wide">ChaloJi <span className="text-emerald-400 font-medium">Admin</span></h1>

        </div>

        

        <nav className="flex flex-col gap-2 flex-1">

          <Link to="/" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">❖</span> Dashboard

          </Link>

          <Link to="/drivers" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">🚗</span> Drivers Details

          </Link>

          <Link to="/radar" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">🌍</span> Live Radar Map

          </Link>

          <Link to="/users" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">👥</span> Passengers

          </Link>

          <Link to="/rides" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">📍</span> Live Rides

          </Link>

          <Link to="/revenue" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">📈</span> Revenue & GMV

          </Link>

          <Link to="/dues" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">💸</span> Pending Dues

          </Link>

          <Link to="/baraat-bookings" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">🥁</span> Baraat Bookings

          </Link>

          <Link to="/outstation-bookings" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">✈️</span> Outstation Rides

          </Link>

          

          <div className="h-px bg-white/10 my-2 mx-4"></div>

          <div className="px-4 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">
            ChaloJi Sharing
          </div>

          <Link to="/sharing/routes" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">
            <span className="text-emerald-400 group-hover:text-emerald-300">🛺</span> Routes
          </Link>

          <Link to="/sharing/points" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">
            <span className="text-emerald-400 group-hover:text-emerald-300">📍</span> Pickup Points
          </Link>

          <Link to="/sharing/fares" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">
            <span className="text-emerald-400 group-hover:text-emerald-300">💰</span> Fixed Fares
          </Link>

          <div className="h-px bg-white/10 my-2 mx-4"></div>

          <Link to="/broadcasts" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">📢</span> Broadcasts

          </Link>

          <Link to="/feedback" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">💬</span> Feedback

          </Link>

          <Link to="/settings" className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 rounded-xl font-medium transition-all group">

            <span className="text-emerald-400 group-hover:text-emerald-300">⚙️</span> Settings

          </Link>

        </nav>

        

        <button 

          onClick={logout} 

          className="mt-auto w-full p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all font-medium border border-red-500/20 shadow-sm"

        >

          Logout Account

        </button>

      </div>

      

      {/* Main Content Area */}

      <div className="flex-1 h-screen overflow-y-auto bg-[#F8FAFC]">

        <div className="max-w-7xl mx-auto p-8 lg:p-10">

          {children}

        </div>

      </div>

    </div>

  );

}



function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />

          <Route path="/drivers" element={<PrivateLayout><Drivers /></PrivateLayout>} />

          <Route path="/radar" element={<PrivateLayout><Radar /></PrivateLayout>} />

          <Route path="/rides" element={<PrivateLayout><Rides /></PrivateLayout>} />

          <Route path="/users" element={<PrivateLayout><Users /></PrivateLayout>} />

          <Route path="/revenue" element={<PrivateLayout><Revenue /></PrivateLayout>} />

          <Route path="/dues" element={<PrivateLayout><Dues /></PrivateLayout>} />

          <Route path="/baraat-bookings" element={<PrivateLayout><BaraatBookings /></PrivateLayout>} />

          <Route path="/outstation-bookings" element={<PrivateLayout><OutstationBookings /></PrivateLayout>} />

          <Route path="/sharing/routes" element={<PrivateLayout><SharingRoutes /></PrivateLayout>} />

          <Route path="/sharing/points" element={<PrivateLayout><SharingPoints /></PrivateLayout>} />

          <Route path="/sharing/fares" element={<PrivateLayout><SharingFares /></PrivateLayout>} />

          <Route path="/broadcasts" element={<PrivateLayout><Broadcasts /></PrivateLayout>} />

          <Route path="/feedback" element={<PrivateLayout><Feedback /></PrivateLayout>} />

          <Route path="/settings" element={<PrivateLayout><Settings /></PrivateLayout>} />

        </Routes>

      </BrowserRouter>

    </AuthProvider>

  );

}



export default App;

