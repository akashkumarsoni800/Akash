import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import { ShieldCheck, User, BookOpen, GraduationCap, MapPin, Search, AlertCircle, RefreshCw, Star, Zap } from 'lucide-react';

const VerifyStudent = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error("Student ID is missing");

        const { data, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Student verification failed. Record not found.");

        setStudent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-8"
        >
          <RefreshCw size={64} className="text-purple-600 opacity-20" />
        </motion.div>
        <p className="text-slate-400 font-black text-xs tracking-widest uppercase animate-pulse">
          Authenticating Student Pulse...
        </p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-8 shadow-inner">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Verification Failed</h1>
        <p className="text-slate-400 max-w-md mx-auto font-medium leading-relaxed mb-12">
          {error || "The student ID provided does not match any record in our secure database."}
        </p>
        <Link 
          to="/" 
          className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-purple-600 transition-all shadow-2xl active:scale-95"
        >
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-10 font-inter overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -ml-48 -mb-48 pointer-events-none" />

      <div className="max-w-xl mx-auto space-y-8 relative z-10">
        {/* Header Verification Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">Verified Institution Member</span>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-500/5 border border-slate-100 overflow-hidden"
        >
          {/* Top Banner Part */}
          <div className="h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="px-8 pb-12 -mt-16 flex flex-col items-center">
            {/* Photo Section */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl relative z-10 overflow-hidden border border-slate-50 transition-transform duration-700 hover:scale-105">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover rounded-[2rem]" />
                ) : (
                  <div className="w-full h-full bg-slate-50 rounded-[2rem] flex items-center justify-center">
                    <User size={64} className="text-slate-200" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl z-20 border-4 border-white animate-bounce-slow">
                <Star size={20} fill="currentColor" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="mt-8 text-center space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                {student.full_name}
              </h1>
              <p className="text-slate-400 font-black text-[10px] tracking-widest uppercase">
                Student Internal ID: {student.student_id}
              </p>
            </div>

            {/* Details Grid */}
            <div className="w-full mt-12 grid grid-cols-1 gap-4">
              <DetailRow icon={BookOpen} label="Academic Grade" value={`Class ${student.class_name}`} accent="purple" />
              <DetailRow icon={GraduationCap} label="Registry Node" value={`Roll No #${student.roll_no}`} accent="indigo" />
              <DetailRow icon={User} label="Primary Guardian" value={student.father_name} accent="slate" />
              {student.address && <DetailRow icon={MapPin} label="Residential Zone" value={student.address} accent="rose" />}
            </div>

            {/* School Signature */}
            <div className="mt-12 w-full pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center p-2 opacity-40">
                  <img src="/logo.png" alt="Logo" className="grayscale" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase leading-none">
                    {localStorage.getItem('current_school_name') || 'Adarsh Shishu Mandir'}
                  </p>
                  <p className="text-[8px] font-black text-slate-300 tracking-widest uppercase mt-1">
                    Certified Digital Registry
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <div className="flex justify-center pt-8 border-t border-slate-100/50">
          <p className="text-slate-400 font-black text-[9px] tracking-[0.2em] uppercase flex items-center gap-4">
            <Zap size={14} className="text-purple-500" />
            Powered by Paid School Hub v4.2
          </p>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value, accent }: any) => {
  const accents: any = {
    purple: 'text-purple-600 bg-purple-50/50',
    indigo: 'text-indigo-600 bg-indigo-50/50',
    slate: 'text-slate-600 bg-slate-50/50',
    rose: 'text-rose-600 bg-rose-50/50'
  };

  return (
    <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50/30 border border-slate-100 hover:border-purple-100 transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm ${accents[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-lg font-black text-slate-900 leading-none">{value || 'Not Disclosed'}</p>
      </div>
    </div>
  );
};

export default VerifyStudent;
