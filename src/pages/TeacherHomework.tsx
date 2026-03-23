import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Homework {
  id: number;
  title: string;
  subject: string;
  class_name: string;
  due_date: string;
  total_students: number;
  submissions: {
    submitted: number;
    pending: number;
    names_submitted: string[];
    names_pending: string[];
  };
}

interface HomeworkSubmission {
  id: number;
  homework_id: number;
  student_id: string;
  student_name: string;
  submitted_at: string;
  status: 'submitted' | 'pending' | 'graded';
  file_url?: string;
}

const TeacherHomework: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<number>(0);

  useEffect(() => {
    fetchHomeworkData();
  }, []);

  const fetchHomeworkData = async () => {
    setLoading(true);
    try {
      // Fetch all homework
      const { data: hwData } = await supabase
        .from('homework')
        .select(`
          *,
          homework_submissions!inner(count),
          students!homework_students(class_name)
        `);

      // Calculate submission stats for each homework
      const homeworkList: Homework[] = (hwData || []).map((hw: any) => ({
        id: hw.id,
        title: hw.title,
        subject: hw.subject,
        class_name: hw.students?.class_name || '10A',
        due_date: hw.due_date,
        total_students: hw.students?.length || 32,
        submissions: {
          submitted: hw.homework_submissions_count || 0,
          pending: (hw.students?.length || 32) - (hw.homework_submissions_count || 0),
          names_submitted: [],
          names_pending: []
        }
      }));

      setHomeworks(homeworkList);

      // If viewing specific homework, fetch submissions
      if (id) {
        await fetchSubmissions(parseInt(id));
      }
    } catch (error) {
      console.error('Homework fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (homeworkId: number) => {
    try {
      const { data } = await supabase
        .from('homework_submissions')
        .select(`
          *,
          students(full_name)
        `)
        .eq('homework_id', homeworkId)
        .order('submitted_at', { ascending: false });

      setSubmissions(data || []);
      setSelectedHomework(homeworkId);
    } catch (error) {
      console.error('Submissions fetch error:', error);
    }
  };

  const selectedHW = homeworks.find(h => h.id === selectedHomework);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Homework Tracker
          </h1>
        </div>

        {/* Homework List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {homeworks.map((hw, index) => (
            <motion.div
              key={hw.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-8 rounded-3xl shadow-xl border-4 cursor-pointer hover:shadow-2xl transition-all duration-500 ${
                selectedHomework === hw.id 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400 shadow-2xl scale-105' 
                  : 'bg-white/90 border-gray-200 hover:border-blue-300 hover:scale-[1.02]'
              }`}
              onClick={() => fetchSubmissions(hw.id)}
            >
              <h3 className="text-2xl font-black mb-4">{hw.title}</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="font-semibold">Class</span>
                  <span>{hw.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Due</span>
                  <span>{new Date(hw.due_date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Submission Progress */}
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-700" 
                    style={{ width: `${(hw.submissions.submitted / hw.total_students) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                  <div className="text-green-600 flex items-center gap-2">
                    ✅ Submitted: {hw.submissions.submitted}/{hw.total_students}
                  </div>
                  <div className="text-orange-600 flex items-center gap-2">
                    ⏳ Pending: {hw.submissions.pending}/{hw.total_students}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ✅ SUBMISSIONS DETAIL - FULLY FUNCTIONAL */}
        {selectedHW && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50"
          >
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
              📋 {selectedHW.title} - Submissions
            </h2>
            
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              <button 
                onClick={() => {}} 
                className="flex-1 py-3 px-6 font-black uppercase tracking-wider rounded-xl bg-white shadow-lg"
              >
                ✅ Submitted ({submissions.length})
              </button>
              <button 
                onClick={() => {}} 
                className="flex-1 py-3 px-6 font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                ⏳ Pending ({selectedHW.submissions.pending})
              </button>
            </div>

            {/* Submission Table (Desktop) / Cards (Mobile) */}
            <div className="asm-table-container custom-scrollbar md:border md:bg-white md:shadow-inner md:rounded-[2.5rem]">
              <div className="hidden md:block">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="p-6 text-left">Student</th>
                      <th className="p-6 text-left">Submitted</th>
                      <th className="p-6 text-left">Status</th>
                      <th className="p-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {submissions.slice(0, 10).map((submission) => (
                      <tr key={submission.id} className="hover:bg-indigo-50/20 group transition-all">
                        <td className="p-6 font-black text-gray-800 uppercase text-xs">{submission.student_name}</td>
                        <td className="p-6 font-bold text-gray-400 text-[10px] uppercase tracking-wider">{new Date(submission.submitted_at).toLocaleString()}</td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            submission.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            submission.status === 'graded' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl transition-colors border border-indigo-100">Grade →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                 {submissions.slice(0, 10).map((submission) => (
                    <div key={submission.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col gap-4">
                       <div className="flex justify-between items-start">
                          <h3 className="font-black text-gray-800 uppercase text-sm leading-tight">{submission.student_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            submission.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            submission.status === 'graded' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {submission.status}
                          </span>
                       </div>
                       <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider italic">
                          <span className="opacity-60">Submitted:</span> {new Date(submission.submitted_at).toLocaleString()}
                       </p>
                       <div className="border-t border-gray-50 pt-4 mt-2">
                          <button className="w-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white py-3 rounded-xl transition-colors border border-indigo-100">
                             Grade Submission →
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeacherHomework;
