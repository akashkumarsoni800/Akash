import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 Wallet, UserPlus, Calendar, 
 Smartphone, CheckCircle, Activity, 
 FileText, ShieldCheck, Zap,
 Info, Star, ChevronRight, Layout,
 RefreshCw, Download, ArrowUpRight, ArrowDownRight,
 UserCheck, CreditCard, Receipt
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
    toast.error("Database connectivity issue. Please refresh.");
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
   
   const rawTotal: any = {
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

   const finalTotal: any = {};
   if (dbColumns.length > 0) {
    dbColumns.forEach(col => {
     if (rawTotal[col] !== undefined) finalTotal[col] = rawTotal[col];
    });
   } else {
    finalTotal.teacher_name = rawTotal.teacher_name;
    finalTotal.teacher_id = rawTotal.teacher_id;
    finalTotal.month = rawTotal.month;
    finalTotal.net_salary = rawTotal.net_salary;
    finalTotal.status = rawTotal.status;
   }

   const { error } = await supabase.from('teacher_salaries').insert([finalTotal]);
   if (error) throw error;
   
   toast.success('Salary record saved!');
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
   toast.success('Salary paid successfully!');
   fetchData();
  } catch (error: any) {
   toast.error('Failed to update status');
  } finally {
   setSalaryLoading(prev => ({...prev, [salaryId]: false}));
  }
 };

 const totalSalaryExpense = salaries.reduce((sum: number, s: any) => sum + (s.net_salary || 0), 0);

 if (!salaries.length && !teachers.length && loading) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
     <div className="relative">
       <RefreshCw size={60} className="animate-spin text-blue-600/20"/>
       <CreditCard size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
     </div>
     <p className="font-black  text-slate-400 text-[10px] mt-8 text-center px-10">Loading Payroll...</p>
    </div>
  );
 }

 return (
  <div className="min-h-screen bg-[var(--bg-main)] py-12 pb-32">
   <div className="max-w-full mx-auto space-y-4">
    
    {/* --- HEADER --- */}
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
       <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-none uppercase">
        Teacher<br/>
        <span className="text-[var(--accent-admin)]">Salaries</span>
       </h1>
        <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center justify-center md:justify-start gap-2">
         <ShieldCheck size={12} className="text-[var(--accent-admin)]" /> Employee Payroll Management
        </p>
      </motion.div>
      
       <div className="bg-white border border-slate-100 rounded-[5px] p-4 shadow-sm flex items-center gap-6 group hover:shadow-2xl active:scale-95 tracking-widest transition-all relative z-20">
       <div className="w-12 h-12 bg-slate-900 rounded-[5px] flex items-center justify-center text-xl shadow-2xl shadow-slate-200 group-hover:scale-110 group-hover:rotate-6 transition-transform">💰</div>
       <div>
        <p className="text-[9px] font-black text-slate-400 mb-1 leading-none">Total Amount</p>
        <p className="text-2xl font-black text-slate-900 leading-none">₹{totalSalaryExpense.toLocaleString()}</p>
       </div>
      </div>
    </div>

    <div className="space-y-16">
     
     {/* --- DISBURSEMENT ENTRY --- */}
     <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="premium-card p-4 md:p-6 relative overflow-hidden group"
     >
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 blur-[100px] rounded-full -mr-40 -mt-40 transition-transform duration-[4s] group-hover:scale-110"></div>
      
      <div className="flex items-center gap-6 mb-8 relative z-10 border-b border-slate-50 pb-6">
        <div className="w-14 h-14 bg-blue-50 rounded-[5px] flex items-center justify-center text-blue-600 shadow-inner">
         <Receipt size={30} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 leading-none uppercase">Add<br/><span className="text-[var(--accent-admin)] uppercase">Salary</span></h2>
      </div>
      
      <form onSubmit={handleSalarySubmit} className="space-y-6 relative z-10">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-3 group">
          <label className="text-[10px] font-black text-slate-400  ml-2 group-focus-within:text-blue-600 transition-colors">Choose Teacher</label>
          <div className="relative">
            <UserCheck className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/input:text-blue-400 transition-colors" size={20} />
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
             className="premium-input pl-16 appearance-none"
             required
            >
              <option value="">Select Staff Member</option>
             {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name} — {t.role}</option>
             ))}
            </select>
          </div>
         </div>

         <div className="space-y-3 group">
          <label className="text-[10px] font-black text-slate-400  ml-2 group-focus-within:text-blue-600 transition-colors">Select Month</label>
          <div className="relative">
            <Calendar className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/input:text-blue-400 transition-colors" size={20} />
            <input 
             type="month" 
             value={newSalary.month}
             onChange={(e) => setNewSalary({...newSalary, month: e.target.value})}
             className="premium-input pl-16"
             required
            />
          </div>
         </div>
       </div>

       <div className="bg-slate-50 border border-slate-100 p-6 rounded-[5px] relative overflow-hidden space-y-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 opacity-20 blur-3xl"></div>
         
         <div className="flex items-center gap-4 relative z-10 border-b border-slate-100 pb-6">
           <p className="text-[10px] font-black text-slate-400 ">Salary Details</p>
         </div>

         {(!dbColumns.includes('basic_salary') && dbColumns.length > 0) ? (
          <div className="relative z-10">
           <InputField 
            label="Total Payment Amount" 
            type="number" 
            value={newSalary.basic_salary || ''}
            prefix="INR"
            icon={Wallet}
            onChange={(e: any) => setNewSalary({...newSalary, basic_salary: Number(e.target.value)})}
            placeholder="Enter direct amount"
           />
          </div>
         ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           <InputField 
            label="Base Salary" 
            type="number" 
            value={newSalary.basic_salary || ''}
            prefix="INR"
            icon={CreditCard}
            onChange={(e: any) => {
             const val = Number(e.target.value);
             setNewSalary({
              ...newSalary, 
              basic_salary: val,
              hra: Math.round(val * 0.24)
             });
            }}
            placeholder="0"
           />
           {(!dbColumns.length || dbColumns.includes('hra')) && (
            <InputField 
             label="HRA Index (24%)" 
             type="number" 
             value={newSalary.hra}
             prefix="INR"
             accent="blue"
             readOnly
             icon={ShieldCheck}
            />
           )}
          </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {dbColumns.includes('allowances') && (
            <InputField 
             label="Other Allowances" 
            type="number" 
            value={newSalary.allowances || ''}
            prefix="INR"
            icon={ArrowUpRight}
            onChange={(e: any) => setNewSalary({...newSalary, allowances: Number(e.target.value)})}
            placeholder="0"
           />
          )}
          {dbColumns.includes('deductions') && (
            <InputField 
             label="Deductions" 
            type="number" 
            value={newSalary.deductions || ''}
            prefix="INR"
            icon={ArrowDownRight}
            accent="rose"
            onChange={(e: any) => setNewSalary({...newSalary, deductions: Number(e.target.value)})}
            placeholder="0"
           />
          )}
         </div>
       </div>

       <div className="bg-slate-900 p-8 rounded-[5px] text-white shadow-2xl relative overflow-hidden group/total">
         <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover/total:opacity-10 transition-opacity" />
         <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="text-center md:text-left">
             <p className="text-[10px] font-black text-blue-400 mb-2 leading-none">Total Net Salary</p>
            <h2 className="text-3xl md:text-4xl font-black leading-none uppercase">₹ {calculateNetSalary().toLocaleString()}</h2>
          </div>
          <button 
           type="submit" 
           disabled={loading}
           className="premium-button-admin w-full bg-white text-slate-900 duration-300 hover:bg-blue-600 hover:text-white border-none shadow-2xl active:scale-95 tracking-widest py-3"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {loading ? 'Processing...' : 'Add Salary Record'}
          </button>
         </div>
       </div>
      </form>
     </motion.div>

     {/* --- ARCHIVE MANIFEST --- */}
     <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="premium-card p-4 md:p-6 flex flex-col h-[1000px] overflow-hidden group"
     >
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900 leading-none uppercase">Salary<br/><span className="text-[var(--accent-admin)] uppercase">History</span></h2>
          <p className="text-[9px] font-black text-slate-400  leading-none">Previous salary records</p>
        </div>
        <div className="flex flex-col items-end gap-2">
         <div className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-[5px] text-[10px] font-black border border-blue-100 shadow-sm">
           {salaries.length} Records Found
         </div>
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-[8px] font-black text-slate-300 tracking-widest">Status: Connected</p>
         </div>
        </div>
      </div>
      
      <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar relative z-10">
       {salaries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-48">
         <Wallet size={100} className="mb-10 text-slate-200" />
         <p className="text-[12px] font-black  text-slate-400">List Clean</p>
        </div>
       ) : (
        salaries.map((salary: any, idx: number) => (
         <motion.div 
          key={salary.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * idx }}
          className="bg-white rounded-[5px] border border-slate-50 p-4 hover:border-blue-200 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 group/item relative overflow-hidden"
         >
          <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 opacity-10 blur-3xl group-hover/item:opacity-30 transition-opacity"></div>
          
          <div className="relative z-10">
           <div className="flex justify-between items-start gap-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-[5px] flex items-center justify-center font-black text-slate-200 border border-slate-100 shadow-inner group-hover/item:border-blue-100 group-hover/item:text-blue-600 text-xl transition-colors">
               {salary.teacher_name ? salary.teacher_name.charAt(0) : 'T'}
              </div>
              <div>
               <h3 className="font-semibold text-lg text-slate-900 group-hover/item:text-blue-600 transition-colors leading-none mb-2 uppercase">{salary.teacher_name}</h3>
               <p className="text-[10px] font-black text-slate-400 tracking-widest flex items-center gap-3">
                {salary.designation} <span className="w-1.5 h-1.5 bg-slate-100 rounded-full"></span> <span className="text-blue-500 font-black">{salary.month}</span>
               </p>
              </div>
            </div>
            <span className={`px-6 py-2.5 rounded-[5px] text-[10px] font-black  border transition-all ${
             salary.status === 'Paid' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
            }`}>
             {salary.status}
            </span>
           </div>
           
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-[5px] mb-6 border border-slate-50 group-hover/item:bg-white group-hover/item:border-blue-50 transition-all duration-700">
             <div className="text-left space-y-1">
              <p className="text-[8px] font-black text-slate-400 tracking-widest leading-none">Base</p>
              <p className="text-sm font-black text-slate-900 tracking-tight">₹{(salary.basic_salary || 0).toLocaleString()}</p>
             </div>
             <div className="text-left space-y-1">
              <p className="text-[8px] font-black text-slate-400 tracking-widest leading-none">Benefits</p>
              <p className="text-sm font-black text-emerald-500 tracking-tight">+₹{( (salary.hra || 0) + (salary.allowances || 0) ).toLocaleString()}</p>
             </div>
             <div className="text-left space-y-1">
              <p className="text-[8px] font-black text-rose-400 tracking-widest leading-none">Reductions</p>
              <p className="text-sm font-black text-rose-500 tracking-tight">-₹{(salary.deductions || 0).toLocaleString()}</p>
             </div>
             <div className="text-left space-y-1">
              <p className="text-[8px] font-black text-blue-500 tracking-widest leading-none">Net Pay</p>
              <p className="text-lg font-black text-slate-900 leading-none">₹{(salary.net_salary || 0).toLocaleString()}</p>
             </div>
            </div>
           
           <div className="flex flex-col sm:flex-row gap-4">
            <button 
             onClick={() => markSalaryPaid(salary.id)}
             disabled={salaryLoading[salary.id] || salary.status === 'Paid'}
             className="flex-1 py-3 bg-slate-900 text-white rounded-[5px] font-black text-[11px] tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl active:scale-95 tracking-widest active:scale-95 group/release"
            >
             {salaryLoading[salary.id] ? <RefreshCw size={20} className="animate-spin" /> : salary.status === 'Paid' ? <CheckCircle size={20} className="text-emerald-400" /> : <Zap size={20} className="group-hover/release:rotate-12 transition-transform" />}
              {salaryLoading[salary.id] ? 'Updating...' : salary.status === 'Paid' ? 'Paid' : 'Mark as Paid'}
            </button>
            <button className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[5px] flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all hover:shadow-2xl active:scale-95 tracking-widest group-hover/item:text-blue-500 active:scale-95">
             <Download size={24} />
            </button>
           </div>
          </div>
         </motion.div>
        ))
       )}
      </div>
      
      <button className="mt-10 py-3 bg-slate-50 rounded-[5px] text-[10px] font-black text-slate-400 tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-inner">
         View Full Report →
      </button>
     </motion.div>
    </div>
   </div>
  </div>
 );
};

const InputField = ({ label, icon: Icon, prefix, accent, ...props }: any) => (
 <div className="space-y-1 group">
  <label className={`block text-[9px] font-black text-slate-400  ml-2 transition-colors ${accent === 'blue' ? 'group-focus-within:text-blue-500' : accent === 'rose' ? 'group-focus-within:text-rose-500' : 'group-focus-within:text-slate-900'}`}>{label}</label>
  <div className="relative">
   {Icon && <Icon className={`absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${accent === 'blue' ? 'group-focus-within/input:text-blue-400' : accent === 'rose' ? 'group-focus-within/input:text-rose-400' : 'group-focus-within/input:text-slate-400'}`} size={18} />}
   {prefix && <span className={`absolute ${Icon ? 'left-24' : 'left-8'} top-1/2 -translate-y-1/2 font-black text-[9px] tracking-widest ${accent === 'blue' ? 'text-blue-300' : accent === 'rose' ? 'text-rose-300' : 'text-slate-200'}`}>{prefix}</span>}
   <input className="premium-input" style={{ paddingLeft: Icon ? (prefix ? '8rem' : '6rem') : (prefix ? '6rem' : '4rem') }} {...props} />
  </div>
 </div>
);

export default TeacherSalary;
