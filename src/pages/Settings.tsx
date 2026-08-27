import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    commissionPercent: 5,
    autoRate: 15,
    miniRate: 20,
    bikeRate: 10,
    platformFee: 5
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        setSettings(snap.data() as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      alert("Platform settings updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center flex-col gap-4 items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        <p className="text-gray-400 font-medium text-sm animate-pulse">Loading core system settings...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Global Settings</h1>
        <p className="text-gray-500 mt-1 text-xs sm:text-sm">Control your ride pricing and commission rate remotely.</p>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-4 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
          
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Revenue Model (Platform Level)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Driver Commission Cut (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.commissionPercent}
                    onChange={e => setSettings({...settings, commissionPercent: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    min="0" max="100"
                  />
                  <span className="absolute right-4 top-3 text-gray-400 font-bold text-xs sm:text-sm">%</span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5">Percentage deducted from driver earnings per ride.</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Fixed Platform Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 font-bold text-xs sm:text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.platformFee}
                    onChange={e => setSettings({...settings, platformFee: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                 <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5">Fixed gateway/booking fee charged to passengers.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Rate Controller (Per KM Fare)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Bike Rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 font-bold text-xs sm:text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.bikeRate}
                    onChange={e => setSettings({...settings, bikeRate: Number(e.target.value)})}
                    className="w-full bg-blue-50 border border-blue-100 rounded-xl pl-8 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Auto Rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 font-bold text-xs sm:text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.autoRate}
                    onChange={e => setSettings({...settings, autoRate: Number(e.target.value)})}
                    className="w-full bg-amber-50 border border-amber-100 rounded-xl pl-8 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Mini Rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 font-bold text-xs sm:text-sm">₹</span>
                  <input 
                    type="number" 
                    value={settings.miniRate}
                    onChange={e => setSettings({...settings, miniRate: Number(e.target.value)})}
                    className="w-full bg-indigo-50 border border-indigo-100 rounded-xl pl-8 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-black"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-rose-50 p-3 sm:p-4 border border-rose-100 rounded-xl flex items-start gap-2.5">
               <span className="text-lg sm:text-xl">⚠️</span>
               <p className="text-[11px] sm:text-xs text-rose-800 font-medium">Warning: Saving new pricing immediately affects all rides requested via the passenger application after saving. Rides currently searching or ongoing will not be affected.</p>
            </div>
          </div>

          <div className="pt-2 sm:pt-4 flex justify-end">
             <button 
               type="submit"
               disabled={saving}
               className="w-full sm:w-auto bg-gray-900 text-white px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {saving ? 'Saving to Cloud...' : 'Upload & Save Changes'} ☁️
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}
