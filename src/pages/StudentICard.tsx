import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'framer-motion';

const StudentICard = ({ student }: { student: any }) => {
  const componentRef = useRef<any>();

  // प्रिंट फंक्शन
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div className="p-6">
      {/* प्रिंट होने वाला एरिया */}
      <div ref={componentRef} className="print:m-0">
        <div className="w-[3.5in] h-[2.2in] bg-white border-2 border-indigo-900 rounded-xl overflow-hidden shadow-2xl relative flex font-sans">
          {/* Left Bar */}
          <div className="w-1/3 bg-indigo-900 flex flex-col items-center justify-center p-2 text-white">
            <div className="w-20 h-20 rounded-full border-2 border-white overflow-hidden bg-gray-200 mb-2">
               {/* छात्र की फोटो */}
               <img src={student.photo_url || "/user-avatar.png"} className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] font-bold uppercase">Roll No: {student.roll_no}</p>
          </div>

          {/* Right Content */}
          <div className="w-2/3 p-3">
            <h2 className="text-indigo-900 font-black text-sm uppercase leading-tight">Adarsh Shishu Mandir</h2>
            <p className="text-[8px] text-gray-500 font-bold mb-3 italic">Bihar Sharif, Nalanda</p>
            
            <div className="space-y-1">
              <h3 className="text-md font-black text-gray-800 uppercase">{student.full_name}</h3>
              <p className="text-[10px] text-gray-600 font-bold uppercase">Class: <span className="text-indigo-600">{student.class_name}</span></p>
              <p className="text-[10px] text-gray-600 font-bold uppercase">Father: {student.father_name}</p>
              <p className="text-[10px] text-gray-600 font-bold uppercase">Mob: {student.contact_number}</p>
            </div>

            <div className="absolute bottom-2 right-2">
              <p className="text-[8px] font-black text-indigo-900 uppercase">Principal Sign</p>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handlePrint}
        className="mt-6 bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold uppercase tracking-widest shadow-lg"
      >
        🖨️ Print I-Card
      </button>
    </div>
  );
};

export default StudentICard;
