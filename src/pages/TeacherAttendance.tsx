import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';

const TeacherAttendance = () => {
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toLocaleDateString('en-CA');

  // 1. Load available classes
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('students').select('class_name');
      if (data) {
        const uniqueClasses = Array.from(new Set(data.map(s => s.class_name))).filter(Boolean);
        setClassList(uniqueClasses as string[]);
      }
    };
    fetchClasses();
  }, []);

  // 2. Load students when class changes
  useEffect(() => {
    if (selectedClass) {
      const fetchStudents = async () => {
        setLoading(true);
        const { data } = await supabase.from('students')
          .select('id, full_name, class_name')
          .eq('class_name', selectedClass)
          .eq('is_approved', 'approved')
          .order('full_name');

        if (data) {
          setStudents(data);
          const initial: any = {};
          data.forEach(s => initial[s.id] = 'P');
          setAttendance(initial);
        }
        setLoading(false);
      };
      fetchStudents();
    }
  }, [selectedClass]);

  const toggle = (id: any) => {
    setAttendance((prev: any) => ({ ...prev, [id]: prev[id] === 'P' ? 'A' : 'P' }));
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      const records = Object.entries(attendance).map(([id, status]) => ({
        student_id: id,
        date: today,
        status: status,
        class_name: selectedClass
      }));

      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id, date' });
      if (error) throw error;
      toast.success(`Attendance for ${selectedClass} submitted!`);
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
        {/* Class Filter Section */}
        <div className="bg-white p-6 rounded-3xl shadow-md mb-6 border border-blue-100">
          <label className="block text-sm font-bold text-blue-900 uppercase mb-2">Select Class</label>
          <select 
            className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Choose a Class --</option>
            {classList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {selectedClass && (
          <>
            <div className="bg-blue-900 p-6 rounded-3xl text-white mb-6 flex justify-between items-center shadow-xl">
              <div>
                <h1 className="text-xl font-black uppercase">Class: {selectedClass}</h1>
                <p className="font-bold opacity-80 italic">{today}</p>
              </div>
              <button onClick={submitAttendance} disabled={loading} className="bg-white text-blue-900 px-6 py-2 rounded-xl font-black">
                {loading ? '...' : 'SAVE'}
              </button>
            </div>

            <div className="space-y-3">
              {students.length === 0 ? <p className="text-center text-gray-500 py-10">No students found in this class.</p> : 
                students.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-gray-100">
                  <span className="font-black text-gray-800">{s.full_name}</span>
                  <button onClick={() => toggle(s.id)} className={`w-14 h-14 rounded-2xl font-black text-xl transition-all ${attendance[s.id] === 'P' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {attendance[s.id]}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
