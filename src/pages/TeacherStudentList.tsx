import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
  id: string;
  full_name: string;
  email: string;
  roll_number: string;
  class_name: string;
  father_name: string;
  phone: string;
  address: string;
  attendance_rate: number;
  avg_marks: number;
  status: 'active' | 'inactive';
  photo_url?: string;
}

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'marks' | 'attendance'>('name');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    // Mock data - replace with Supabase query
    const mockStudents: Student[] = [
      { id: '1', full_name: 'Rahul Sharma', email: 'rahul@school.com', roll_number: '10A-001', class_name: '10A', father_name: 'Mr. Raj Sharma', phone: '9876543210', address: 'Patna', attendance_rate: 95, avg_marks: 88, status: 'active' },
      { id: '2', full_name: 'Priya Kumari', email: 'priya@school.com', roll_number: '10A-002', class_name: '10A', father_name: 'Mr. Sunil Kumar', phone: '9876543211', address: 'Patna', attendance_rate: 92, avg_marks: 76, status: 'active' },
      // Add more students...
    ];
    setStudents(mockStudents);
    setLoading(false);
  };

  const filteredStudents = students.filter(student => 
    (selectedClass === 'All' || student.class_name === selectedClass) &&
    student.full_name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'marks') return b.avg_marks - a.avg_marks;
    return b.attendance_rate - a.attendance_rate;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-[-0.05em] bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Student Directory
          </h1>
          <p className="text-xl text-gray-600 font-semibold max-w-2xl mx-auto">Manage your students, track performance and attendance</p>
        </motion.div>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 p-6 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50">
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-lg font-semibold"
          />
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500">
            <option>All Classes</option>
            <option>10A</option>
            <option>10B</option>
            <option>11A</option>
            <option>12A</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500">
            <option value="name">Sort by Name</option>
            <option value="marks">Sort by Marks</option>
            <option value="attendance">Sort by Attendance</option>
          </select>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 cursor-pointer"
              onClick={() => navigate(`/teacher/student/${student.id}`)}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl group-hover:scale-110 transition-transform">
                  {student.full_name[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600">{student.full_name}</h3>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">{student.roll_number}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Class</span>
                  <span className="font-black text-lg">{student.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Attendance</span>
                  <span className="font-black text-lg text-green-600">{student.attendance_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Avg Marks</span>
                  <span className="font-black text-lg text-blue-600">{student.avg_marks}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider ${student.status === 'active' ? 'bg-green-100 text-green-800 border-2 border-green-200' : 'bg-gray-100 text-gray-500 border-2 border-gray-200'}`}>
                  {student.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentList;
