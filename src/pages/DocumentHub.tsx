import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { 
  Search, Printer, FileText, CreditCard, 
  Award, DoorOpen, GraduationCap, RefreshCw, UserCheck, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentICard from './StudentICard';

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
        setStudent(null); // 👈 Clear individual student to show bulk list
        toast.success(`${classData.length} students loaded for Class ${cleanSearch}! 🚀`);
        setLoading(false);
        return;
      }

      // 2. Advanced Search (Class + Name or name-only)
      let query = supabase.from('students').select('*');
      
      const parts = cleanSearch.split(/\s+/);
      if (parts.length > 1) {
        // Try to identify which part is the class (usually a number or short string)
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center no-print">
           <h1 className="text-5xl font-black text-blue-900 uppercase italic tracking-tighter">Document Hub</h1>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">ASM Institutional Printing Engine</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl border border-blue-50 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400" />
              <input 
                type="text" 
                placeholder="नाम या रोल नंबर डालें..." 
                className="w-full pl-14 pr-6 py-5 bg-blue-50/50 rounded-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchStudent()}
              />
            </div>
            <button onClick={fetchStudent} disabled={loading} className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3">
              {loading ? <RefreshCw className="animate-spin" /> : <Users size={20}/>}
              {loading ? 'Search' : 'Find Student'}
            </button>
          </div>

          <div className="bg-blue-900 p-6 md:p-8 rounded-[3rem] shadow-2xl border border-blue-800 flex flex-col justify-center">
            <label className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-2 ml-2">Quick Class Load</label>
            <select 
              className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl font-black text-white outline-none focus:ring-4 focus:ring-blue-500/30"
              onChange={(e) => {
                setStudentId(e.target.value);
                // Trigger fetch immediately
                setTimeout(() => {
                  const btn = document.getElementById('class-fetch-btn');
                  if (btn) btn.click();
                }, 10);
              }}
            >
              <option value="" className="text-gray-900">Select Class</option>
              {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(cls => (
                <option key={cls} value={cls} className="text-gray-900">Class {cls}</option>
              ))}
            </select>
            <button id="class-fetch-btn" onClick={fetchStudent} className="hidden"></button>
          </div>
        </div>

        {/* 📑 DOCUMENT TYPE SELECTION (Always visible if students loaded) */}
        {studentsList.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 no-print animate-in fade-in zoom-in-95 duration-500">
             <DocBtn icon={CreditCard} label="Identity Card" active={activeDoc === 'ICARD'} onClick={() => setActiveDoc('ICARD')} />
             <DocBtn icon={FileText} label="Transfer (TC)" active={activeDoc === 'TC'} onClick={() => setActiveDoc('TC')} />
             <DocBtn icon={Award} label="Birth Cert" active={activeDoc === 'DOB'} onClick={() => setActiveDoc('DOB')} />
             <DocBtn icon={GraduationCap} label="Admit Cards (Bulk)" active={activeDoc === 'ADMIT'} onClick={() => setActiveDoc('ADMIT')} />
             <DocBtn icon={DoorOpen} label="Gate Pass" active={activeDoc === 'GATE'} onClick={() => setActiveDoc('GATE')} />
          </div>
        )}

        {/* 📚 MULTIPLE RECORDS SELECTION & BULK PRINT */}
        {studentsList.length > 1 && (
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-blue-50 animate-in fade-in slide-in-from-bottom-5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-blue-900 uppercase tracking-widest flex items-center gap-3">
                   <Users className="text-blue-500" /> {student ? "Full Class List" : `Multiple Records Found (${studentsList.length})`}
                </h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
               {studentsList.map((std) => (
                 <button 
                   key={std.id}
                   onClick={() => setStudent(std)}
                   className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-600 group transition-all text-left border border-blue-100 hover:border-blue-600 hover:shadow-lg"
                 >
                   <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-black text-blue-600 group-hover:text-blue-600 border border-blue-100 shadow-sm overflow-hidden flex-shrink-0">
                      {std.photo_url ? (
                        <img src={std.photo_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        std.full_name.charAt(0)
                      )}
                   </div>
                   <div className="min-w-0">
                     <p className="font-black text-xs text-blue-950 group-hover:text-white uppercase truncate">{std.full_name}</p>
                     <p className="text-[10px] font-bold text-blue-500 group-hover:text-blue-200 uppercase mt-0.5">
                       Class {std.class_name} • Roll #{std.roll_no}
                     </p>
                     <p className="text-[9px] font-bold text-gray-400 group-hover:text-blue-100 uppercase truncate mt-0.5">
                       F: {std.father_name}
                     </p>
                   </div>
                   <UserCheck className="ml-auto text-blue-200 group-hover:text-white" size={18} />
                 </button>
               ))}
             </div>
             
             {/* 🖨️ PRINTABLE AREA FOR BULK OPERATION */}
             <div className="hidden print:block mt-10">
                {activeDoc === 'ADMIT' ? (
                  <AdmitGrid students={studentsList} />
                ) : (
                  <div className="flex flex-wrap gap-[5mm] justify-center bg-white p-[5mm]">
                    {studentsList.map((std) => (
                      <div key={std.id} className="break-inside-avoid py-[5mm]">
                        {(!activeDoc || activeDoc === 'ICARD') && <StudentICard student={std} />}
                        {activeDoc === 'GATE' && <GatePassTemplate student={std} />}
                        {/* More individual bulk templates can be added here */}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}


        <div className="bg-white p-6 md:p-12 rounded-[4rem] shadow-2xl border border-gray-50 flex flex-col items-center">
          {(student || (studentsList.length > 0 && activeDoc)) ? (
            <div className="w-full flex flex-col items-center space-y-8">
              <div className="overflow-auto w-full bg-slate-200 p-4 md:p-10 rounded-3xl shadow-inner flex justify-center">
                <div ref={componentRef} className="bg-white shadow-2xl p-4">
                  {student ? (
                    // 👤 INDIVIDUAL PREVIEW
                    <>
                      {activeDoc === 'ICARD' && <StudentICard student={student} />}
                      {activeDoc === 'TC' && <TCTemplate student={student} />}
                      {activeDoc === 'DOB' && <DOBTemplate student={student} />}
                      {activeDoc === 'ADMIT' && <AdmitGrid students={[student]} />}
                      {activeDoc === 'GATE' && <GatePassTemplate student={student} />}
                    </>
                  ) : (
                    // 📚 BULK CLASS PREVIEW
                    <div className="flex flex-wrap gap-[5mm] justify-center bg-white p-[5mm]">
                      {activeDoc === 'ADMIT' ? (
                        <AdmitGrid students={studentsList} />
                      ) : (
                        studentsList.map((std) => (
                          <div key={std.id} className="break-inside-avoid shadow-lg mb-4">
                            {activeDoc === 'ICARD' && <StudentICard student={std} />}
                            {activeDoc === 'GATE' && <GatePassTemplate student={std} />}
                            {activeDoc === 'TC' && <TCTemplate student={std} />}
                            {activeDoc === 'DOB' && <DOBTemplate student={std} />}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={handlePrint} 
                className="bg-blue-950 text-white px-16 py-6 rounded-full font-black uppercase tracking-widest flex items-center gap-4 shadow-2xl hover:bg-black hover:scale-105 transition-all text-sm group"
              >
                <Printer size={28} className="group-hover:rotate-12 transition-transform" /> 
                Print {student ? "Individual" : `Full Class (${studentsList.length})`} {activeDoc} Cards
              </button>
            </div>
          ) : (
            <p className="py-20 text-gray-300 font-black uppercase tracking-[0.3em] italic">Select Document Type to Preview</p>
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
/* --- 📄 2-CARDS PER PAGE ADMIT GRID (FINAL LOGO FIX) --- */
const AdmitGrid = ({ students }: { students: any[] }) => (
  <div className="flex flex-col gap-[8mm] bg-white w-[210mm] mx-auto p-[8mm] custom-print-style">
    {students.map((std, idx) => (
      <div 
        key={idx} 
        className="relative border-[2.5px] border-black p-6 h-[125mm] w-full flex flex-col justify-between overflow-hidden bg-white shadow-lg"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-900"></div>

        <div className="flex justify-between items-center border-b-[1.5px] border-blue-900/20 pb-3 mb-4">
           
           {/* ✅ Logo Fixed: Using Arbitrary values for 68px (17 * 4) */}
           <div className="w-[68px] h-[68px] flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="logo" 
                className="w-full h-full object-contain" 
              />
           </div>
           
           <div className="text-center flex-1 mx-3">
              <h1 className="text-3xl font-black text-blue-950 uppercase italic tracking-tighter leading-none">Adarsh Shishu Mandir</h1>
              <p className="text-[8px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest leading-none">Basantpatti, Purnahiya (Sheohar) Bihar | Udise: 10032201107</p>
              <div className="inline-block bg-blue-950 text-white px-6 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 shadow-lg">Annual Exam Admit Card 2026</div>
           </div>

           {/* बैलेंस के लिए खाली जगह */}
           <div className="w-[68px] h-[68px]"></div>
        </div>

        {/* --- बाकी का कोड (Details, Alert, Footer) वैसा ही रहेगा --- */}
        <div className="flex gap-8 items-start flex-1 mb-3">
          <div className="w-32 h-36 border-[2px] border-black bg-gray-50 flex flex-col items-center justify-center relative flex-shrink-0 overflow-hidden shadow-inner">
             {std.photo_url ? (
               <img src={std.photo_url} className="w-full h-full object-cover" alt="Student" />
             ) : (
               <>
                 <p className="text-[9px] font-black text-gray-300 uppercase italic">Paste Photo</p>
                 <div className="absolute bottom-1.5 w-full text-center border-t border-gray-200 pt-1">
                    <p className="text-[6px] font-bold text-gray-400 uppercase">Self Attested</p>
                 </div>
               </>
             )}
          </div>

          <div className="flex-1 space-y-3">
             <AdmitDetailRow label="CANDIDATE NAME" value={std.full_name} isLarge />
             <div className="grid grid-cols-2 gap-4">
                <AdmitDetailRow label="ROLL NUMBER" value={std.roll_no} />
                <AdmitDetailRow label="CLASS GRADE" value={std.class_name} />
             </div>
             <AdmitDetailRow label="GUARDIAN NAME" value={std.father_name} />
             <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest italic">REG. ID:</p>
                <p className="text-xs font-mono font-black text-blue-900">{std.student_id}</p>
             </div>
          </div>
        </div>

        <div className="space-y-2">
           <div className="bg-rose-50 border border-dashed border-rose-200 p-2 rounded-lg">
              <p className="text-[8px] font-black text-rose-700 uppercase text-center leading-tight tracking-wide">
                ❗ चेतावनी: मोबाइल या कोई भी इलेक्ट्रॉनिक सामान लाना सख्त मना है।
              </p>
           </div>
           <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-[8px] font-bold leading-tight text-gray-500 italic">
                * कक्ष में 30 मिनट पूर्व पहुँचना अनिवार्य है। <br/>
                * परीक्षा के दौरान बिना अनुमति कक्ष न छोड़ें।
              </p>
           </div>
        </div>

        <div className="mt-4 flex justify-between items-end border-t border-gray-100 pt-4">
            <div className="text-center">
              <p className="text-[7px] font-black uppercase text-gray-300 tracking-widest leading-none mb-1">School Seal</p>
              <div className="w-20 h-10 border border-dashed border-gray-100 rounded-xl flex items-center justify-center">
                 <img src="/logo.png" alt="" className="w-7 h-7" />
              </div>
            </div>
           <div className="text-center pb-1">
              <div className="w-36 border-b border-blue-950 mx-auto"></div>
              <p className="text-[9px] font-black uppercase text-blue-950 tracking-widest mt-1.5 italic">Principal Signature</p>
           </div>
        </div>
      </div>
    ))}
  </div>
);


const AdmitDetailRow = ({ label, value, isLarge = false }: any) => (
  <div className="border-b border-gray-100 pb-0.5">
    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">{label}</p>
    <p className={`${isLarge ? 'text-xl' : 'text-lg'} font-black text-blue-950 uppercase leading-none tracking-tight`}>
      {value || '----------'}
    </p>
  </div>
);

/* --- PREVIOUS TEMPLATES (RETAINED) --- */


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
