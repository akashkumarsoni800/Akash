import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- Enhanced Action Card with Animations ---
const ActionCard = ({ icon, title, desc, onClick, color = 'blue', badgeCount = 0 }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 hover:border-blue-500 ring-blue-200',
    green: 'bg-green-50 text-green-600 hover:border-green-500 ring-green-200',
    purple: 'bg-purple-50 text-purple-600 hover:border-purple-500 ring-purple-200',
    orange: 'bg-orange-50 text-orange-600 hover:border-orange-500 ring-orange-200',
    red: 'bg-red-50 text-red-600 hover:border-red-500 ring-red-200',
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white p-8 rounded-[2rem] shadow-lg border-2 border-transparent cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] hover:border-opacity-100 overflow-hidden ${colors[color]} ring-1 ring-transparent hover:ring-opacity-50`}
    >
      {/* Badge for notifications */}
      {badgeCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-8 h-8 flex items-center justify-center font-bold animate-pulse">
          {badgeCount > 9 ? '9+' : badgeCount}
        </div>
      )}
      
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[2rem]"></div>
      
      {/* Icon with enhanced animation */}
      <div className={`relative z-10 ${colors[color].split(' ')[0]} w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 mx-auto`}>
        <span className="group-hover:animate-bounce">{icon}</span>
      </div>
      
      <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tight text-center mb-3 group-hover:text-gray-900 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mt-2 font-semibold text-center leading-relaxed">
        {desc}
      </p>
      
      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  );
};

// --- Stats Card Component ---
const StatsCard = ({ title, value, icon, trend = 'up', color = 'blue' }) => {
  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  };
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center text-xl`}>{icon}</div>
        <span className="text-xs font-bold uppercase text-gray-400">{trendIcons[trend]}</span>
      </div>
      <h3 className="text-3xl font-black text-gray-900">{value}</h3>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
    </div>
  );
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingHomework: 3,
    attendanceToday: '95%',
    classesToday: 4
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchTeacher = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      const { data } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      setTeacher(data);
      setLoading(false);
    };
    fetchTeacher();
  }, [navigate]);

  if (!mounted) return null;
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-black text-blue-900 animate-pulse uppercase tracking-widest space-y-4">
        <div className="text-6xl animate-bounce mb-8">🚀</div>
        <div className="text-2xl">ASM Loading...</div>
        <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        
        {/* Welcome Banner with Enhanced Animation */}
        <div className="group bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-[3rem] p-10 md:p-16 text-white mb-12 shadow-2xl relative overflow-hidden hover:scale-[1.02] transition-all duration-1000">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20 animate-pulse"></div>
          <div className="relative z-10">
            <span className="bg-white/20 backdrop-blur-sm text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-white/30 animate-pulse">
              Teacher Control Panel
            </span>
            <h1 className="text-5xl md:text-7xl font-black mt-6 tracking-[-0.05em] uppercase bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-tight">
              Welcome Back,
              <br />
              <span className="text-6xl md:text-8xl bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text">
                {teacher?.full_name?.split(' ')[0] || 'Teacher'}!
              </span>
            </h1>
            <p className="text-blue-100/80 mt-6 text-lg font-semibold italic leading-relaxed max-w-2xl">
              "Teaching is the one profession that creates all other professions." 
              <span className="text-blue-200 font-black block mt-2">- Aristotle</span>
            </p>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute right-20 top-1/2 text-[12rem] opacity-5 font-black select-none transform -translate-y-1/2 animate-spin-slow">✨</div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatsCard 
            title="Students" 
            value={stats.totalStudents.toLocaleString()} 
            icon="👥" 
            trend="up"
            color="blue"
          />
          <StatsCard 
            title="Today's Attendance" 
            value={stats.attendanceToday} 
            icon="📊" 
            trend="up"
          />
          <StatsCard 
            title="Classes Today" 
            value={stats.classesToday} 
            icon="📚" 
            trend="stable"
            color="purple"
          />
          <StatsCard 
            title="Pending HW" 
            value={stats.pendingHomework} 
            icon="✏️" 
            trend="down"
            color="orange"
          />
        </div>

        {/* Enhanced Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          
          <ActionCard 
            icon="📅" 
            title="Mark Attendance" 
            desc="Record daily presence for all your classes"
            onClick={() => navigate('/teacher/attendance')}
            color="blue"
            badgeCount={2}
          />

          <ActionCard 
            icon="📝" 
            title="Homework" 
            desc="Assign homework & check submissions"
            onClick={() => navigate('/teacher/homework')}
            color="purple"
            badgeCount={5}
          />

          <ActionCard 
            icon="📊" 
            title="Upload Results" 
            desc="Enter marks & generate reports"
            onClick={() => navigate('/teacher/upload-result')}
            color="green"
          />

          <ActionCard 
            icon="👥" 
            title="Student List" 
            desc="View all students & their profiles"
            onClick={() => navigate('/teacher/students')}
            color="orange"
          />

          <ActionCard 
            icon="📈" 
            title="Analytics" 
            desc="Performance charts & insights"
            onClick={() => navigate('/teacher/analytics')}
            color="red"
          />

          {/* Enhanced Teacher Profile Card */}
          <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 p-10 rounded-[2.5rem] shadow-2xl border-2 border-white/50 backdrop-blur-sm hover:shadow-3xl transition-all duration-700 hover:-translate-y-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
            <div className="relative flex justify-between items-start mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl flex items-center justify-center text-4xl shadow-2xl ring-4 ring-white/50 animate-float">
                👤
              </div>
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-lg">
                Verified Teacher
              </span>
            </div>
            <div className="space-y-3">
              <h3 className="font-black text-3xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent uppercase tracking-tight leading-tight">
                {teacher?.full_name || 'Teacher Name'}
              </h3>
              <div className="flex items-center gap-4 text-sm font-bold text-gray-600 uppercase tracking-wide">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">📚 {teacher?.subject || 'Mathematics'}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">👨‍🎓 Class 10A</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/profile-setup')}
              className="mt-8 w-full py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-200"
            >
              Edit Profile →
            </button>
          </div>
        </div>

        {/* Enhanced Notice Board */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-gray-100/50 shadow-2xl">
          <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tight mb-8 flex items-center gap-4">
            <span className="text-3xl animate-bounce">📢</span>
            Latest Announcements
          </h3>
          <div className="space-y-6">
            <div className="group p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border-l-6 border-blue-500 hover:shadow-xl transition-all duration-500 hover:-translate-x-2 hover:scale-[1.01]">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">📚</div>
                <div>
                  <p className="font-bold text-xl text-gray-900 group-hover:text-blue-900 transition-colors">
                    Final Exam Schedule Released!
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                    Posted by Admin • 2 hours ago
                  </p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Download the complete schedule from the student portal. Exams start from Feb 15th.
              </p>
            </div>
            <div className="group p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border-l-6 border-green-500 hover:shadow-xl transition-all duration-500 hover:-translate-x-2">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🎯</div>
                <div>
                  <p className="font-bold text-xl text-gray-900 group-hover:text-green-900 transition-colors">
                    Parent-Teacher Meeting
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                    Posted by Principal • Today
                  </p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Scheduled for Saturday, Feb 14th at 10 AM. Attendance mandatory for all teachers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add these custom animations to your global CSS or Tailwind config
const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
@keyframes float-slow {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-float { animation: float 6s ease-in-out infinite; }
.animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
.animate-spin-slow { animation: spin-slow 20s linear infinite; }
`;
