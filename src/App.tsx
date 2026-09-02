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
import SchedulePickups from './pages/SchedulePickups';



import { useState } from 'react';

function PrivateLayout({ children }: { children: React.ReactNode }) {

  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (

    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">

      {/* Mobile Sticky Topbar */}
      <div className="lg:hidden sticky top-0 z-30 bg-gray-950 text-white px-4 py-3 flex items-center justify-between border-b border-gray-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
            <span className="font-bold text-white text-base leading-none">C</span>
          </div>
          <h1 className="text-lg font-bold tracking-wide">ChaloJi <span className="text-emerald-400 font-medium">Admin</span></h1>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 focus:outline-none transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={closeMenu}
        />
      )}

      {/* Premium Sidebar (Responsive Drawer) */}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-gradient-to-b from-gray-900 to-gray-950 text-white min-h-screen p-6 shadow-2xl lg:shadow-[4px_0_24px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col overflow-y-auto custom-scrollbar`}
      >

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800/50">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <span className="font-bold text-white text-lg leading-none">C</span>
            </div>

            <h1 className="text-xl font-bold tracking-wide">ChaloJi <span className="text-emerald-400 font-medium">Admin</span></h1>
          </div>

          <button
            onClick={closeMenu}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            ✕
          </button>

        </div>

        

        <nav className="flex flex-col gap-1.5 flex-1">

          <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">❖</span> Dashboard

          </Link>

          <Link to="/drivers" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">🚗</span> Drivers Details

          </Link>

          <Link to="/radar" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">🌍</span> Live Radar Map

          </Link>

          <Link to="/users" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">👥</span> Passengers

          </Link>

          <Link to="/rides" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">📍</span> Live Rides

          </Link>

          <Link to="/revenue" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">📈</span> Revenue & GMV

          </Link>

          <Link to="/dues" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">💸</span> Pending Dues

          </Link>

          <Link to="/baraat-bookings" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">🥁</span> Baraat Bookings

          </Link>

          <Link to="/outstation-bookings" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">✈️</span> Outstation Rides

          </Link>

          <Link to="/schedule-pickups" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">🗓️</span> Schedule Pickups

          </Link>

          

          <div className="h-px bg-white/10 my-2 mx-4"></div>

          <div className="px-4 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1">
            ChaloJi Sharing
          </div>

          <Link to="/sharing/routes" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">
            <span className="text-emerald-400 group-hover:text-emerald-300">🛺</span> Routes
          </Link>

          <Link to="/sharing/points" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">
            <span className="text-emerald-400 group-hover:text-emerald-300">📍</span> Pickup Points
          </Link>

          <Link to="/sharing/fares" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">
            <span className="text-emerald-400 group-hover:text-emerald-300">💰</span> Fixed Fares
          </Link>

          <div className="h-px bg-white/10 my-2 mx-4"></div>

          <Link to="/broadcasts" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">📢</span> Broadcasts

          </Link>

          <Link to="/feedback" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">💬</span> Feedback

          </Link>

          <Link to="/settings" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-medium transition-all group text-sm">

            <span className="text-emerald-400 group-hover:text-emerald-300">⚙️</span> Settings

          </Link>

        </nav>

        

        <button 

          onClick={() => {
            closeMenu();
            logout();
          }} 

          className="mt-6 w-full p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all font-medium border border-red-500/20 shadow-sm text-sm"

        >

          Logout Account

        </button>

      </aside>

      

      {/* Main Content Area */}

      <div className="flex-1 min-h-[calc(100vh-57px)] lg:min-h-screen overflow-y-auto bg-[#F8FAFC]">

        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">

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

          <Route path="/schedule-pickups" element={<PrivateLayout><SchedulePickups /></PrivateLayout>} />

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

