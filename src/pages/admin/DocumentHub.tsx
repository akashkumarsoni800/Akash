import React, { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { 
 Search, Printer, FileText, CreditCard, 
 Award, DoorOpen, GraduationCap, RefreshCw, UserCheck, Users,
 ShieldCheck, Zap, Scissors, ChevronRight, Layout, Info, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentICard from '../../components/shared/StudentICard';

const DocumentHub = () => {
 const [studentId, setStudentId] = useState('');
 const [student, setStudent] = useState<any>(null);
 const [studentsList, setStudentsList] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);
 const [activeDoc, setActiveDoc] = useState<'ICARD' | 'TC' | 'DOB' | 'GATE' | 'ADMIT' | null>(null);
 const componentRef = useRef<any>();

 const fetchStudent = async () => {
  if (!studentId.trim()) return toast.error("कृपया Name, Roll No या Class डालें!");
  setLoading(true);
  setStudentsList([]);
  const cleanSearch = studentId.trim();
  const isNumber = !isNaN(Number(cleanSearch));

  try {
   // 1. Try exact Class Match (Fast bulk load)
   const { data: classData } = await supabase
    .from('students')
    .select('*')
    .eq('class_name', cleanSearch)
    .order('roll_no', { ascending: true });

   if (classData && classData.length > 0) {
    setStudentsList(classData);
    setStudent(null);
    toast.success(`${classData.length} students loaded for Class ${cleanSearch}! 🚀`);
    setLoading(false);
    return;
   }

   // 2. Advanced Search (Class + Name or name-only)
   let query = supabase.from('students').select('*');
   
   const parts = cleanSearch.split(/\s+/);
   if (parts.length > 1) {
    const classIndex = parts.findIndex(p => !isNaN(Number(p)) || ['Nursery', 'LKG', 'UKG'].includes(p.toUpperCase()));
    if (classIndex !== -1) {
     const cls = parts[classIndex];
     const namePart = parts.filter((_, i) => i !== classIndex).join(' ');
     query = query.eq('class_name', cls).ilike('full_name', `%${namePart}%`);
    } else {
     query = query.or(`full_name.ilike.%${cleanSearch}%,student_id.eq.${isNumber ? cleanSearch : 0},roll_no.eq.${cleanSearch}`);
    }
   } else {
    query = query.or(`student_id.eq.${isNumber ? cleanSearch : 0},roll_no.eq.${cleanSearch},full_name.ilike.%${cleanSearch}%`);
   }

   const { data, error } = await query;
   if (error) throw error;
   
   if (!data || data.length === 0) {
    toast.error("Record not found!");
    setStudent(null);
    setStudentsList([]);
   } else {
    if (data.length === 1) {
     setStudent(data[0]);
     setStudentsList([data[0]]);
     toast.success(`${data[0].full_name} loaded! ✅`);
    } else {
     setStudent(null);
     setStudentsList(data);
     toast.success(`${data.length} matches found! Please select. 🚀`);
    }
   }
  } catch (err: any) {
   toast.error("Error: " + err.message);
  } finally {
   setLoading(false);
  }
 };

 const handlePrint = useReactToPrint({
  content: () => componentRef.current,
 });

 return (
  <div className="min-h-screen bg-[var(--bg-main)] py-12 px-4 md:px-10 pb-32">
   <div className="max-w-full mx-auto space-y-12">
    
    <div className="no-print flex justify-between items-center">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
       <h1 className="text-5xl md:text-7xl font-black text-slate-900  leading-none uppercase">
        Digital<br/>
        <span className="text-purple-600">Archive</span>
       </h1>
       <p className="text-slate-400 font-black text-[10px] mt-4 flex items-center gap-2">
        <ShieldCheck size={12} className="text-purple-500" /> Paid School Document Generation & Hub v4.2
       </p>
      </motion.div>
 
      <div className="hidden lg:flex items-center gap-4 bg-white px-6 py-3 rounded-[5px] border border-slate-100 shadow-sm">
       <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
       <span className="text-[10px] font-black tracking-widest text-slate-400">Secure Active</span>
      </div>
    </div>

    {/* --- SEARCH ENGINE --- */}
    <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
     <div className="lg:col-span-8 premium-card p-8 flex flex-col md:flex-row gap-6 items-center group overflow-visible">
      <div className="relative flex-1 w-full">
       <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-purple-400 group-hover:scale-110 transition-transform" />
       <input 
        type="text" 
        placeholder="Search Identity, Roll, or Class..." 
        className="premium-input text-lg pl-16 py-6"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && fetchStudent()}
       />
      </div>
      <button 
       onClick={fetchStudent} 
       disabled={loading} 
       className="premium-button-admin w-full md:w-auto bg-slate-900 text-white hover:bg-purple-600 border-none shadow-2xl active:scale-95 tracking-widest"
      >
       {loading ? <RefreshCw className="animate-spin" size={20}/> : <Users size={20}/>}
       <span>{loading ? 'Analyzing...' : 'Access '}</span>
      </button>
     </div>

     <div className="lg:col-span-4 bg-purple-600 p-8 rounded-[5px] shadow-purple-200 shadow-2xl flex flex-col justify-center relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-white/10 group-hover:rotate-12 transition-transform duration-1000">
        <GraduationCap size={150} />
      </div>
      <label className="text-[10px] font-black text-purple-200  mb-4 ml-2">Quick Fleet Access</label>
      <select 
       className="w-full bg-white/20 border border-white/20 p-5 rounded-[1.5rem] font-black text-white outline-none focus:ring-4 focus:ring-white/30 backdrop-blur-md appearance-none relative z-10"
       onChange={(e) => {
        setStudentId(e.target.value);
        setTimeout(() => {
         const btn = document.getElementById('class-fetch-btn');
         if (btn) btn.click();
        }, 10);
       }}
      >
       <option value="" className="text-slate-900">Select Class</option>
       {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(cls => (
        <option key={cls} value={cls} className="text-slate-900">Class {cls} </option>
       ))}
      </select>
      <button id="class-fetch-btn" onClick={fetchStudent} className="hidden"></button>
     </div>
    </div>

    {/* 📑 DOCUMENT SELECTION GRID */}
    <AnimatePresence>
     {studentsList.length > 0 && (
      <motion.div 
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="no-print grid grid-cols-2 md:grid-cols-5 gap-6"
      >
        <PremiumDocBtn icon={CreditCard} label="Identity List" active={activeDoc === 'ICARD'} onClick={() => setActiveDoc('ICARD')} accent="purple" />
        <PremiumDocBtn icon={FileText} label="Transfer Certificate" active={activeDoc === 'TC'} onClick={() => setActiveDoc('TC')} accent="slate" />
        <PremiumDocBtn icon={Award} label="Birth Authorization" active={activeDoc === 'DOB'} onClick={() => setActiveDoc('DOB')} accent="indigo" />
        <PremiumDocBtn icon={Layout} label="Admit (Bulk)" active={activeDoc === 'ADMIT'} onClick={() => setActiveDoc('ADMIT')} accent="purple" />
        <PremiumDocBtn icon={DoorOpen} label="Operational Gate Pass" active={activeDoc === 'GATE'} onClick={() => setActiveDoc('GATE')} accent="rose" />
      </motion.div>
     )}
    </AnimatePresence>

    {/* 📚 REGISTRY LIST & SELECTION */}
    <AnimatePresence>
     {studentsList.length > 1 && (
      <motion.div 
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="no-print premium-card p-10 md:p-14 space-y-10"
      >
        <div className="flex justify-between items-center border-b border-slate-50 pb-8">
         <h3 className="font-black text-slate-900 tracking-widest flex items-center gap-4 uppercase">
           <Users className="text-purple-600" /> {student ? "List Target Selected" : `Extracted (${studentsList.length})`}
         </h3>
         <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-[5px]">
           <Zap size={14} className="text-purple-600" />
           <span className="text-[9px] font-black text-purple-600 tracking-widest">Bulk Synthesis Support Active</span>
         </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {studentsList.map((std) => (
          <button 
           key={std.id}
           onClick={() => setStudent(std)}
           className={`flex items-center gap-5 p-6 rounded-[5px] transition-all text-left border relative overflow-hidden group ${
            student?.id === std.id 
            ? 'bg-purple-600 border-purple-600 shadow-2xl active:scale-95 tracking-widest shadow-purple-200' 
            : 'bg-slate-50 border-slate-100 hover:border-purple-200 hover:bg-white hover:shadow-lg'
           }`}
          >
           <div className={`w-16 h-16 rounded-[5px] flex items-center justify-center font-black overflow-hidden flex-shrink-0 shadow-inner ${
            student?.id === std.id ? 'bg-white text-purple-600' : 'bg-white text-slate-300'
           }`}>
            {std.photo_url ? (
             <img src={std.photo_url} className="w-full h-full object-cover" alt="" />
            ) : (
             <span className="text-2xl ">{std.full_name.charAt(0)}</span>
            )}
           </div>
           <div className="min-w-0 z-10">
            <p className={`font-black text-sm truncate tracking-tight ${
             student?.id === std.id ? 'text-white' : 'text-slate-900'
            }`}>{std.full_name}</p>
            <p className={`text-[10px] font-black mt-1 tracking-widest ${
             student?.id === std.id ? 'text-purple-200' : 'text-purple-600'
            }`}>
             Row #{std.roll_no} • Class {std.class_name}
            </p>
           </div>
           <ChevronRight className={`ml-auto transition-transform ${
            student?.id === std.id ? 'text-white translate-x-1' : 'text-slate-200 group-hover:translate-x-1'
           }`} size={20} />
          </button>
         ))}
        </div>
      </motion.div>
     )}
    </AnimatePresence>


    {/* 🖨️ DOCUMENT PREVIEW & PRINTING CHAMBER */}
    <motion.div 
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     className="bg-white p-8 md:p-16 rounded-[5rem] shadow-sm border border-slate-100 flex flex-col items-center group overflow-hidden relative"
    >
     <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-20" />
     
     {(student || (studentsList.length > 0 && activeDoc)) ? (
      <div className="w-full flex flex-col items-center space-y-12">
       <div className="w-full bg-slate-900/5 backdrop-blur-md p-6 md:p-14 rounded-[5px] shadow-inner flex justify-center border border-slate-100 relative group/view">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900 px-6 py-2 rounded-full shadow-2xl z-20 opacity-0 group-hover/view:opacity-100 transition-opacity">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[9px] font-black text-white tracking-widest ">Optical Precision Preview</span>
        </div>

        <div ref={componentRef} className="bg-white shadow-2xl relative z-10">
         {student ? (
          <div className="bg-white">
           {activeDoc === 'ICARD' && <StudentICard student={student} hidePrintButton={true} />}
           {activeDoc === 'TC' && <TCTemplate student={student} />}
           {activeDoc === 'DOB' && <DOBTemplate student={student} />}
           {activeDoc === 'ADMIT' && <AdmitGrid students={[student]} />}
           {activeDoc === 'GATE' && <GatePassTemplate student={student} />}
          </div>
         ) : (
          <div className="bg-white">
           {activeDoc === 'ADMIT' ? (
            <AdmitGrid students={studentsList} />
           ) : activeDoc === 'ICARD' ? (
            <ICardGrid students={studentsList} />
           ) : (
            <div className="flex flex-wrap gap-[5mm] justify-center bg-white p-[5mm]">
             {studentsList.map((std) => (
              <div key={std.id} className="break-inside-avoid">
               {activeDoc === 'GATE' && <GatePassTemplate student={std} />}
               {activeDoc === 'TC' && <TCTemplate student={std} />}
               {activeDoc === 'DOB' && <DOBTemplate student={std} />}
              </div>
             ))}
            </div>
           )}
          </div>
         )}
        </div>
       </div>

       <button 
        onClick={handlePrint} 
        className="group relative bg-slate-900 text-white px-20 py-8 rounded-[5px] font-black  flex items-center gap-6 shadow-2xl hover:bg-purple-600 transition-all active:scale-95 "
       >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[5px]" />
        <Printer size={32} className="group-hover:rotate-12 transition-transform" /> 
        <span>Authorize {student ? "Individual" : `Fleet-Wide (${studentsList.length})`} Printing</span>
       </button>
      </div>
     ) : (
      <div className="py-40 text-center space-y-10 group">
        <div className="w-32 h-32 bg-slate-50 rounded-[5px] flex items-center justify-center mx-auto mb-4 shadow-inner text-6xl group-hover:scale-110 transition-transform duration-1000 grayscale opacity-40">📇</div>
        <div className="space-y-4">
         <h4 className="text-3xl font-black text-slate-900  ">Chamber Idle</h4>
         <p className="max-w-md mx-auto text-slate-400 font-black text-[10px]  leading-relaxed px-10">
          Identify a registry target and select document parameters to initiate document synthesis.
         </p>
        </div>
      </div>
     )}
    </motion.div>
   </div>
  </div>
 );
};

