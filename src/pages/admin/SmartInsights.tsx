import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { getCurrentSchoolId } from '../../hooks/useQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Users, TrendingDown, TrendingUp,
  BadgeIndianRupee, CalendarX, BookOpen, ChevronDown,
  RefreshCw, Filter, Search, CheckCircle2, XCircle,
  Clock, Star, AlertCircle, BarChart3, Brain, Send
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  student_id: number;
  full_name: string;
  class_name: string;
  section?: string;
  contact_number?: string;
  roll_number?: string;
}
interface AttendanceRecord { student_id: number; status: string; date: string; }
interface FeeRecord { student_id: number; status: string; total_amount?: number; month?: string; }

interface ResultRecord { student_id: number; percentage: number; marks_data?: any; }

interface StudentInsight {
  student: Student;
  attendancePct: number;
  totalDays: number;
  presentDays: number;
  feeStatus: 'Paid' | 'Pending' | 'No Record';
  avgMarks: number;
  hasResults: boolean;
  consecutiveAbsent: number;
  issues: { type: 'attendance' | 'fee' | 'academic' | 'absent_streak'; label: string; severity: 'high' | 'medium' | 'low' }[];
  score: number;
}

interface AutomationQueue {
  students: StudentInsight[];
  currentIndex: number;
  isOpen: boolean;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityColor = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};
const severityDot = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-500' };

