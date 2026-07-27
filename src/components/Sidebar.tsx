import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/drivers', label: 'Drivers', icon: '🚗' },
  { to: '/rides', label: 'Rides', icon: '🛺' },
  { to: '/users', label: 'Passengers', icon: '👤' },
  { to: '/promo-codes', label: 'Promo Codes', icon: '🏷️' },
  { to: '/settlements', label: 'Settlements', icon: '💰' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-emerald-900 text-white min-h-screen flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-64 lg:w-64`}>
      <div className="p-5 border-b border-emerald-700">
        <h1 className="text-xl font-bold tracking-tight">ChaloJi Admin</h1>
        <p className="text-emerald-300 text-xs mt-1">Control Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={() => onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
              }`
            }
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-emerald-700">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