const PremiumDocBtn = ({ icon: Icon, label, active, onClick, accent }: any) => {
  const accents: any = {
   purple: 'active:bg-purple-600 border-purple-600 text-purple-600 bg-purple-50',
   slate: 'active:bg-slate-900 border-slate-900 text-slate-900 bg-slate-50',
   indigo: 'active:bg-indigo-600 border-indigo-600 text-indigo-600 bg-indigo-50',
   rose: 'active:bg-rose-600 border-rose-600 text-rose-600 bg-rose-50'
  };

  return (
   <button 
    onClick={onClick} 
    className={`p-8 rounded-[5px] border-4 transition-all flex flex-col items-center gap-5 group hover:shadow-2xl active:scale-95 ${
     active 
     ? `${accents[accent]} shadow-2xl active:scale-95 tracking-widest scale-105` 
     : 'bg-white border-transparent text-slate-300 hover:bg-slate-50 hover:text-slate-500'
    }`}
   >
    <div className={`w-14 h-14 rounded-[5px] flex items-center justify-center transition-all ${
      active ? 'scale-110 bg-white shadow-inner' : 'grayscale group-hover:grayscale-0'
    }`}>
      <Icon size={32} />
    </div>
    <span className="text-[9px] font-black  text-center leading-tight">{label}</span>
   </button>
  );
};

