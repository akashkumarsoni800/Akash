import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { Search, Printer, FileText, CreditCard, Award } from 'lucide-react';
import StudentICard from './templates/StudentICard'; // Jo pehle banaya tha
import TCTemplate from './templates/TCTemplate';

const DocumentGenerator = () => {
  const [studentId, setStudentId] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [activeDoc, setActiveDoc] = useState<'ICARD' | 'TC' | 'DOB' | 'GATEPASS' | null>(null);

  const fetchStudent = async () => {
    if (!studentId) return toast.error("Student ID/Roll No daalo bhai!");
    
    // Registration table se data nikalna
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`id.eq.${studentId},roll_no.eq.${studentId}`)
      .single();

    if (error || !data) {
      toast.error("Student nahi mila!");
    } else {
      setStudentData(data);
      toast.success("Data loaded for: " + data.full_name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Step 1: Search Student */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 uppercase italic mb-6">1. Student Selection</h2>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Enter Student ID or Roll Number..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <button onClick={fetchStudent} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Fetch Data</button>
          </div>
        </div>

        {/* Step 2: Choose Document */}
        {studentData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => setActiveDoc('ICARD')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${activeDoc === 'ICARD' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'bg-white border-transparent text-gray-400'}`}>
              <CreditCard size={30} />
              <span className="text-[10px] font-black uppercase">I-Card</span>
            </button>
            <button onClick={() => setActiveDoc('TC')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${activeDoc === 'TC' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'bg-white border-transparent text-gray-400'}`}>
              <FileText size={30} />
              <span className="text-[10px] font-black uppercase">Transfer Cert.</span>
            </button>
            <button onClick={() => setActiveDoc('DOB')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${activeDoc === 'DOB' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'bg-white border-transparent text-gray-400'}`}>
              <Award size={30} />
              <span className="text-[10px] font-black uppercase">DOB Cert.</span>
            </button>
          </div>
        )}

        {/* Step 3: Preview & Print */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl min-h-[400px] flex flex-col items-center">
          {!activeDoc ? (
            <p className="text-gray-300 font-bold italic mt-20">Select a document to preview...</p>
          ) : (
            <div className="w-full">
              {activeDoc === 'ICARD' && <StudentICard student={studentData} />}
              {activeDoc === 'TC' && <TCTemplate student={studentData} />}
              {/* DOB Template bhi aise hi add karenge */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;
