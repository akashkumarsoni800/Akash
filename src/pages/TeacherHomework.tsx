import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// --- TypeScript Interfaces ---
interface Homework {
  id: number;
  title: string;
  subject: string;
  className: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue' | 'graded';
  submissions: number;
  totalStudents: number;
  fileUrl?: string;
}

interface HomeworkFormData {
  title: string;
  description: string;
  dueDate: string;
  file: File | null;
  subject: string;
  className: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  subject: string;
}

// --- Homework Modal Component ---
const HomeworkModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HomeworkFormData) => Promise<void>;
  subject: string;
  className: string;
}> = ({ isOpen, onClose, onSubmit, subject, className }) => {
  const [formData, setFormData] = useState<HomeworkFormData>({
    title: '',
    description: '',
    dueDate: '',
    file: null,
    subject,
    className
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
          Assign New Homework
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-lg font-semibold transition-all duration-300"
              placeholder="e.g., Math Worksheet Chapter 5"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 resize-vertical text-base font-medium transition-all duration-300"
              placeholder="Detailed instructions for students..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 text-lg font-semibold transition-all duration-300"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Attachment
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all duration-300"
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black uppercase tracking-widest rounded-2xl transition-all duration-300 hover:shadow-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Homework'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: Homework['status']; count?: number }> = ({ status, count }) => {
  const badges: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    submitted: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    graded: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border-2 ${badges[status]} flex items-center gap-2 shadow-sm`}>
      {status === 'submitted' && '✅'}
      {status === 'graded' && '⭐'}
      {status === 'overdue' && '⏰'}
      {count !== undefined && count > 0 && `${count}`}
    </div>
  );
};

// --- Main Component ---
const TeacherHomework: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('10A');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user.email)
        .single();

      setTeacher(teacherData);

      // Mock data - Replace with actual Supabase query
      const mockHomeworks: Homework[] = [
        {
          id: 1,
          title: 'Math Assignment - Quadratic Equations',
          subject: 'Mathematics',
          className: '10A',
          dueDate: '2026-02-12T18:00:00',
          status: 'pending' as const,
          submissions: 18,
          totalStudents: 32
        },
        {
          id: 2,
          title: 'Science Worksheet - Photosynthesis',
          subject: 'Science',
          className: '10A',
          dueDate: '2026-02-10T17:00:00',
          status: 'overdue' as const,
          submissions: 25,
          totalStudents: 32
        },
        {
          id: 3,
          title: 'English Essay - My Favorite Book',
          subject: 'English',
          className: '10A',
          dueDate: '2026-02-15T20:00:00',
          status: 'pending' as const,
          submissions: 12,
          totalStudents: 32
        },
        {
          id: 4,
          title: 'Physics Numericals - Motion',
          subject: 'Physics',
          className: '10B',
          dueDate: '2026-02-11T16:00:00',
          status: 'submitted' as const,
          submissions: 28,
          totalStudents: 35
        }
      ];

      setHomeworks(mockHomeworks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignHomework = async (homeworkData: HomeworkFormData) => {
    const newHomework: Homework = {
      ...homeworkData,
      id: Date.now(),
      status: 'pending' as const,
      submissions: 0,
      totalStudents: 32
    };
    
    setHomeworks([newHomework, ...homeworks]);
  };

  const getStatus = (dueDate: string): Homework['status'] => {
    const now = new Date();
    const due = new Date(dueDate);
    if (now > due) return 'overdue';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  const filteredHomeworks = homeworks.filter(hw => hw.className === selectedClass);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Homework Portal
          </h1>
          <p className="text-xl text-gray-600 font-semibold max-w-2xl mx-auto leading-relaxed">
            Assign, track, and grade homework for your classes with real-time updates
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-3xl font-black text-gray-900">{homeworks.length}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Total Assigned</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="text-3xl mb-2">⏰</div>
            <h3 className="text-3xl font-black text-orange-600">
              {homeworks.filter(h => getStatus(h.dueDate) === 'overdue').length}
            </h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Overdue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-3xl font-black text-green-600">
              {homeworks.filter(h => h.status === 'submitted').length}
            </h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Submitted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-3xl font-black text-purple-600">
              {Math.round(
                homeworks.reduce((acc, h) => acc + (h.submissions / h.totalStudents * 100), 0) / 
                homeworks.length || 0
              )}%
            </h3>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Avg Submission</p>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 mb-12 items-center justify-between bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50"
        >
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setShowModal(true)}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 hover:scale-[1.02]"
            >
              <span className="text-xl group-hover:animate-bounce">➕</span>
              Assign New Homework
            </button>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
            >
              <option value="10A">Class 10A</option>
              <option value="10B">Class 10B</option>
              <option value="11A">Class 11A</option>
              <option value="12A">Class 12A</option>
            </select>
          </div>
          
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            ← Back to Dashboard
          </button>
        </motion.div>

        {/* Homework List */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredHomeworks.map((homework, index) => (
              <motion.div
                key={homework.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer hover:bg-white"
                onClick={() => navigate(`/teacher/homework/${homework.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-purple-600 transition-colors mb-2 uppercase tracking-tight">
                      {homework.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <StatusBadge status={homework.status} count={homework.submissions} />
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 rounded-2xl text-sm font-bold uppercase tracking-wide border border-blue-200">
                        📚 {homework.subject}
                      </div>
                      <div className="px-4 py-2 bg-green-100 text-green-800 rounded-2xl text-sm font-bold uppercase tracking-wide border border-green-200">
                        👥 {homework.className}
                      </div>
                    </div>
                    <p className="text-gray-600 font-medium text-lg">
                      Due: {new Date(homework.dueDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-4 md:ml-auto">
                    <div className="text-right">
                      <div className="text-3xl font-black text-gray-400 group-hover:text-purple-500 transition-all duration-500">
                        {Math.round((homework.submissions / homework.totalStudents) * 100)}%
                      </div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide font-bold">Submitted</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Modal */}
        <HomeworkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={assignHomework}
          subject={teacher?.subject || 'Mathematics'}
          className={selectedClass}
        />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default TeacherHomework;
