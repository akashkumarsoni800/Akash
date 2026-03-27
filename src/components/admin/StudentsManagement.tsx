import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  Users, Search, GraduationCap, 
  Trash2, Mail, Phone, Edit2, 
  MoreVertical, ChevronRight, 
  RefreshCw, Filter, CheckCircle2,
  Calendar, ShieldCheck, UserCheck, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useGetAllApprovedStudents, useDeleteStudent } from '../../hooks/useQueries';

export default function StudentsManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState<string[]>(['All']);

  // ✅ React Query Hooks for Persistence & Offline Support
  const { data: studentsData = [], isLoading } = useGetAllApprovedStudents();
  const { mutate: deleteStudent } = useDeleteStudent();

  const handleDelete = async (studentId: string) => {
    if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    deleteStudent(studentId as any);
  };

  const handleEdit = (studentId: string) => {
    navigate(`/admin/edit-student/${studentId}`);
  };

  const handleViewProfile = (studentId: string) => {
    navigate(`/admin/student/${studentId}`);
  };

  // Extract unique classes for filter
  useEffect(() => {
    if (studentsData.length > 0) {
      const uniqueClasses = ['All', ...new Set(studentsData.map((s: any) => s.class_name))];
      setClasses(uniqueClasses as string[]);
    }
  }, [studentsData]);

  const filteredStudents = studentsData.filter((s: any) => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || s.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-8">

      {/* --- TOP BAR & FILTERS --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1 text-left">
          <h3 className="text-2xl font-black text-slate-900  leading-none uppercase">Student List</h3>
          <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1">Manage all student records</p>
        </div>
    
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group/search flex-1 md:w-80">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input text-sm pl-16 py-4"
            />
          </div>
          <div className="relative md:w-48">
            <Filter className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="premium-input text-[10px] pl-14 py-4 appearance-none text-slate-500"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* --- STUDENT LIST --- */}
      <div className="premium-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 ">
                <th className="px-10 py-6">Roll No</th>
                <th className="px-10 py-6">Student Name</th>
                <th className="px-10 py-6 text-center">Class</th>
                <th className="px-10 py-6">Father's Name</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((s: any, idx: number) => (
                <motion.tr 
                  key={s.student_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50/50 transition-all group"
                >
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-blue-200 transition-colors ">#{idx + 1}</span>
                      <p className="text-sm font-black text-blue-600 ">{s.roll_no}</p>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[5px] bg-slate-900 overflow-hidden border-2 border-white shadow-sm shrink-0">
                        <img src={s.photo_url || `https://ui-avatars.com/api/?name=${s.full_name}&background=0f172a&color=fff`} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-slate-900 tracking-tight leading-none truncate max-w-[150px]">{s.full_name}</p>
                        <p className="text-[10px] font-black text-slate-400 lowercase tracking-tight">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5 text-center">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-[5px] text-[10px] font-black  border border-slate-50">{s.class_name}</span>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-3">
                      <UserCheck size={14} className="text-slate-200" />
                      <p className="text-[11px] font-black text-slate-400 tracking-tight truncate max-w-[120px]">{s.father_name}</p>
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleViewProfile(s.student_id)}
                        title="View Profile"
                        className="p-2.5 bg-emerald-50 text-emerald-600 rounded-[5px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm shadow-emerald-50"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleEdit(s.student_id)}
                        title="Edit Student"
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-[5px] hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-50"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.student_id)}
                        title="Delete Student"
                        className="p-2.5 bg-rose-50 text-rose-500 rounded-[5px] hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button className="p-2.5 bg-slate-50 text-slate-400 rounded-[5px] hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && !isLoading && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <GraduationCap size={40} />
            </div>
            <p className="text-[10px] font-black text-slate-300  mb-2">No student records found</p>
            <p className="text-[9px] font-black text-slate-200 tracking-widest leading-relaxed">Try adjusting your filters or search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
