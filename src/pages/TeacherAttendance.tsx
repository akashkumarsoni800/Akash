import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const TeacherAttendance = () => {
  const [classList, setClassList] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  // 1. Fetch available classes from the student table
  useEffect(() => {
    const getClasses = async () => {
      const { data } = await supabase.from('students').select('class_name');
      if (data) {
        const unique = Array.from(new Set(data.map(s => s.class_name))).filter(Boolean);
        setClassList(unique as string[]);
      }
    };
    getClasses();
  }, []);

  // 2. Fetch students when a class is selected
  useEffect(() => {
    if (selectedClass) {
      const fetchClassStudents = async () => {
        setLoading(true);
        const { data } = await supabase.from('students')
          .select('id, full_name')
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
      fetchClassStudents();
    }
  }, [selectedClass]);

  const toggleStatus = (id: any) => {
    setAttendance((prev: any) => ({ ...prev, [id]: prev[id] === 'P' ? 'A' : 'P' }));
  };

  const saveAttendance = async () => {
    setLoading(true);
    try {
      const records = Object.entries(attendance).map(([id, status]) => ({
        student_id: id,
        date: today,
        status: status,
      }));

      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id, date' });
      if (error) throw error;
      toast.success(`Class ${selectedClass} attendance saved!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-6 px-4">
      {/* Class Selector Dropdown */}
      <div className="bg-white p-6 rounded-3xl shadow-md mb-6 border border-blue-50">
        <label className="block text-xs font-black text-blue-900 uppercase mb-2 tracking-widest">Select Class to Mark Attendance</label>
        <select 
          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Choose Class --</option>
          {classList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {selectedClass && (
        <div className="space-y-4">
          <div className="bg-blue-900 p-6 rounded-3xl text-white flex justify-between items-center shadow-xl">
            <div>
              <h2 className="text-xl font-black uppercase">{selectedClass}</h2>
              <p className="text-xs font-bold opacity-70 italic">{today}</p>
            </div>
            <button onClick={saveAttendance} disabled={loading} className="bg-white text-blue-900 px-8 py-2 rounded-xl font-black hover:bg-gray-100 transition">
              {loading ? 'SAVING...' : 'SUBMIT'}
            </button>
          </div>

          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm">
                <span className="font-bold text-gray-700">{s.full_name}</span>
                <button 
                  onClick={() => toggleStatus(s.id)}
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
      )}
    </div>
  );
};

export default TeacherAttendance;