const ICardGrid = ({ students }: { students: any[] }) => (
 <div className="grid grid-cols-2 gap-[10mm] p-[10mm] bg-white w-[210mm] mx-auto print:p-0">
  {students.map((std, idx) => (
   <div key={idx} className="break-inside-avoid flex justify-center py-[5mm]">
    <StudentICard student={std} hidePrintButton={true} />
   </div>
  ))}
 </div>
);

const AdmitGrid = ({ students }: { students: any[] }) => (
 <div className="flex flex-col gap-[8mm] bg-white w-[210mm] mx-auto p-[8mm] custom-print-style font-inter">
  {students.map((std, idx) => (
   <div 
    key={idx} 
    className="relative border-[3px] border-slate-900 p-8 h-[135mm] w-full flex flex-col justify-between overflow-hidden bg-white"
    style={{ pageBreakInside: 'avoid' }}
   >
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-900/5 rounded-bl-[4rem]" />

    <div className="flex justify-between items-center border-b-[2px] border-slate-900 pb-4 mb-6">
      <div className="w-[80px] h-[80px] flex items-center justify-center bg-slate-50 rounded-[5px] shadow-inner">
       <img src={localStorage.getItem('current_school_logo') || "/logo.png"} alt="logo" className="w-full h-full object-contain p-2" />
      </div>
      
      <div className="text-center flex-1 mx-4">
       <h2 className="text-3xl font-black text-slate-900  leading-none uppercase">{localStorage.getItem('current_school_name') || 'Adarsh Shishu Mandir'}</h2>
       <p className="text-[8px] font-black text-slate-400 mt-1  leading-none">Basantpatti, Purnahiya (Sheohar) Bihar</p>
       <div className="inline-block bg-slate-900 text-white px-8 py-1.5 rounded-full text-[10px] font-black  mt-3">Annual Examination Admit 2026</div>
      </div>

      <div className="w-[80px] h-[80px] flex flex-col items-center justify-center border border-slate-100 rounded-[5px] bg-slate-50/50">
       <span className="text-[8px] font-black text-slate-300 tracking-widest">Entry ID</span>
       <span className="text-xs font-black text-slate-900 font-mono mt-0.5">#{std.roll_no}</span>
      </div>
    </div>

    <div className="flex gap-10 items-start flex-1 mb-6">
     <div className="w-36 h-44 border-[2px] border-slate-900 bg-slate-50 flex flex-col items-center justify-center relative flex-shrink-0 overflow-hidden shadow-inner group">
       {std.photo_url ? (
        <img src={std.photo_url} className="w-full h-full object-cover" alt="Student" />
       ) : (
        <div className="text-center space-y-2">
         <p className="text-[10px] font-black text-slate-300 ">Awaiting Photo</p>
         <ShieldCheck className="mx-auto text-slate-100" size={32} />
        </div>
       )}
       <div className="absolute bottom-0 w-full bg-slate-900/90 py-1 text-center">
        <p className="text-[7px] font-black text-white tracking-widest">Paid</p>
       </div>
     </div>

     <div className="flex-1 grid grid-cols-1 gap-5">
       <AdmitDetailRow label="Candidate Identity" value={std.full_name} isLarge />
       <div className="grid grid-cols-2 gap-8">
        <AdmitDetailRow label="Enrollment Node" value={std.roll_no} />
        <AdmitDetailRow label=" Class" value={std.class_name} />
       </div>
       <AdmitDetailRow label="Paid Guardian" value={std.father_name} />
       <div className="flex justify-between items-center bg-slate-50 px-5 py-2.5 rounded-[5px] border border-slate-100">
        <div className="flex items-center gap-3">
          <Zap size={10} className="text-purple-600" />
          <p className="text-[8px] font-black text-slate-400 tracking-widest">School UUID:</p>
        </div>
        <p className="text-sm font-mono font-black text-slate-900">{std.student_id}</p>
       </div>
     </div>
    </div>

    <div className="space-y-3">
      <div className="bg-slate-900 p-3 rounded-[5px] border border-slate-800 shadow-2xl active:scale-95 tracking-widest">
       <p className="text-[9px] font-black text-white text-center leading-tight ">
        ❗ School Security Protocol: Electronic devices prohibited in terminal zones.
       </p>
      </div>
      <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-[5px] flex justify-between items-center">
       <div className="flex items-center gap-4 text-slate-400 font-black text-[9px]">
         <Info size={12} />
         <span>Mandatory 30-minute pre-session check-in required.</span>
       </div>
       <div className="flex items-center gap-2 text-slate-400 font-black text-[9px]">
         <Star size={10} className="fill-slate-400" />
         <span className=" tracking-widest">ASM Certified</span>
       </div>
      </div>
    </div>

    <div className="mt-6 flex justify-between items-end border-t-2 border-slate-100 pt-6">
      <div className="text-center space-y-2">
       <p className="text-[8px] font-black text-slate-300 tracking-widest leading-none">Seal </p>
       <div className="w-24 h-12 border-2 border-dashed border-slate-100 rounded-[1.5rem] flex items-center justify-center bg-slate-50/30">
         <img src={localStorage.getItem('current_school_logo') || "/logo.png"} alt="" className="w-8 h-8 opacity-20 grayscale" />
       </div>
      </div>
      <div className="text-center pb-2">
       <div className="w-48 h-[2px] bg-slate-900 mx-auto"></div>
       <p className="text-[10px] font-black text-slate-900 mt-3 ">Principal Directive</p>
      </div>
    </div>
   </div>
  ))}
 </div>
);

