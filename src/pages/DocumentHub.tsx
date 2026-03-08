import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { 
  Search, Printer, FileText, CreditCard, 
  Award, DoorOpen, GraduationCap, RefreshCw, UserCheck, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentHub = () => {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any>(null); // Single student info
  const [studentsList, setStudentsList] = useState<any[]>([]); // Bulk students for admit cards
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<'ICARD' | 'TC' | 'DOB' | 'GATE' | 'ADMIT' | null>(null);
  const componentRef = useRef<any>();

  // 🔥 ADVANCED SEARCH & BULK LOGIC
  const fetchStudent = async () => {
    if (!studentId.trim()) return toast.error("कृपया Name, Roll No या Class डालें!");
    
    setLoading(true);
    setStudentsList([]); // Reset previous list
    const cleanSearch = studentId.trim();
    const isNumber = !isNaN(Number(cleanSearch));

    try {
      // 1. सबसे पहले चेक करें कि क्या यह पूरी क्लास के लिए सर्च है?
      const { data: bulkData, error: bulkError } = await supabase
        .from('students')
        .select('*')
        .eq('class_name', cleanSearch)
        .order('roll_no', { ascending: true });

      if (bulkData && bulkData.length > 0) {
        setStudentsList(bulkData);
        setStudent(bulkData[0]); // Preview के लिए पहला स्टूडेंट सेट करें
        toast.success(`${bulkData.length} छात्रों की क्लास लोड हो गई! 🚀`);
        setLoading(false);
        return;
      }

      // 2. अगर क्लास नहीं है, तो सिंगल स्टूडेंट सर्च करें
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`student_id.eq.${isNumber ? cleanSearch : 0},roll_no.eq.${cleanSearch},full_name.ilike.%${cleanSearch}%`)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("कोई डेटा नहीं मिला!");
        setStudent(null);
      } else {
        setStudent(data);
        setStudentsList([data]); // सिंगल के लिए लिस्ट में सिर्फ एक
        toast.success(`${data.full_name} लोड हो गया! ✅`);
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="text-center">
           <h1 className="text-5xl font-black text-blue-900 uppercase italic tracking-tighter">Document Hub</h1>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">ASM Institutional Printing Engine</p>
        </header>

        {/* Search Bar */}
        <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl border border-blue-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400" />
            <input 
              type="text" 
              placeholder="नाम, रोल नंबर या क्लास (जैसे '10A') डालें..." 
              className="w-full pl-14 pr-6 py-5 bg-blue-50/50 rounded-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchStudent()}
            />
          </div>
          <button onClick={fetchStudent} disabled={loading} className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3">
            {loading ? <RefreshCw className="animate-spin" /> : <Users size={20}/>}
            {loading ? 'Searching...' : 'Find Student/Class'}
          </button>
        </div>

        {/* Document Tabs */}
        {student && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <DocBtn icon={CreditCard} label="Identity Card" active={activeDoc === 'ICARD'} onClick={() => setActiveDoc('ICARD')} />
            <DocBtn icon={FileText} label="Transfer (TC)" active={activeDoc === 'TC'} onClick={() => setActiveDoc('TC')} />
            <DocBtn icon={Award} label="Birth Cert" active={activeDoc === 'DOB'} onClick={() => setActiveDoc('DOB')} />
            <DocBtn icon={GraduationCap} label="Admit Cards (Bulk)" active={activeDoc === 'ADMIT'} onClick={() => setActiveDoc('ADMIT')} />
            <DocBtn icon={DoorOpen} label="Gate Pass" active={activeDoc === 'GATE'} onClick={() => setActiveDoc('GATE')} />
          </div>
        )}

        {/* Printing Area */}
        <div className="bg-white p-6 md:p-12 rounded-[4rem] shadow-2xl border border-gray-50 flex flex-col items-center">
          {student && activeDoc ? (
            <div className="w-full flex flex-col items-center space-y-8">
              <div className="overflow-auto w-full bg-slate-200 p-4 md:p-10 rounded-3xl shadow-inner flex justify-center">
                <div ref={componentRef} className="bg-white shadow-2xl">
                  {activeDoc === 'ICARD' && <ICardTemplate student={student} />}
                  {activeDoc === 'TC' && <TCTemplate student={student} />}
                  {activeDoc === 'DOB' && <DOBTemplate student={student} />}
                  
                  {/* ✅ BULK ADMIT CARDS RENDERING (6 per page) */}
                  {activeDoc === 'ADMIT' && <AdmitGrid students={studentsList} />}
                  
                  {activeDoc === 'GATE' && <GatePassTemplate student={student} />}
                </div>
              </div>
              <button onClick={handlePrint} className="bg-emerald-600 text-white px-16 py-5 rounded-full font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                <Printer size={24} /> Print {studentsList.length > 1 ? `Full Class (${studentsList.length})` : 'Document'}
              </button>
            </div>
          ) : (
            <p className="py-20 text-gray-300 font-black uppercase tracking-[0.3em] italic">Select Document Type</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DocBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-3 ${active ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xl' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}>
    <Icon size={28} />
    <span className="text-[9px] font-black uppercase tracking-widest text-center">{label}</span>
  </button>
);
/* --- 📄 2-CARDS PER PAGE ADMIT GRID (ALERT AT BOTTOM) --- */
const AdmitGrid = ({ students }: { students: any[] }) => (
  <div className="flex flex-col gap-[10mm] bg-white w-[210mm] mx-auto p-[10mm] custom-print-style">
    {students.map((std, idx) => (
      <div 
        key={idx} 
        className="relative border-[3px] border-black p-8 h-[130mm] w-full flex flex-col justify-between overflow-hidden bg-white shadow-xl"
        style={{ pageBreakInside: 'avoid' }}
      >
        
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-900"></div>

        {/* 1. SCHOOL HEADER WITH DUAL LOGO */}
        <div className="flex justify-between items-center border-b-2 border-blue-900/20 pb-4 mb-6">
           {/* Left Logo */}
           <img src="/logo.png" alt="logo" className="w-16 h-16 object-contain" />
           
           <div className="text-center flex-1 mx-4">
              <h1 className="text-4xl font-black text-blue-950 uppercase italic tracking-tighter leading-none">Adarsh Shishu Mandir</h1>
              <p className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Basantpatti, Purnahiya (Sheohar) Bihar | Udise: 10032201107</p>
              <div className="inline-block bg-blue-950 text-white px-8 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mt-3 shadow-lg">Annual Examination Admit Card 2026</div>
           </div>

           {/* Right Logo */}
           <img src="/logo.png" alt="logo" className="w-16 h-16 object-contain" />
        </div>

        {/* 2. CANDIDATE DETAILS AREA */}
        <div className="flex gap-10 items-start flex-1 mb-4">
          {/* Photo Frame */}
          <div className="w-36 h-44 border-[3px] border-black bg-gray-50 flex flex-col items-center justify-center relative flex-shrink-0 shadow-inner">
             <p className="text-[10px] font-black text-gray-300 uppercase italic">Paste Photo</p>
             <div className="absolute bottom-2 w-full text-center border-t border-gray-200 pt-1">
                <p className="text-[7px] font-bold text-gray-400 uppercase">Self Attested</p>
             </div>
          </div>

          {/* Details Table */}
          <div className="flex-1 space-y-4">
             <AdmitDetailRow label="CANDIDATE NAME" value={std.full_name} isLarge />
             <div className="grid grid-cols-2 gap-6">
                <AdmitDetailRow label="ROLL NUMBER" value={std.roll_no} />
                <AdmitDetailRow label="CLASS GRADE" value={std.class_name} />
             </div>
             <AdmitDetailRow label="GUARDIAN NAME" value={std.father_name} />
             <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">REGISTRATION ID:</p>
                <p className="text-sm font-mono font-black text-blue-900">{std.student_id}</p>
             </div>
          </div>
        </div>

        {/* 3. ALERT MESSAGE & INSTRUCTIONS (Now at Bottom) */}
        <div className="space-y-3">
           <div className="bg-rose-50 border-2 border-dashed border-rose-200 p-3 rounded-xl">
              <p className="text-[9px] font-black text-rose-700 uppercase text-center leading-tight tracking-wider">
                ❗ चेतावनी: प्रवेश पत्र परीक्षा हॉल में प्रतिदिन लाना अनिवार्य है। मोबाइल, कैलकुलेटर या कोई भी इलेक्ट्रॉनिक सामान लाना सख्त मना है।
              </p>
           </div>
           
           <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <p className="text-[9px] font-bold leading-relaxed text-gray-600 italic">
                * परीक्षार्थी को परीक्षा कक्ष में 30 मिनट पूर्व पहुँचना अनिवार्य है। <br/>
                * परीक्षा शुरू होने के 1 घंटे बाद तक किसी भी परीक्षार्थी को कक्ष छोड़ने की अनुमति नहीं दी जाएगी।
              </p>
           </div>
        </div>

        {/* 4. FOOTER: OFFICE SEAL & PRINCIPAL SIGNATURE */}
        <div className="mt-6 flex justify-between items-end border-t-2 border-gray-100 pt-5">
           <div className="text-center">
              <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1 italic">School Seal</p>
              <div className="w-24 h-12 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center opacity-30">
                 <img src="/logo.png" alt="" className="w-6 h-6 grayscale" />
              </div>
           </div>
           
           <div className="text-center relative pb-2">
              <div className="w-44 border-b-2 border-blue-950 mx-auto"></div>
              <p className="text-[11px] font-black uppercase text-blue-950 tracking-[0.2em] mt-2 italic">Principal Signature</p>
           </div>
        </div>
      </div>
    ))}
  </div>
);

// Helper for Detail Rows
const AdmitDetailRow = ({ label, value, isLarge = false }: any) => (
  <div className="border-b-2 border-gray-100 pb-1">
    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">{label}</p>
    <p className={`${isLarge ? 'text-2xl' : 'text-xl'} font-black text-blue-950 uppercase leading-none tracking-tighter`}>
      {value || '----------'}
    </p>
  </div>
);



/* --- PREVIOUS TEMPLATES (RETAINED) --- */

const ICardTemplate = ({ student }: any) => (
  <div className="w-[3.5in] h-[2.2in] flex bg-white border-[3px] border-blue-900 rounded-2xl overflow-hidden font-sans m-2 shadow-lg">
    <div className="w-[1.2in] bg-blue-900 text-white flex flex-col items-center justify-center p-3">
      <div className="w-20 h-20 rounded-2xl border-2 border-white overflow-hidden mb-2 bg-white/20">
        <img src={student.photo_url || "https://via.placeholder.com/150"} className="w-full h-full object-cover" alt="" />
      </div>
      <p className="text-[10px] font-black italic">Roll: {student.roll_no}</p>
    </div>
    <div className="flex-1 p-4 flex flex-col justify-between">
      <h2 className="text-[16px] font-black text-blue-900 uppercase leading-none">Adarsh Shishu Mandir</h2>
      <div className="mt-2 space-y-1">
         <p className="text-[12px] font-black uppercase italic">{student.full_name}</p>
         <p className="text-[9px] font-bold text-gray-500 uppercase">Class: {student.class_name}</p>
         <p className="text-[9px] font-bold text-gray-500 uppercase">Guardian: {student.father_name}</p>
      </div>
      <div className="flex justify-end"><div className="text-center w-12 border-t border-black mt-4"><p className="text-[6px] font-black">Principal</p></div></div>
    </div>
  </div>
);

const TCTemplate = ({ student }: any) => (
  <div className="w-[8.27in] h-[11.69in] p-16 bg-white border-[12px] border-double border-blue-900 text-left relative">
    <div className="text-center border-b-2 border-blue-900 pb-4 mb-10">
      <h1 className="text-4xl font-black uppercase text-blue-900 leading-none">Adarsh Shishu Mandir</h1>
      <p className="text-[10px] font-bold mt-2">Basantpatti, Purnahiya (Sheohar) | Udise: 10032201107</p>
    </div>
    <p className="text-2xl leading-[2.5] font-serif italic text-gray-800">
      Certified that <b>{student.full_name}</b>, Ward of <b>{student.father_name}</b>, was a student of Class <b>{student.class_name}</b>. All dues are cleared.
    </p>
    <div className="absolute bottom-20 left-16 right-16 flex justify-between font-bold text-sm uppercase border-t pt-4 border-gray-100">
       <p>Teacher Sign</p><p>Principal Seal</p>
    </div>
  </div>
);

const DOBTemplate = ({ student }: any) => (
  <div className="w-[8.27in] p-20 bg-white border-2 border-gray-100 text-left">
    <h1 className="text-4xl font-black uppercase underline italic mb-10 text-center text-blue-900">Birth Certificate</h1>
    <p className="text-2xl leading-relaxed font-serif">Student Name: <b className="uppercase">{student.full_name}</b></p>
    <p className="text-2xl leading-relaxed font-serif mt-4">Date of Birth: <b>{student.date_of_birth || student.dob || 'As per Register'}</b></p>
    <div className="mt-40 flex justify-between items-end border-t pt-10"><p className="text-gray-400">Date: {new Date().toLocaleDateString()}</p><div className="w-40 border-b border-black"></div></div>
  </div>
);

const GatePassTemplate = ({ student }: any) => (
  <div className="w-[4in] h-[2.5in] p-6 border-4 border-red-600 bg-red-50 text-left m-4 rounded-3xl">
    <h2 className="text-2xl font-black uppercase text-red-600 text-center mb-4">Gate Pass</h2>
    <p className="font-bold uppercase text-sm">Name: {student.full_name}</p>
    <p className="font-bold uppercase text-sm">Class: {student.class_name}</p>
    <p className="font-bold uppercase text-sm mt-2">Time: {new Date().toLocaleTimeString()}</p>
  </div>
);

export default DocumentHub;
