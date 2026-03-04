import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { Search, Printer, FileText, CreditCard, Award, DoorOpen, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentHub = () => {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [activeDoc, setActiveDoc] = useState<'ICARD' | 'TC' | 'DOB' | 'GATE' | 'ADMIT' | null>(null);
  const componentRef = useRef<any>();

  const fetchStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`id.eq.${isNaN(Number(studentId)) ? 0 : studentId},roll_no.eq.${studentId},full_name.ilike.%${studentId}%`)
      .maybeSingle();

    if (error || !data) {
      toast.error("Student नहीं मिला! सही ID या Roll No डालें।");
    } else {
      setStudent(data);
      toast.success(`${data.full_name} का डेटा लोड हो गया!`);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-blue-900 uppercase italic text-center">📄 Document Generator</h1>

        {/* Search Section */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Roll No या Student ID डालें..." 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <button onClick={fetchStudent} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest">Fetch Details</button>
        </div>

        {student && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <DocBtn icon={CreditCard} label="I-Card" active={activeDoc === 'ICARD'} onClick={() => setActiveDoc('ICARD')} />
            <DocBtn icon={FileText} label="Transfer (TC)" active={activeDoc === 'TC'} onClick={() => setActiveDoc('TC')} />
            <DocBtn icon={Award} label="DOB Cert" active={activeDoc === 'DOB'} onClick={() => setActiveDoc('DOB')} />
            <DocBtn icon={GraduationCap} label="Admit Card" active={activeDoc === 'ADMIT'} onClick={() => setActiveDoc('ADMIT')} />
            <DocBtn icon={DoorOpen} label="Gate Pass" active={activeDoc === 'GATE'} onClick={() => setActiveDoc('GATE')} />
          </div>
        )}

        {/* Preview Area */}
        <div className="bg-white p-4 md:p-10 rounded-[3rem] shadow-2xl flex flex-col items-center">
          {student && activeDoc ? (
            <>
              <div className="overflow-auto w-full flex justify-center bg-gray-200 p-4 md:p-10 rounded-3xl mb-6">
                <div ref={componentRef} className="bg-white shadow-lg">
                  {activeDoc === 'ICARD' && <ICardTemplate student={student} />}
                  {activeDoc === 'TC' && <TCTemplate student={student} />}
                  {activeDoc === 'DOB' && <DOBTemplate student={student} />}
                  {activeDoc === 'ADMIT' && <AdmitTemplate student={student} />}
                  {activeDoc === 'GATE' && <GatePassTemplate student={student} />}
                </div>
              </div>
              <button onClick={handlePrint} className="bg-green-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2">
                <Printer size={20} /> Print Document
              </button>
            </>
          ) : (
            <p className="text-gray-300 font-bold italic py-20 uppercase tracking-widest">Select a document to preview</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components for Templates
const DocBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${active ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}>
    <Icon size={28} />
    <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

/* --- TEMPLATES --- */

const ICardTemplate = ({ student }: any) => (
  <div className="w-[3.5in] h-[2.2in] flex bg-white border-2 border-blue-900 rounded-xl overflow-hidden font-sans text-left">
    <div className="w-1/3 bg-blue-900 text-white flex flex-col items-center justify-center p-2">
      <div className="w-20 h-20 rounded-full border-2 border-white bg-gray-100 overflow-hidden mb-2">
        <img src={student.photo_url || "https://via.placeholder.com/150"} alt="student" className="w-full h-full object-cover" />
      </div>
      <p className="text-[10px] font-bold">ROLL: {student.roll_no}</p>
    </div>
    <div className="w-2/3 p-3 relative">
      <h2 className="text-[14px] font-black text-blue-900 uppercase">Adarsh Shishu Mandir</h2>
      <p className="text-[8px] font-bold text-gray-500 mb-2">Bihar Sharif, Nalanda</p>
      <div className="space-y-1">
        <p className="text-[12px] font-black uppercase text-gray-800">{student.full_name}</p>
        <p className="text-[10px] font-bold text-gray-600 uppercase">Class: {student.class_name}</p>
        <p className="text-[10px] font-bold text-gray-600 uppercase">Father: {student.father_name}</p>
        <p className="text-[10px] font-bold text-gray-600 uppercase">Mob: {student.contact_number}</p>
      </div>
      <div className="absolute bottom-2 right-2 text-center">
        <div className="w-12 border-b border-black mb-1"></div>
        <p className="text-[7px] font-bold uppercase">Principal</p>
      </div>
    </div>
  </div>
);

const TCTemplate = ({ student }: any) => (
  <div className="w-[8.27in] h-[11.69in] p-12 bg-white border-[12px] border-double border-blue-900 relative text-left">
    <div className="text-center border-b-2 border-blue-900 pb-4 mb-10">
      <h1 className="text-4xl font-black text-blue-900 uppercase">Adarsh Shishu Mandir</h1>
      <p className="font-bold text-gray-600">Bihar Sharif, Nalanda, Bihar | Code: 850021</p>
      <div className="mt-4 inline-block bg-blue-900 text-white px-6 py-1 rounded-full font-bold uppercase tracking-widest text-sm">Transfer Certificate</div>
    </div>
    <div className="space-y-8 text-lg leading-[2] font-serif">
      <p>This is to certify that Master/Miss <b className="border-b border-black px-2">{student.full_name}</b>, Son/Daughter of <b className="border-b border-black px-2">{student.father_name}</b>, was a student of this school in Class <b className="border-b border-black px-2">{student.class_name}</b>.</p>
      <p>His/Her Date of Birth according to the Admission Register is <b className="border-b border-black px-2">{student.dob || 'N/A'}</b>.</p>
      <p>He/She has paid all dues and has been granted TC due to <b className="border-b border-black px-2">Higher Studies</b>. His/Her conduct was <b className="border-b border-black px-2">Satisfactory</b>.</p>
    </div>
    <div className="absolute bottom-20 left-12 right-12 flex justify-between">
      <div className="text-center"><p className="border-t border-black pt-2 font-bold">Class Teacher</p></div>
      <div className="text-center"><p className="border-t border-black pt-2 font-bold">Principal Signature</p></div>
    </div>
  </div>
);

const DOBTemplate = ({ student }: any) => (
  <div className="w-[8.27in] p-16 bg-white border-2 border-gray-200 text-left">
    <div className="text-center mb-12">
      <h1 className="text-3xl font-bold uppercase underline">Birth Certificate</h1>
    </div>
    <p className="text-xl leading-loose">To whom it may concern,</p>
    <p className="text-xl leading-loose mt-6">This is to certify that <b>{student.full_name}</b>, child of <b>{student.father_name}</b>, is a bonafide student of Adarsh Shishu Mandir. As per our school records, the date of birth is <b>{student.dob || 'N/A'}</b>.</p>
    <div className="mt-20"><p className="font-bold">Date: {new Date().toLocaleDateString()}</p><p className="mt-10 font-bold">Principal Seal & Sign</p></div>
  </div>
);

const AdmitTemplate = ({ student }: any) => (
  <div className="w-[6in] p-8 border-4 border-black bg-white text-left">
    <div className="text-center border-b-4 border-black mb-4 pb-2">
      <h2 className="text-2xl font-black uppercase">Examination Admit Card</h2>
    </div>
    <div className="flex gap-6">
       <div className="w-24 h-24 border-2 border-black bg-gray-50 flex items-center justify-center">PHOTO</div>
       <div className="space-y-2">
         <p><b>NAME:</b> {student.full_name}</p>
         <p><b>ROLL NO:</b> {student.roll_no}</p>
         <p><b>CLASS:</b> {student.class_name}</p>
         <p><b>EXAM:</b> ANNUAL EXAMINATION 2026</p>
       </div>
    </div>
    <p className="mt-6 text-[10px] italic">* Please bring this card daily to the examination hall.</p>
  </div>
);

const GatePassTemplate = ({ student }: any) => (
  <div className="w-[4in] h-[2.5in] p-4 border-2 border-red-600 bg-red-50 text-left">
    <div className="text-center border-b border-red-600 mb-2">
      <h3 className="text-red-600 font-black uppercase">Student Gate Pass</h3>
    </div>
    <div className="text-[12px] space-y-1">
      <p><b>Name:</b> {student.full_name}</p>
      <p><b>Class:</b> {student.class_name}</p>
      <p><b>Out Time:</b> {new Date().toLocaleTimeString()}</p>
      <p><b>Reason:</b> ____________________</p>
    </div>
    <p className="mt-4 text-center font-bold text-[10px] text-red-600">AUTHORIZED SIGNATORY</p>
  </div>
);

export default DocumentHub;
