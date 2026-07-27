import { useEffect, useState } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  target: string;
}

export default function Broadcasts() {
  const [history, setHistory] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'drivers' // 'all', 'drivers', 'passengers'
  });

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
       const docs = snap.docs.map(d => ({id: d.id, ...d.data()} as BroadcastMessage));
       setHistory(docs);
       setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return alert("Fill in the fields!");
    setSending(true);
    
    try {
      await addDoc(collection(db, 'announcements'), {
        ...form,
        createdAt: new Date(),
      });
      setForm({ title: '', message: '', target: 'drivers' });
      alert("Broadcast sent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col xl:flex-row gap-8">
      
      {/* Left Column: Form */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Push Broadcasts</h1>
          <p className="text-gray-500 mt-1">Send emergency alerts, surge pricing info, or news to all devices.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100/60 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          
          <form onSubmit={handleSend} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Alert Title</label>
              <input 
                type="text" 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. 🌧️ Heavy Rain Warning!"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Broadcast Message</label>
              <textarea 
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                placeholder="Type the message that will pop up on screens..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
              <div className="flex gap-4">
                 {['drivers', 'passengers', 'all'].map(t => (
                   <label key={t} className={`flex-1 cursor-pointer flex items-center justify-center p-4 border rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${form.target === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                     <input type="radio" name="target" value={t} checked={form.target === t} onChange={() => setForm({...form, target: t})} className="hidden" />
                     {t}
                   </label>
                 ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-600/30 hover:opacity-90 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
            >
              {sending ? 'Sending Signal...' : 'Send Broadcast Now'} 🚀
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Broadcast History */}
      <div className="flex-[0.8] xl:bg-white xl:rounded-3xl xl:shadow-[0_8px_30px_rgb(0,0,0,0.04)] xl:border xl:border-gray-100/60 xl:p-8 flex flex-col max-h-[85vh]">
         <h3 className="text-lg font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
            History Log <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
         </h3>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {loading ? (
              <p className="text-sm text-gray-400 font-medium animate-pulse">Loading broadcast history...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">No broadcasts sent yet.</p>
            ) : (
              history.map(b => (
                <div key={b.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:bg-indigo-50/30 transition-colors cursor-default">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{b.target}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString() : ''}</span>
                   </div>
                   <h4 className="font-bold text-gray-900 text-base mb-1">{b.title}</h4>
                   <p className="text-gray-600 text-sm font-medium leading-relaxed">{b.message}</p>
                </div>
              ))
            )}
         </div>
      </div>

    </div>
  );
}