// ─── Main Component ───────────────────────────────────────────────────────────
const SmartInsights: React.FC = () => {
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'attendance' | 'fee' | 'academic' | 'absent_streak'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [automation, setAutomation] = useState<AutomationQueue>({ students: [], currentIndex: 0, isOpen: false });


  const fetchData = async () => {
    setLoading(true);
    try {
      const schoolId = getCurrentSchoolId();
      const [studentsRes, attendanceRes, feesRes, resultsRes] = await Promise.all([
        supabase.from('students').select('student_id,full_name,father_name,class_name,section,contact_number,roll_no')
          .eq('school_id', schoolId).eq('is_approved', 'approved'),
        supabase.from('attendance').select('student_id,status,date').eq('school_id', schoolId),
        supabase.from('fees').select('student_id,status,total_amount,month').eq('school_id', schoolId),
        supabase.from('results').select('student_id,percentage,marks_data').eq('school_id', schoolId),
      ]);

      if (studentsRes.error) console.error("Students Fetch Error:", studentsRes.error);
      if (feesRes.error) console.error("Fees Fetch Error:", feesRes.error);

      const students: Student[] = studentsRes.data || [];
      const attendance: AttendanceRecord[] = attendanceRes.data || [];
      const fees: FeeRecord[] = feesRes.data || [];
      const results: ResultRecord[] = resultsRes.data || [];

      // Group data by student
      const attMap = new Map<number, AttendanceRecord[]>();
      attendance.forEach(a => {
        if (!attMap.has(a.student_id)) attMap.set(a.student_id, []);
        attMap.get(a.student_id)!.push(a);
      });

      const feeMap = new Map<number, FeeRecord[]>();
      fees.forEach(f => {
        if (!feeMap.has(f.student_id)) feeMap.set(f.student_id, []);
        feeMap.get(f.student_id)!.push(f);
      });

      const resultMap = new Map<number, ResultRecord[]>();
      results.forEach(r => {
        if (!resultMap.has(r.student_id)) resultMap.set(r.student_id, []);
        resultMap.get(r.student_id)!.push(r);
      });

      const insightList: StudentInsight[] = students.map(student => {
        // ── Attendance Analysis ────────────────────────────────────────────
        const attRecords = attMap.get(student.student_id) || [];
        const totalDays = attRecords.length;
        const presentDays = attRecords.filter(a => a.status === 'Present').length;
        const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

        // Consecutive absent streak
        const sortedAtt = [...attRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let consecutiveAbsent = 0;
        for (const a of sortedAtt) {
          if (a.status === 'Absent') consecutiveAbsent++;
          else break;
        }

        // ── Fee Analysis ───────────────────────────────────────────────────
        const feeRecords = feeMap.get(student.student_id) || [];
        const pendingRecord = feeRecords.find(f => f.status?.trim().toLowerCase() === 'pending');
        
        // ONLY show as Pending if an explicit 'Pending' record exists
        const feeStatus: StudentInsight['feeStatus'] = pendingRecord ? 'Pending' : 'Paid';



        // ── Academic Analysis ──────────────────────────────────────────────
        const resultRecords = resultMap.get(student.student_id) || [];
        const hasResults = resultRecords.length > 0;
        const avgMarks = hasResults
          ? Math.round(resultRecords.reduce((sum, r) => sum + Number(r.percentage || 0), 0) / resultRecords.length)
          : 0;

        // ── Build Issues ───────────────────────────────────────────────────
        const issues: StudentInsight['issues'] = [];

        if (totalDays > 0 && attendancePct < 60) {
          issues.push({ type: 'attendance', label: `Attendance sirf ${attendancePct}% — bahut kam!`, severity: 'high' });
        } else if (totalDays > 0 && attendancePct < 75) {
          issues.push({ type: 'attendance', label: `Attendance ${attendancePct}% — warning zone`, severity: 'medium' });
        }

        if (feeStatus === 'Pending') {
          issues.push({ type: 'fee', label: 'Fee pending hai', severity: 'high' });
        }

        if (consecutiveAbsent >= 5) {
          issues.push({ type: 'absent_streak', label: `${consecutiveAbsent} din lagaatar absent`, severity: 'high' });
        } else if (consecutiveAbsent >= 3) {
          issues.push({ type: 'absent_streak', label: `${consecutiveAbsent} din lagaatar absent`, severity: 'medium' });
        }

        if (hasResults && avgMarks < 35) {
          issues.push({ type: 'academic', label: `Marks sirf ${avgMarks}% — fail risk!`, severity: 'high' });
        } else if (hasResults && avgMarks < 50) {
          issues.push({ type: 'academic', label: `Average marks ${avgMarks}% — kamzor`, severity: 'medium' });
        }

        // Risk score
        const score = issues.reduce((s, i) => s + (i.severity === 'high' ? 3 : i.severity === 'medium' ? 2 : 1), 0);

        return { student, attendancePct, totalDays, presentDays, feeStatus, avgMarks, hasResults, consecutiveAbsent, issues, score };
      });

      // Sort by risk score descending
      insightList.sort((a, b) => b.score - a.score);
      setInsights(insightList);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('SmartInsights error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setSelectedIds(new Set()); }, [filter, search]); // Reset selection when filter changes

  // ── Selection Helpers ──────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(i => i.student.student_id)));
  };

  const selectAllDefaulters = () => {
    const defaulters = insights.filter(i => i.feeStatus === 'Pending');
    setSelectedIds(new Set(defaulters.map(d => d.student.student_id)));
    setFilter('fee');
  };

  // ── Automation Logic ───────────────────────────────────────────────────
  const startBulkReminders = () => {
    const selectedStudents = insights.filter(i => selectedIds.has(i.student.student_id));
    setAutomation({
      students: selectedStudents,
      currentIndex: 0,
      isOpen: true
    });
  };

  const nextReminder = () => {
    const current = automation.students[automation.currentIndex];
    const schoolId = getCurrentSchoolId();
    
    if (current?.student.contact_number) {
      // Find the specific pending record to get month and amount
      // Since we already filtered for 'pending' in startBulkReminders, we just need the data
      const getLatestPending = async () => {
        const { data } = await supabase
          .from('fees')
          .select('month, total_amount')
          .eq('student_id', current.student.student_id)
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        return data;
      };

      getLatestPending().then(feeData => {
        const month = feeData?.month || 'Current Month';
        const amount = feeData?.total_amount || '0';
        const schoolName = localStorage.getItem('current_school_name') || 'Adukul School';
        
        const msg = encodeURIComponent(
          `*📄 FEE REMINDER - ${schoolName.toUpperCase()}*\n\n` +
          `*Student:* ${current.student.full_name}\n` +
          `*Father:* ${current.student.father_name || 'N/A'}\n` +
          `*Class:* ${current.student.class_name}\n` +
          `*Month:* ${month}\n` +
          `*Pending Amount:* ₹${amount}\n\n` +
          `Kripya jald se jald fees jama karein. Dhanyawad.`
        );
        
        window.open(`https://wa.me/91${current.student.contact_number?.replace(/\D/g, '')}?text=${msg}`, '_blank');
      });
    }

    if (automation.currentIndex < automation.students.length - 1) {
      setAutomation(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      setAutomation(prev => ({ ...prev, isOpen: false }));
      setSelectedIds(new Set());
      toast.success('Bulk reminders complete! 🎉');
    }
  };



  // ── Summary Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: insights.length,
    atRisk: insights.filter(i => i.score > 0).length,
    lowAttendance: insights.filter(i => i.attendancePct < 75 && i.totalDays > 0).length,
    feePending: insights.filter(i => i.feeStatus === 'Pending').length,
    academicWeak: insights.filter(i => i.hasResults && i.avgMarks < 50).length,
    consecutiveAbsent: insights.filter(i => i.consecutiveAbsent >= 3).length,
  }), [insights]);

  // ── Filtered List ────────────────────────────────────────────────────────
  const filtered = useMemo(() => insights.filter(i => {
    const matchSearch = i.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      i.student.class_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all'
      ? i.score > 0
      : i.issues.some(iss => iss.type === filter);
    return matchSearch && matchFilter;
  }), [insights, search, filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Smart Student Insights</h1>
            <p className="text-xs text-slate-500">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Students', value: stats.total, icon: Users, color: 'from-slate-600 to-slate-700', bg: 'bg-slate-50 border-slate-200' },
          { label: 'At Risk', value: stats.atRisk, icon: AlertTriangle, color: 'from-red-500 to-rose-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Low Attendance', value: stats.lowAttendance, icon: CalendarX, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Fee Pending', value: stats.feePending, icon: BadgeIndianRupee, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'Academic Weak', value: stats.academicWeak, icon: BookOpen, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Absent Streak', value: stats.consecutiveAbsent, icon: XCircle, color: 'from-red-600 to-red-700', bg: 'bg-red-50 border-red-200' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${card.bg} border rounded-2xl p-3`}
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2`}>
              <card.icon size={15} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{loading ? '—' : card.value}</div>
            <div className="text-[11px] text-slate-500 font-medium">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <label htmlFor="insight-search" className="sr-only">Search student or class</label>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="insight-search"
            name="insight-search"
            type="text"
            placeholder="Student ya class search karo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Sab', icon: Filter },
            { key: 'attendance', label: 'Attendance', icon: CalendarX },
            { key: 'fee', label: 'Fee', icon: BadgeIndianRupee },
            { key: 'academic', label: 'Marks', icon: BookOpen },
            { key: 'absent_streak', label: 'Absent Streak', icon: XCircle },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <f.icon size={12} />
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={selectAllDefaulters}
          className="ml-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
        >
          Select All Defaulters
        </button>
      </div>


      {/* Student List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw size={32} className="animate-spin text-indigo-500" />
          <p className="text-slate-500 text-sm">Sab students ka analysis ho raha hai...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
          <h3 className="font-semibold text-slate-700">Koi problem nahi mili!</h3>
          <p className="text-sm text-slate-400 mt-1">Sab students theek hain is category mein.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">{filtered.length} students mein issue mila</p>
          <AnimatePresence>
            {filtered.map((insight, idx) => (
              <motion.div
                key={insight.student.student_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Row Header */}
                <div 
                  className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-slate-50 border-r border-slate-100"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(insight.student.student_id); }}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(insight.student.student_id) 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {selectedIds.has(insight.student.student_id) && <CheckCircle2 size={14} />}
                  </div>
                </div>

                <button
                  className="flex-1 flex items-center gap-4 p-4 text-left"
                  onClick={() => setExpandedId(expandedId === insight.student.student_id ? null : insight.student.student_id)}
                >
                  {/* Risk indicator */}
                  <div className={`w-1.5 h-10 rounded-full shrink-0 ${
                    insight.score >= 6 ? 'bg-red-500' : insight.score >= 3 ? 'bg-amber-500' : 'bg-blue-400'
                  }`} />


                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{insight.student.full_name}</span>
                      <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Class {insight.student.class_name}{insight.student.section ? `-${insight.student.section}` : ''}
                      </span>
                    </div>
                    {/* Issue badges */}
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {insight.issues.map((issue, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${severityColor[issue.severity]}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${severityDot[issue.severity]}`} />
                          {issue.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
                    <div>
                      <div className={`text-sm font-bold ${insight.attendancePct < 75 ? 'text-red-600' : 'text-green-600'}`}>
                        {insight.totalDays > 0 ? `${insight.attendancePct}%` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">Attendance</div>
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${insight.feeStatus === 'Pending' ? 'text-red-600' : insight.feeStatus === 'Paid' ? 'text-green-600' : 'text-slate-400'}`}>
                        {insight.feeStatus === 'No Record' ? '—' : insight.feeStatus}
                      </div>
                      <div className="text-[10px] text-slate-400">Fee</div>
                    </div>
                    {insight.hasResults && (
                      <div>
                        <div className={`text-sm font-bold ${insight.avgMarks < 50 ? 'text-red-600' : 'text-green-600'}`}>
                          {insight.avgMarks}%
                        </div>
                        <div className="text-[10px] text-slate-400">Marks</div>
                      </div>
                    )}
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-slate-400 shrink-0 transition-transform ${expandedId === insight.student.student_id ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedId === insight.student.student_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-4 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Attendance Detail */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarX size={14} className="text-amber-500" />
                            <span className="text-xs font-semibold text-slate-700">Attendance</span>
                          </div>
                          <div className="text-2xl font-bold text-slate-800">
                            {insight.totalDays > 0 ? `${insight.attendancePct}%` : 'No data'}
                          </div>
                          {insight.totalDays > 0 && (
                            <>
                              <div className="text-[11px] text-slate-500">{insight.presentDays}/{insight.totalDays} din present</div>
                              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${insight.attendancePct < 60 ? 'bg-red-500' : insight.attendancePct < 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                                  style={{ width: `${insight.attendancePct}%` }}
                                />
                              </div>
                              {insight.consecutiveAbsent > 0 && (
                                <div className="mt-2 text-[11px] text-red-600 font-medium">
                                  ⚠️ {insight.consecutiveAbsent} din lagaatar absent
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Fee Detail */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <BadgeIndianRupee size={14} className="text-purple-500" />
                            <span className="text-xs font-semibold text-slate-700">Fee Status</span>
                          </div>
                          <div className={`text-2xl font-bold ${insight.feeStatus === 'Pending' ? 'text-red-600' : insight.feeStatus === 'Paid' ? 'text-green-600' : 'text-slate-400'}`}>
                            {insight.feeStatus}
                          </div>
                          {insight.feeStatus === 'Pending' && (
                            <div className="mt-2 text-[11px] text-red-600 font-medium">
                              💸 Fee reminder bhejo
                            </div>
                          )}
                          {insight.student.contact_number && (
                            <a
                              href={`https://wa.me/91${insight.student.contact_number.replace(/\D/g, '')}?text=Namaskar, aapke bacche ${insight.student.full_name} ka fee pending hai. Kripya jaldi jama karein.`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 flex items-center gap-1 text-[11px] text-green-600 hover:underline"
                            >
                              📱 WhatsApp Reminder
                            </a>
                          )}
                        </div>

                        {/* Marks Detail */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-blue-500" />
                            <span className="text-xs font-semibold text-slate-700">Academic</span>
                          </div>
                          {insight.hasResults ? (
                            <>
                              <div className={`text-2xl font-bold ${insight.avgMarks < 50 ? 'text-red-600' : insight.avgMarks < 75 ? 'text-amber-600' : 'text-green-600'}`}>
                                {insight.avgMarks}%
                              </div>
                              <div className="text-[11px] text-slate-500">Average marks</div>
                              <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${insight.avgMarks < 35 ? 'bg-red-500' : insight.avgMarks < 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                                  style={{ width: `${insight.avgMarks}%` }}
                                />
                              </div>
                              {insight.avgMarks < 35 && (
                                <div className="mt-2 text-[11px] text-red-600 font-medium">⚠️ Fail risk — extra attention chahiye</div>
                              )}
                            </>
                          ) : (
                            <div className="text-slate-400 text-sm">Koi result nahi mila</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl"
          >
            <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold">
                  {selectedIds.size}
                </div>
                <div>
                  <p className="text-sm font-bold">Students Selected</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Bulk Action Ready</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={startBulkReminders}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-900/40 uppercase flex items-center gap-2"
                >
                  <BadgeIndianRupee size={14} />
                  Remind All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automation Modal Overlay */}
      <AnimatePresence>
        {automation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setAutomation(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Brain size={32} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Rule-Based Automation</h3>
                <p className="text-sm text-slate-500 mb-8">
                  Sending WhatsApp reminders to {automation.students.length} students.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-bold text-indigo-600">
                      {automation.currentIndex + 1}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">{automation.students[automation.currentIndex]?.student.full_name}</p>
                      <p className="text-[10px] text-slate-400">Class {automation.students[automation.currentIndex]?.student.class_name}</p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500" 
                      style={{ width: `${((automation.currentIndex + 1) / automation.students.length) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={nextReminder}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
                >
                  <Send size={18} />
                  {automation.currentIndex === automation.students.length - 1 ? 'Send Final Reminder' : 'Send & Next Student'}
                </button>
                
                <p className="mt-6 text-[10px] text-slate-400 uppercase font-black tracking-widest leading-loose">
                  Har click par ek naya WhatsApp tab khulega.<br/>Browser blocks sequential popups for safety.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
};

export default SmartInsights;