const AdmitDetailRow = ({ label, value, isLarge = false }: any) => (
 <div className="border-b-2 border-slate-50 pb-1 group/row">
  <div className="flex items-center gap-2 mb-1">
    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/row:bg-purple-400 transition-colors" />
    <p className="text-[8px] font-black text-slate-300 tracking-widest leading-none">{label}</p>
  </div>
  <p className={`${isLarge ? 'text-2xl' : 'text-xl'} font-black text-slate-950 leading-none tracking-tight `}>
   {value || '----------'}
  </p>
 </div>
);

const TCTemplate = ({ student }: any) => (
 <div className="w-[8.27in] h-[11.69in] p-24 bg-white border-[16px] border-double border-slate-900 flex flex-col justify-between font-inter text-slate-900 relative overflow-hidden">
  <div className="absolute inset-0 bg-slate-50/30 -z-10" />
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-50/50 -rotate-12 select-none pointer-events-none">
    <div className="w-[500px] h-[500px] border-[20px] border-slate-100 rounded-full flex items-center justify-center">
     <img src={localStorage.getItem('current_school_logo') || "/logo.png"} className="w-64 h-64 grayscale opacity-20" alt="" />
    </div>
  </div>

  <div>
   <div className="text-center border-b-4 border-slate-900 pb-8 mb-16 space-y-3">
    <h1 className="text-6xl font-black  text-slate-900 leading-none uppercase">{localStorage.getItem('current_school_name') || 'Adarsh Shishu Mandir'}</h1>
    <p className="text-xs font-black  text-slate-400">School Transfer Protocol • UDise: 10032201107</p>
   </div>
   
   <div className="space-y-12 py-10">
     <div className="text-center mb-16">
      <span className="bg-slate-900 text-white px-10 py-3 rounded-full font-black  text-sm ">School Leaving Certification</span>
     </div>
     
     <p className="text-3xl leading-[2.5] font-black text-slate-800">
      This high-level directive certifies that <b className="text-slate-950 border-b-2 border-slate-900 px-2">{student.full_name}</b>, 
      registered ward of <b className="text-slate-950 border-b-2 border-slate-900 px-2">{student.father_name}</b>, 
      was an active member of the <b className="text-slate-950 border-b-2 border-slate-900 px-2">Class {student.class_name}</b> fleet. 
      Final audit confirms all institutional dues and obligations are resolved.
     </p>
   </div>
  </div>
  
  <div className="flex justify-between items-end pb-12 font-black text-xs  px-10">
    <div className="text-center space-y-4">
     <div className="w-56 h-[1.5px] bg-slate-200" />
     <p className="text-slate-300">Paid Faculty</p>
    </div>
    <div className="text-center space-y-4">
     <div className="w-56 h-[1.5px] bg-slate-900" />
     <p className="text-slate-950">Principal Directive</p>
    </div>
  </div>
 </div>
);

