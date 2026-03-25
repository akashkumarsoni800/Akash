import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, UserPlus, Calendar, 
  Smartphone, CheckCircle, Activity, 
  FileText
} from 'lucide-react';

const TeacherSalary = () => {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbColumns, setDbColumns] = useState<string[]>([]);
  const [salaryLoading, setSalaryLoading] = useState<{[key: string]: boolean}>({});
  const [newSalary, setNewSalary] = useState<{
    teacher_id: string;
    teacher_name: string;
    designation: string;
    month: string;
    basic_salary: number;
    hra: number;
    allowances: number;
    deductions: number;
  }>({
    teacher_id: '',
    teacher_name: '',
    designation: '',
    month: '',
    basic_salary: 0,
    hra: 0,
    allowances: 0,
    deductions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let { data: salaryData, error: sErr } = await supabase.from('teacher_salaries').select('*').order('month', { ascending: false });
      const { data: teacherData, error: tErr } = await supabase.from('teachers').select('*').order('full_name');
      
      if (sErr && sErr.message.includes('basic_salary')) {
        console.warn("Retrying with limited columns due to basic_salary error...");
        const retry = await supabase.from('teacher_salaries').select('id, teacher_name, month, net_salary, status').order('month', { ascending: false });
        salaryData = retry.data;
        sErr = retry.error;
      }

      if (sErr) {
        console.error("Salary Table Error:", sErr);
        toast.error("Database connectivity issue. Please refresh or contact support.");
      }
      
      if (salaryData && salaryData.length > 0) {
        setDbColumns(Object.keys(salaryData[0]));
      } else {
        const { data: colData } = await supabase.from('teacher_salaries').select('*').limit(1);
        if (colData && colData.length > 0) setDbColumns(Object.keys(colData[0]));
      }

      setSalaries(salaryData || []);
      setTeachers(teacherData || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error('Failed to load salary data');
    }
  };

  const calculateNetSalary = () => {
    return Number(newSalary.basic_salary || 0) + Number(newSalary.hra || 0) + Number(newSalary.allowances || 0) - Number(newSalary.deductions || 0);
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const teacher = teachers.find(t => t.id === newSalary.teacher_id);
      const netSalary = calculateNetSalary();
      
      const rawPayload: any = {
        teacher_name: teacher?.full_name || newSalary.teacher_name,
        designation: teacher?.role || newSalary.designation,
        teacher_id: newSalary.teacher_id,
        month: newSalary.month,
        net_salary: netSalary,
        status: 'Pending',
        basic_salary: newSalary.basic_salary,
        hra: newSalary.hra,
        allowances: newSalary.allowances,
        deductions: newSalary.deductions
      };

      const finalPayload: any = {};
      if (dbColumns.length > 0) {
        dbColumns.forEach(col => {
          if (rawPayload[col] !== undefined) finalPayload[col] = rawPayload[col];
        });
      } else {
        finalPayload.teacher_name = rawPayload.teacher_name;
        finalPayload.teacher_id = rawPayload.teacher_id;
        finalPayload.month = rawPayload.month;
        finalPayload.net_salary = rawPayload.net_salary;
        finalPayload.status = rawPayload.status;
      }

      const { error } = await supabase.from('teacher_salaries').insert([finalPayload]);
      
      if (error) throw error;
      
      toast.success('✅ Salary record added successfully!');
      setNewSalary({
        teacher_id: '',
        teacher_name: '',
        designation: '',
        month: '',
        basic_salary: 0,
        hra: 0,
        allowances: 0,
        deductions: 0
      });
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markSalaryPaid = async (salaryId: string) => {
    setSalaryLoading(prev => ({...prev, [salaryId]: true}));
    try {
      const { error } = await supabase
        .from('teacher_salaries')
        .update({ status: 'Paid', paid_date: new Date().toISOString() })
        .eq('id', salaryId);
      
      if (error) throw error;
      toast.success('✅ Salary marked as paid!');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update status');
    } finally {
      setSalaryLoading(prev => ({...prev, [salaryId]: false}));
    }
  };

  const totalSalaryExpense = salaries.reduce((sum: number, s: any) => sum + (s.net_salary || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                Payroll<br/>
                <span className="text-blue-600">Operations</span>
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center gap-2">
                <Activity size={12} className="text-blue-500" /> Institutional Compensation & Payroll Vault
              </p>
           </motion.div>
           
           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-8 group hover:shadow-xl transition-all">
             <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">💰</div>
             <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cumulative Payload</p>
               <p className="text-3xl font-black text-slate-900 tracking-tighter italic">₹{totalSalaryExpense.toLocaleString()}</p>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Add New Salary Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-white border border-slate-100 rounded-[3.5rem] p-10 md:p-16 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 opacity-20 rounded-full -mr-32 -mt-32 transition-transform duration-[3s] group-hover:scale-110"></div>
            
            <h2 className="text-3xl font-black text-slate-800 mb-12 uppercase tracking-tight flex items-center gap-4 relative z-10">
              <UserPlus size={28} className="text-blue-600" /> Disbursement Entry
            </h2>
            
            <form onSubmit={handleSalarySubmit} className="space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 italic">
                  Faculty Selection
                </label>
                <select 
                  value={newSalary.teacher_id}
                  onChange={(e) => {
                    const teacher = teachers.find(t => t.id === e.target.value);
                    setNewSalary({
                      ...newSalary,
                      teacher_id: e.target.value,
                      teacher_name: teacher?.full_name || '',
                      designation: teacher?.role || ''
                    });
                  }}
                  className="premium-input w-full p-6 text-sm bg-slate-50 border-slate-100 focus:bg-white transition-all"
                  required
                >
                  <option value="">Identify Recipient</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name} — {t.role}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 italic">
                  Payroll Cycle
                </label>
                <input 
                  type="month" 
                  value={newSalary.month}
                  onChange={(e) => setNewSalary({...newSalary, month: e.target.value})}
                  className="premium-input w-full p-6 text-sm bg-slate-50 border-slate-100 focus:bg-white transition-all"
                  required
                />
              </div>

              {(dbColumns.includes('basic_salary') || dbColumns.length === 0) && (
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Base Compensation</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs uppercase">INR</span>
                      <input 
                        type="number" 
                        value={newSalary.basic_salary || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewSalary({
                            ...newSalary, 
                            basic_salary: val,
                            hra: Math.round(val * 0.24)
                          });
                        }}
                        className="premium-input w-full p-6 pl-16 text-sm font-black bg-slate-50 border-slate-100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {dbColumns.includes('hra') && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">HRA Index (24%)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-300 font-bold text-xs uppercase">INR</span>
                        <input 
                          type="number" 
                          value={newSalary.hra}
                          readOnly
                          className="premium-input w-full p-6 pl-16 text-sm font-black bg-blue-50/30 text-blue-600 border-blue-100 italic"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                {dbColumns.includes('allowances') && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Auxiliary Benefits</label>
                    <input 
                      type="number" 
                      value={newSalary.allowances || ''}
                      onChange={(e) => setNewSalary({...newSalary, allowances: Number(e.target.value)})}
                      className="premium-input w-full p-6 text-sm font-black bg-slate-50 border-slate-100"
                      placeholder="0"
                    />
                  </div>
                )}
                {dbColumns.includes('deductions') && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 italic">Fiscal Reductions</label>
                    <input 
                      type="number" 
                      value={newSalary.deductions || ''}
                      onChange={(e) => setNewSalary({...newSalary, deductions: Number(e.target.value)})}
                      className="premium-input w-full p-6 text-sm font-black border-rose-100 focus:ring-rose-200 bg-rose-50/10 text-rose-600"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 blur-3xl"></div>
                <p className="text-[9px] font-black uppercase text-blue-400 tracking-[0.3em] mb-2 relative z-10">Net Institutional Payload</p>
                <h2 className="text-4xl font-black tracking-tighter italic relative z-10">₹ {calculateNetSalary().toLocaleString()}</h2>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="bg-slate-900 text-white w-full py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
              >
                {loading ? <Activity size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {loading ? 'Authenticating...' : 'Authorize Disbursement'}
              </button>
            </form>
          </motion.div>

          {/* Salary Records List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-white border border-slate-100 rounded-[3.5rem] p-10 md:p-16 shadow-sm flex flex-col h-[900px] overflow-hidden group"
          >
            <h2 className="text-3xl font-black text-slate-800 mb-12 uppercase tracking-tight flex items-center justify-between relative z-10">
              <span className="flex items-center gap-4"><FileText size={28} className="text-blue-600" /> Archive Manifest</span>
              <span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-2xl text-[10px] font-black border border-blue-100 italic">{salaries.length} Slips</span>
            </h2>
            
            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar relative z-10">
              {salaries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-32">
                  <Wallet size={80} className="mb-8 text-slate-400" />
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 italic">No Disbursement Records</p>
                </div>
              ) : (
                salaries.map((salary: any) => (
                  <motion.div 
                    key={salary.id}
                    className="bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:border-blue-400 hover:shadow-2xl transition-all duration-500 group/item relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-10">
                        <div>
                           <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tighter group-hover/item:text-blue-600 transition-colors leading-none mb-3 italic">{salary.teacher_name}</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                             {salary.designation} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> <span className="text-blue-500 font-black">{salary.month}</span>
                           </p>
                        </div>
                        <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          salary.status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                        }`}>
                          {salary.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 bg-slate-50/50 rounded-[2.5rem] mb-10 border border-slate-50">
                         <div className="text-center md:text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Base</p>
                            <p className="text-md font-black text-slate-900 tracking-tight">₹{(salary.basic_salary || 0).toLocaleString()}</p>
                         </div>
                         <div className="text-center md:text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Benefits</p>
                            <p className="text-md font-black text-emerald-600 tracking-tight">+₹{( (salary.hra || 0) + (salary.allowances || 0) ).toLocaleString()}</p>
                         </div>
                         <div className="text-center md:text-left">
                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">Reductions</p>
                            <p className="text-md font-black text-rose-600 tracking-tight">-₹{(salary.deductions || 0).toLocaleString()}</p>
                         </div>
                         <div className="text-center md:text-left">
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Net Pay</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter leading-none italic">₹{(salary.net_salary || 0).toLocaleString()}</p>
                         </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => markSalaryPaid(salary.id)}
                          disabled={salaryLoading[salary.id] || salary.status === 'Paid'}
                          className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                        >
                          {salaryLoading[salary.id] ? <Activity size={18} className="animate-spin" /> : salary.status === 'Paid' ? <CheckCircle size={18} /> : '🚀 Release Payment'}
                          {salaryLoading[salary.id] ? 'Updating...' : salary.status === 'Paid' ? 'Paid Secure' : 'Authorize Release'}
                        </button>
                        <button className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all group-hover/item:text-blue-500">
                          <Smartphone size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSalary;

