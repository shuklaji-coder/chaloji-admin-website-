import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DriverDoc {
  id: string;
  name?: string;
  phone?: string;
  vehicleType?: string;
  vehicle?: string;
  plateText?: string;
  isOnline?: boolean;
  verificationStatus?: string;
  accountStatus?: string;
  location?: any;
  currentLocation?: any;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  updatedAt?: any;
}

interface DriverLocationData {
  latitude: number;
  longitude: number;
  updatedAt?: any;
}

// Helper to extract coordinates safely from various schemas
function extractCoordinates(data: any): { lat: number; lng: number } | null {
  if (!data) return null;

  // 1. Nested location object with latitude/longitude
  if (typeof data.location?.latitude === 'number' && typeof data.location?.longitude === 'number') {
    return { lat: data.location.latitude, lng: data.location.longitude };
  }
  // 2. Nested location object with lat/lng
  if (typeof data.location?.lat === 'number' && typeof data.location?.lng === 'number') {
    return { lat: data.location.lat, lng: data.location.lng };
  }
  // 3. Nested currentLocation object
  if (typeof data.currentLocation?.latitude === 'number' && typeof data.currentLocation?.longitude === 'number') {
    return { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude };
  }
  if (typeof data.currentLocation?.lat === 'number' && typeof data.currentLocation?.lng === 'number') {
    return { lat: data.currentLocation.lat, lng: data.currentLocation.lng };
  }
  // 4. Direct fields
  if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    return { lat: data.latitude, lng: data.longitude };
  }
  if (typeof data.lat === 'number' && typeof data.lng === 'number') {
    return { lat: data.lat, lng: data.lng };
  }

  return null;
}

// Component to handle auto-fitting map bounds when driver locations change
function MapAutoFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);

  return null;
}

export default function Radar() {
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [locationMap, setLocationMap] = useState<Record<string, DriverLocationData>>({});
  const [filterOnline, setFilterOnline] = useState<boolean>(true);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  // 1. Real-time listener for drivers collection
  useEffect(() => {
    const unsubscribeDrivers = onSnapshot(
      collection(db, 'drivers'),
      (snap) => {
        const driversList: DriverDoc[] = [];
        snap.forEach((doc) => {
          driversList.push({ id: doc.id, ...doc.data() } as DriverDoc);
        });
        setDrivers(driversList);
      },
      (err) => console.error('[Radar] Drivers subscription error:', err)
    );

    // 2. Real-time listener for separate driverLocations collection
    const unsubscribeLocations = onSnapshot(
      collection(db, 'driverLocations'),
      (snap) => {
        const locMap: Record<string, DriverLocationData> = {};
        snap.forEach((doc) => {
          const coords = extractCoordinates(doc.data());
          if (coords) {
            locMap[doc.id] = {
              latitude: coords.lat,
              longitude: coords.lng,
              updatedAt: doc.data().updatedAt,
            };
          }
        });
        setLocationMap(locMap);
      },
      (err) => console.error('[Radar] DriverLocations subscription error:', err)
    );

    return () => {
      unsubscribeDrivers();
      unsubscribeLocations();
    };
  }, []);

  // Combine driver profile and coordinates
  const mappedDrivers = useMemo(() => {
    return drivers.map((d) => {
      // Direct coordinates or fallback to driverLocations collection
      const directCoords = extractCoordinates(d);
      const separateCoords = locationMap[d.id];
      const coords = directCoords || (separateCoords ? { lat: separateCoords.latitude, lng: separateCoords.longitude } : null);

      return {
        ...d,
        coords,
      };
    });
  }, [drivers, locationMap]);

  // Filter based on online toggle
  const visibleDrivers = useMemo(() => {
    return mappedDrivers.filter((d) => {
      if (!d.coords) return false;
      if (filterOnline) return Boolean(d.isOnline);
      return true;
    });
  }, [mappedDrivers, filterOnline]);

  const activePositions: [number, number][] = useMemo(() => {
    return visibleDrivers
      .filter((d) => d.coords)
      .map((d) => [d.coords!.lat, d.coords!.lng]);
  }, [visibleDrivers]);

  // Vehicle Icon helper
  const getVehicleEmoji = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('auto') || t.includes('rikshaw')) return '🛺';
    if (t.includes('bike') || t.includes('scooter') || t.includes('moto')) return '🛵';
    if (t.includes('suv') || t.includes('xl')) return '🚘';
    return '🚕';
  };

  const createDriverIcon = (driver: DriverDoc) => {
    const emoji = getVehicleEmoji(driver.vehicleType || driver.vehicle);
    const isOnline = Boolean(driver.isOnline);
    const badgeColor = isOnline ? '#10B981' : '#9CA3AF';

    return L.divIcon({
      html: `
        <div style="position: relative; display: inline-block;">
          <div style="
            font-size: 26px;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
            transform: translate(-50%, -50%);
          ">
            ${emoji}
          </div>
          <span style="
            position: absolute;
            top: -16px;
            right: -12px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: ${badgeColor};
            border: 2px solid white;
            box-shadow: 0 0 6px ${badgeColor};
          "></span>
        </div>
      `,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const defaultCenter: [number, number] = [28.6139, 77.2090]; // Default Delhi NCR

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)] animate-in fade-in duration-300">
      
      {/* Top Bar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Live Map Radar</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Real-time telemetry and fleet location mapping.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          {/* Online Toggle */}
          <button
            onClick={() => setFilterOnline(!filterOnline)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 ${
              filterOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${filterOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {filterOnline ? 'Showing Online Only' : 'Showing All Drivers'}
          </button>

          {/* Recenter Button */}
          <button
            onClick={() => setRecenterTrigger((prev) => prev + 1)}
            disabled={activePositions.length === 0}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:text-emerald-700 hover:border-emerald-200 shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            🎯 Recenter Fleet ({visibleDrivers.length})
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative z-0">
        
        {/* Empty state banner overlay if no drivers online */}
        {visibleDrivers.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-xl border border-white/10 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span>📡</span> No active driver coordinates found right now.
            <button onClick={() => setFilterOnline(false)} className="underline font-bold text-emerald-400 hover:text-emerald-300 ml-1">
              Show All Drivers
            </button>
          </div>
        )}

        <MapContainer
          center={activePositions.length > 0 ? activePositions[0] : defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />

          <MapAutoFitter positions={activePositions.length > 0 ? activePositions : []} key={recenterTrigger} />

          {visibleDrivers.map((d) => (
            <Marker
              key={d.id}
              position={[d.coords!.lat, d.coords!.lng]}
              icon={createDriverIcon(d)}
            >
              <Popup className="rounded-2xl border-0 shadow-lg">
                <div className="p-1 min-w-[160px] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${d.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    <p className="font-black text-gray-900 text-base mb-0">{d.name || 'Driver'}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">{d.phone || 'No Phone'}</p>
                  
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="inline-block bg-emerald-50 text-emerald-800 uppercase tracking-widest text-[9px] font-black px-2.5 py-1 rounded-md capitalize border border-emerald-100">
                      {d.vehicleType || d.vehicle || 'Cab'}
                    </span>
                    {d.plateText && (
                      <span className="inline-block bg-gray-100 text-gray-700 uppercase tracking-wider text-[9px] font-bold px-2 py-1 rounded-md">
                        {d.plateText}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