const DOBTemplate = ({ student }: any) => (
 <div className="w-[210mm] h-[297mm] p-24 bg-white border-[2px] border-slate-100 flex flex-col justify-between font-inter text-slate-900 relative shadow-2xl">
  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -z-10" />
  
  <div>
   <div className="flex justify-between items-start mb-24">
     <div className="w-24 h-24 bg-slate-50 flex items-center justify-center rounded-[5px] shadow-inner">
      <img src={localStorage.getItem('current_school_logo') || "/logo.png"} className="w-16 h-16 grayscale" alt="" />
     </div>
     <div className="text-right space-y-1">
      <p className="font-black text-xs text-slate-300 tracking-widest">Internal ID: {student.student_id}</p>
      <p className="font-black text-xs text-slate-300 tracking-widest">{new Date().toDateString()}</p>
     </div>
   </div>

   <h1 className="text-7xl font-black  mb-20 text-slate-900 leading-none uppercase">Birth<br/><span className="text-purple-600 uppercase">Certification</span></h1>
   
   <div className="space-y-16">
     <div className="grid grid-cols-1 gap-12 border-l-[8px] border-purple-50 pl-12 py-4">
      <div className="space-y-2">
        <p className="font-black text-xs text-slate-400 ">Identity Target</p>
        <p className="text-4xl font-black text-slate-950  tracking-tight">{student.full_name}</p>
      </div>
      <div className="space-y-2">
        <p className="font-black text-xs text-slate-400 ">Temporal Coordinate (DOB)</p>
        <p className="text-4xl font-black text-purple-600  tracking-tight">{student.date_of_birth || student.dob || 'REGISTRY NULL'}</p>
      </div>
      <div className="space-y-2">
        <p className="font-black text-xs text-slate-400 ">Guardian Node</p>
        <p className="text-xl font-black text-slate-600 ">{student.father_name}</p>
      </div>
     </div>
     
     <p className="text-slate-400 font-black text-lg leading-relaxed max-w-2xl">
      This document serves as the official institutional record for the aforementioned candidate's birth coordinates, 
      as registered within the {localStorage.getItem('current_school_name') || 'Adarsh Shishu Mandir'} primary archives.
     </p>
   </div>
  </div>
  
  <div className="flex justify-between items-end border-t-2 border-slate-50 pt-16 ">
    <div className="space-y-2">
     <p className="text-[10px] font-black text-slate-300 tracking-widest leading-none">Authorization Date</p>
     <p className="text-xl font-black text-slate-900 ">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div className="text-center space-y-4 pr-10">
     <div className="w-56 h-[3px] bg-slate-900" />
     <p className="text-xs font-black  text-slate-900">Signature of Authority</p>
    </div>
  </div>
 </div>
);

