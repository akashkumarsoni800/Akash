import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import { 
  Bell, Calendar, ChevronLeft, 
  RefreshCw, Megaphone, Clock
} from 'lucide-react';

const StudentNotices = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (data) setNotices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
       <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4"/>
       <p className="font-black uppercase tracking-widest text-gray-400 italic text-sm">Syncing News Feed...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm text-indigo-600 font-black text-[10px] uppercase mb-10 border border-indigo-50 tracking-widest hover:shadow-md transition-all">
        <ChevronLeft size={16}/> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-block bg-rose-50 px-4 py-1.5 rounded-full text-[9px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2">Bulletin Board</div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 italic uppercase tracking-tighter leading-none">Latest Notices</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.4em]">Adarsh Shishu Mandir - Announcements</p>
        </div>

        <div className="space-y-6">
          {notices.map((notice, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-xl border border-gray-100 relative overflow-hidden group hover:border-rose-100 transition-all duration-500">
               <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Megaphone size={200} className="-rotate-12" />
               </div>
               
               <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 self-start shadow-inner">
                     <Bell size={32} className="animate-bounce" />
                  </div>
                  
                  <div className="flex-1 space-y-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 italic uppercase tracking-tighter leading-tight">{notice.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap bg-gray-50 px-4 py-2 rounded-xl">
                           <Clock size={14} className="text-rose-500" /> {new Date(notice.created_at || notice.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                     </div>
                     
                     <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed border-l-4 border-rose-100 pl-6 py-2">
                        {notice.description}
                     </p>
                  </div>
               </div>
            </div>
          ))}

          {notices.length === 0 && (
            <div className="py-24 text-center bg-white rounded-[4rem] border-4 border-dashed border-gray-100 shadow-inner">
               <div className="text-6xl mb-6 grayscale opacity-30">📭</div>
               <p className="text-gray-400 font-black uppercase tracking-widest text-lg italic">The board is clear today.</p>
               <p className="text-gray-300 font-bold text-[10px] uppercase mt-2 tracking-widest">Check back later for important school updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentNotices;
