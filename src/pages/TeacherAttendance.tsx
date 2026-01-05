import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const TeacherAttendance = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // आज की तारीख ऑटो-रिफ्रेश (Mobile Style)
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: stdList } = await supabase.from('students').select('*').eq('is_approved', 'approved');
    if (stdList) {
      setStudents(stdList);
      // सबको 'P' (Present) डिफ़ॉल्ट सेट करें
      const initial: any = {};
      stdList.forEach(s => initial[s.id] = 'P');
      setAttendance(initial);
    }
    setLoading(false);
  };

  const toggle = (id: any) => {
    setAttendance((prev: any) => ({ ...prev, [id]: prev[id] === 'P' ? 'A' : 'P' }));
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      const records = Object.entries(attendance).map(([id, status]) => ({
        student_id: id,
        date: today,
        status: status
      }));

      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id, date' });
      if (error) throw error;
      toast.success(`Attendance for ${today} submitted!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <DashboardHeader userName="Teacher" userRole="Attendance" />
      <div className="pt-24 px-4 max-w-2xl mx-auto">
        <div className="bg-blue-900 p-6 rounded-3xl text-white mb-6 flex justify-between items-center shadow-xl">
          <div>
            <h1 className="text-xl font-black uppercase">Daily Attendance</h1>
            <p className="font-bold opacity-80 italic">Date: {today}</p>
          </div>
          <button onClick={submitAttendance} disabled={loading} className="bg-white text-blue-900 px-6 py-2 rounded-xl font-black shadow-lg">
            {loading ? '...' : 'SAVE'}
          </button>
        </div>

        <div className="space-y-3">
          {students.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-gray-100">
              <div>
                <p className="font-black text-gray-800">{s.full_name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Class: {s.class_name}</p>
              </div>
              <button 
                onClick={() => toggle(s.id)}
                className={`w-14 h-14 rounded-2xl font-black text-xl transition-all shadow-md ${
                  attendance[s.id] === 'P' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {attendance[s.id]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