const GatePassTemplate = ({ student }: any) => (
 <div className="w-[100mm] h-[65mm] p-8 border-[6px] border-rose-600 bg-white text-left m-6 rounded-[5px] relative overflow-hidden shadow-2xl font-inter">
  <div className="absolute -right-6 -top-6 text-rose-50 -z-10 rotate-12">
    <DoorOpen size={120} />
  </div>
  
  <div className="flex justify-between items-center border-b-2 border-rose-100 pb-3 mb-4">
    <h2 className="text-2xl font-black text-rose-600 leading-none uppercase">Gate Pass</h2>
    <div className="bg-rose-600 text-white px-4 py-1 rounded-full text-[9px] font-black tracking-widest ">Paid</div>
  </div>
  
  <div className="space-y-3">
    <div className="space-y-0.5">
     <p className="text-[8px] font-black text-slate-300 tracking-widest leading-none">Identity</p>
     <p className="font-black text-lg text-slate-900 tracking-tight truncate">{student.full_name}</p>
    </div>
    <div className="flex justify-between items-end">
     <div className="space-y-0.5">
       <p className="text-[8px] font-black text-slate-300 tracking-widest leading-none">Class</p>
       <p className="font-black text-base text-slate-900 ">Class {student.class_name}</p>
     </div>
     <div className="text-right space-y-0.5">
       <p className="text-[8px] font-black text-slate-300 tracking-widest leading-none">Emission Time</p>
       <p className="font-black text-base text-rose-600 ">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
     </div>
    </div>
  </div>
  
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[7px] font-black text-rose-300 ">
    <Scissors size={10} />
    <span>Operational Authorization Required</span>
    <Scissors size={10} />
  </div>
 </div>
);

export default DocumentHub;
