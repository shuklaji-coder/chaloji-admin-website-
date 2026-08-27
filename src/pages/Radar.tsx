import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DriverLocation {
  id: string;
  name?: string;
  phone?: string;
  vehicleType?: string;
  location?: { latitude: number; longitude: number };
}

export default function Radar() {
  const [activeDrivers, setActiveDrivers] = useState<DriverLocation[]>([]);

  useEffect(() => {
    // Real-time listener for online drivers
    const q = query(
      collection(db, 'drivers'),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const driversData: DriverLocation[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.location && data.location.latitude && data.location.longitude) {
           driversData.push({ id: doc.id, ...data } as DriverLocation);
        }
      });
      setActiveDrivers(driversData);
    });

    return () => unsubscribe();
  }, []);

  // Use a neat cab emoji icon for the map
  const cabIcon = L.divIcon({
    html: `<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); margin-top: -13px; margin-left: -13px;">🚕</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)] animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Live Map Radar</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Real-time God's Eye view of your active fleet.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
           <div className="flex relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
           </div>
           <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-100 shadow-xs">
             {activeDrivers.length} Drivers Online
           </span>
        </div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative z-0">
        <MapContainer 
          center={[28.6139, 77.2090]} // Delhi center
          zoom={12} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          {/* Using a beautiful light basemap -> Carto Voyager */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          {activeDrivers.map(d => (
            d.location && (
              <Marker 
                key={d.id} 
                position={[d.location.latitude, d.location.longitude]} 
                icon={cabIcon}
              >
                <Popup className="rounded-2xl border-0 shadow-lg">
                  <div className="p-1 min-w-[140px] text-center">
                    <p className="font-black text-gray-900 mb-0.5 text-base">{d.name || 'Driver'}</p>
                    <p className="text-xs text-gray-500 mb-3 font-medium">{d.phone || 'No phone'}</p>
                    <span className="inline-block bg-gray-100 uppercase tracking-widest text-[9px] font-black px-3 py-1.5 rounded-lg text-gray-600 capitalize">
                      {d.vehicleType || 'Vehicle'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
