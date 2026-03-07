import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { 
  Search, Printer, FileText, CreditCard, 
  Award, DoorOpen, GraduationCap, RefreshCw, UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentHub = () => {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<'ICARD' | 'TC' | 'DOB' | 'GATE' | 'ADMIT' | null>(null);
  const componentRef = useRef<any>();

  // 🔥 ADVANCED SEARCH LOGIC
  const fetchStudent = async () => {
    if (!studentId.trim()) return toast.error("कृपया Name, Roll No या ID डालें!");
    
    setLoading(true);
    const cleanSearch = studentId.trim();
    const isNumber = !isNaN(Number(cleanSearch));

    try {
      // ✅ यह Name (ilike), Roll (eq), ID (eq), और Class (eq) सब चेक करेगा
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`student_id.eq.${isNumber ? cleanSearch : 0},roll_no.eq.${cleanSearch},full_name.ilike.%${cleanSearch}%,class_name.eq.${cleanSearch}`)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("कोई छात्र नहीं मिला! कृपया सही जानकारी डालें।");
        setStudent(null);
      } else {
        setStudent(data);
        toast.success(`${data.full_name} (Roll: ${data.roll_no}) का डेटा लोड हो गया! ✅`);
      }
    } catch (err: any) {
      toast.error("Database Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="text-center space-y-2">
           <h1 className="text-5xl font-black text-blue-900 uppercase italic tracking-tighter">Document Hub</h1>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">ASM Academic Records v3.0</p>
        </header>

        {/* Search Engine */}
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-blue-50 flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400" size={24} />
            <input 
              type="text" 
              placeholder="नाम, रोल नंबर या क्लास सर्च करें..." 
              className="w-full pl-16 pr-6 py-6 bg-blue-50/50 rounded-[2rem] font-black text-xl text-blue-900 border-none outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchStudent()}
            />
          </div>
          <button 
            onClick={fetchStudent} 
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <UserCheck />}
            {loading ? 'Finding...' : 'Fetch Student'}
          </button>
        </div>

        {/* Document Selector */}
        <AnimatePresence>
          {student && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
              <DocBtn icon={CreditCard} label="Identity Card" active={activeDoc === 'ICARD'} onClick={() => setActiveDoc('ICARD')} />
              <DocBtn icon={FileText} label="Transfer (TC)" active={activeDoc === 'TC'} onClick={() => setActiveDoc('TC')} />
              <DocBtn icon={Award} label="Birth Cert" active={activeDoc === 'DOB'} onClick={() => setActiveDoc('DOB')} />
              <DocBtn icon={GraduationCap} label="Admit Card" active={activeDoc === 'ADMIT'} onClick={() => setActiveDoc('ADMIT')} />
              <DocBtn icon={DoorOpen} label="Gate Pass" active={activeDoc === 'GATE'} onClick={() => setActiveDoc('GATE')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Engine */}
        <div className="bg-white p-6 md:p-12 rounded-[4rem] shadow-2xl border border-gray-50 flex flex-col items-center min-h-[400px]">
          {student && activeDoc ? (
            <div className="w-full space-y-10 flex flex-col items-center">
              <div className="overflow-auto w-full bg-slate-100 p-6 md:p-16 rounded-[3rem] shadow-inner flex justify-center">
                <div ref={componentRef} className="bg-white shadow-2xl ring-1 ring-black/5">
                  {activeDoc === 'ICARD' && <ICardTemplate student={student} />}
                  {activeDoc === 'TC' && <TCTemplate student={student} />}
                  {activeDoc === 'DOB' && <DOBTemplate student={student} />}
                  {activeDoc === 'ADMIT' && <AdmitTemplate student={student} />}
                  {activeDoc === 'GATE' && <GatePassTemplate student={student} />}
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint} 
                className="bg-emerald-500 text-white px-16 py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center gap-4 shadow-2xl shadow-emerald-100 text-xl"
              >
                <Printer size={28} /> Print Document
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 opacity-20">
               <FileText size={80} />
               <p className="font-black text-sm uppercase tracking-[0.4em] mt-6 italic">Select Document To Preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// UI Components
const DocBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 active:scale-95 ${active ? 'border-blue-600 bg-white text-blue-600 shadow-2xl' : 'bg-white border-transparent text-gray-400 hover:border-blue-100 hover:text-blue-400'}`}>
    <Icon size={32} />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

/* --- TEMPLATES (Fixed Styling) --- */

const ICardTemplate = ({ student }: any) => (
  <div className="w-[3.5in] h-[2.2in] flex bg-white border-[3px] border-blue-900 rounded-2xl overflow-hidden font-sans shadow-lg m-2">
    <div className="w-[1.2in] bg-blue-900 text-white flex flex-col items-center justify-center p-3">
      <div className="w-20 h-20 rounded-2xl border-2 border-white bg-white/10 overflow-hidden mb-2 shadow-lg">
        <img src={student.photo_url || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
      </div>
      <p className="text-[9px] font-black tracking-widest opacity-80 uppercase">Roll No</p>
      <p className="text-sm font-black italic">{student.roll_no}</p>
    </div>
    <div className="flex-1 p-4 relative flex flex-col justify-between">
      <div>
        <h2 className="text-[16px] font-black text-blue-900 uppercase leading-tight">Adarsh Shishu Mandir</h2>
        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-1">Primary Academic Institution</p>
        <div className="space-y-1">
          <p className="text-[13px] font-black text-gray-800 uppercase italic">{student.full_name}</p>
          <div className="grid grid-cols-1 gap-0 text-[10px] font-bold text-gray-600 uppercase">
             <p><span className="opacity-50 text-[8px]">Class:</span> {student.class_name}</p>
             <p><span className="opacity-50 text-[8px]">Father:</span> {student.father_name}</p>
             <p><span className="opacity-50 text-[8px]">Mob:</span> {student.contact_number}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-end">
         <div className="text-[6px] font-bold text-blue-900/50 uppercase leading-none italic">ASM Digital Hub<br/>ID: {student.student_id}</div>
         <div className="text-center">
            <div className="w-10 border-b border-black mb-1"></div>
            <p className="text-[7px] font-black uppercase leading-none">Principal</p>
         </div>
      </div>
    </div>
  </div>
);

const TCTemplate = ({ student }: any) => (
  <div className="w-[8.27in] h-[11.69in] p-20 bg-white border-[16px] border-double border-blue-900 relative text-left">
    <div className="text-center border-b-4 border-blue-900 pb-6 mb-12">
      <h1 className="text-5xl font-black text-blue-900 tracking-tighter uppercase italic">Adarsh Shishu Mandir</h1>
      <p className="font-bold text-gray-500 uppercase text-xs tracking-widest mt-2"> Basantpatti, Purnahiya, Sheohar (Bihar) | Udise-Code: 10032201107 </p>
      <div className="mt-6 inline-block bg-blue-900 text-white px-10 py-2 rounded-full font-black uppercase tracking-[0.3em] text-sm shadow-xl shadow-blue-100">Transfer Certificate</div>
    </div>
    <div className="space-y-10 text-xl leading-[2.5] font-serif italic text-gray-800">
      <p>Certified that <b className="border-b-2 border-black/20 px-4 text-blue-900 uppercase font-black not-italic">{student.full_name}</b>,</p>
      <p>Guardian Name: <b className="border-b-2 border-black/20 px-4">{student.father_name}</b>,</p>
      <p>Successfully completed education in Class <b className="border-b-2 border-black/20 px-4">{student.class_name}</b> at this institution.</p>
      <p>Date of Birth: <b className="border-b-2 border-black/20 px-4">{student.date_of_birth || 'As per record'}</b>.</p>
      <p>Account Clearance: <b className="border-b-2 border-black/20 px-4">All Dues Paid</b>. Behavior: <b className="border-b-2 border-black/20 px-4">Excellent</b>.</p>
    </div>
    <div className="absolute bottom-28 left-20 right-20 flex justify-between">
      <div className="text-center font-black uppercase text-xs border-t-2 border-black pt-4 px-6">Class Teacher</div>
      <div className="text-center font-black uppercase text-xs border-t-2 border-black pt-4 px-6">Principal Signature</div>
    </div>
  </div>
);

// Admit Card Template
const AdmitTemplate = ({ student }: any) => (
  <div className="w-[6.5in] p-10 border-[6px] border-black bg-white text-left m-4 shadow-2xl">
    <div className="text-center border-b-4 border-black mb-8 pb-4">
      <h2 className="text-3xl font-black uppercase italic tracking-tighter">Annual Exam Admit Card</h2>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Session 2026-27</p>
    </div>
    <div className="flex gap-10">
       <div className="w-32 h-32 border-4 border-black bg-gray-50 flex items-center justify-center font-black text-gray-200 text-xs">PASTE PHOTO</div>
       <div className="space-y-4 flex-1">
         <div className="border-b border-gray-100 pb-2"><p className="text-[9px] font-black uppercase text-gray-400 italic">Candidate Name</p><p className="font-black text-2xl text-blue-900 uppercase">{student.full_name}</p></div>
         <div className="grid grid-cols-2 gap-4">
            <div><p className="text-[9px] font-black uppercase text-gray-400 italic">Roll Number</p><p className="font-black text-xl">{student.roll_no}</p></div>
            <div><p className="text-[9px] font-black uppercase text-gray-400 italic">Class</p><p className="font-black text-xl">{student.class_name}</p></div>
         </div>
       </div>
    </div>
    <div className="mt-12 bg-black text-white p-4 rounded-xl text-center font-black uppercase text-[10px] tracking-widest shadow-lg">Valid only with Institutional Seal</div>
  </div>
);

// Gate Pass Template
const GatePassTemplate = ({ student }: any) => (
  <div className="w-[4in] h-[2.5in] p-6 border-[4px] border-red-600 bg-red-50/50 text-left m-4 shadow-xl rounded-3xl relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
    <div className="text-center mb-4">
      <h3 className="text-red-600 font-black uppercase tracking-tighter text-2xl italic">Gate Pass</h3>
    </div>
    <div className="text-sm space-y-2 font-bold text-red-900">
      <p className="uppercase"><span className="opacity-50 text-[10px]">Name:</span> {student.full_name}</p>
      <p className="uppercase"><span className="opacity-50 text-[10px]">Class:</span> {student.class_name}</p>
      <p className="uppercase"><span className="opacity-50 text-[10px]">Time:</span> {new Date().toLocaleTimeString()}</p>
      <div className="border-b-2 border-red-200 w-full mt-4"></div>
      <p className="text-[8px] font-black uppercase mt-1 opacity-60">Authorized Signatory Required</p>
    </div>
  </div>
);

// DOB Cert Template
const DOBTemplate = ({ student }: any) => (
  <div className="w-[8.27in] p-24 bg-white border-2 border-gray-100 text-left shadow-lg">
    <div className="text-center mb-20">
      <h1 className="text-4xl font-black uppercase underline decoration-blue-500 decoration-8 underline-offset-8 italic">Birth Certificate</h1>
      <p className="text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-[0.4em]">Official Institutional Record</p>
    </div>
    <p className="text-2xl leading-loose font-serif">This is to officially certify that <b className="text-blue-900 border-b-2 border-blue-100 px-2 uppercase">{student.full_name}</b>, daughter/son of <b className="px-2">{student.father_name}</b>, is a bonafide student of <b>Adarsh Shishu Mandir</b>.</p>
    <p className="text-2xl leading-loose mt-10 font-serif">As per our admission registry, the student's date of birth is recorded as <b className="bg-blue-50 px-4 py-1 rounded-xl text-blue-700 italic border border-blue-100">{student.date_of_birth || student.dob || 'NOT RECORDED'}</b>.</p>
    <div className="mt-32 flex justify-between items-end">
       <div className="font-bold text-gray-400 text-sm">Issue Date: {new Date().toLocaleDateString('en-IN')}</div>
       <div className="text-center">
          <div className="w-48 border-b-2 border-black mb-2"></div>
          <p className="font-black uppercase italic text-sm tracking-widest">Office of Principal</p>
       </div>
    </div>
  </div>
);

export default DocumentHub;
