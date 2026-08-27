import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  message: string;
  createdAt: any;
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackItem)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">User Feedback</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">User suggestions, complaints, and general feedback.</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 font-semibold bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-gray-100 shadow-xs self-start sm:self-auto">
          Total: {feedbacks.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-8 sm:p-16 text-center">
          <span className="text-4xl sm:text-5xl block mb-4">💬</span>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Feedback Yet</h3>
          <p className="text-gray-400 font-medium text-xs sm:text-sm">User feedback will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 overflow-x-auto custom-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left p-3 sm:p-4 pl-4 sm:pl-6 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">User</th>
                <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Phone</th>
                <th className="text-left p-3 sm:p-4 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Feedback</th>
                <th className="text-right p-3 sm:p-4 pr-4 sm:pr-6 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {feedbacks.map(fb => (
                <tr
                  key={fb.id}
                  className="hover:bg-emerald-50/30 transition-colors cursor-pointer text-xs sm:text-sm"
                  onClick={() => setExpanded(expanded === fb.id ? null : fb.id)}
                >
                  <td className="p-3 sm:p-4 pl-4 sm:pl-6">
                    <span className="font-bold text-gray-800">{fb.userName}</span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className="text-gray-500 font-medium">{fb.userPhone || '—'}</span>
                  </td>
                  <td className="p-3 sm:p-4 max-w-xs">
                    <p className={`text-gray-700 font-medium ${expanded !== fb.id ? 'truncate' : ''}`}>
                      {fb.message}
                    </p>
                  </td>
                  <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-right">
                    <span className="text-gray-400 text-[10px] sm:text-xs font-semibold">
                      {fb.createdAt?.toDate
                        ? fb.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}