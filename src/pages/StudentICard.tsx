import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const StudentICard = ({ student, hidePrintButton = false }: { student: any, hidePrintButton?: boolean }) => {
  const componentRef = useRef<any>();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  if (!student) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Printable Area */}
      <div ref={componentRef} className="print:m-0 print:shadow-none bg-white p-2 sm:p-4 rounded-xl">
        <div className="w-[3.5in] h-[2.2in] flex bg-white border-[3px] border-blue-900 rounded-2xl overflow-hidden font-sans shadow-lg relative">
          
          {/* Left Security Bar */}
          <div className="w-[1.2in] bg-blue-900 text-white flex flex-col items-center justify-center p-3 relative overflow-hidden">
             
             <div className="relative z-10 w-20 h-20 rounded-2xl border-2 border-white/50 overflow-hidden mb-2 bg-blue-900/10">
                <img 
                  src={student.photo_url || "/default-avatar.png"} 
                  className="w-full h-full object-cover select-none" 
                  alt=""
                  loading="eager"
                  onError={(e: any) => e.target.src = "/default-avatar.png"}
                />
             </div>
              <div className="relative z-10 text-center">
                 <p className="text-[10px] font-black tracking-wider leading-none opacity-60">ROLL NO</p>
                 <p className="text-lg font-black mt-1  shadow-sm">{student.roll_no}</p>
              </div>
          </div>

          {/* Right Data Section */}
          <div className="flex-1 p-4 flex flex-col justify-between relative">
            <div className="space-y-0.5">
               <h2 className="text-[16px] font-black text-blue-950  leading-none  uppercase">Adarsh Shishu Mandir</h2>
               <p className="text-[6px] font-black text-gray-400   leading-none mb-3">Institutional Identity Module</p>
            </div>

            <div className="mt-1 space-y-1.5 flex-1 pt-1 border-t border-gray-100">
               <div>
                  <p className="text-[7px] font-black text-gray-400  tracking-widest leading-none mb-0.5">Student Name</p>
                  <p className="text-[11px] font-black text-blue-900  leading-none">{student.full_name}</p>
               </div>
               
               <div className="flex justify-between items-end">
                  <div className="space-y-1.5 flex-1">
                     <div>
                        <p className="text-[7px] font-black text-gray-400  tracking-widest leading-none mb-0.5">Class / Grade</p>
                        <p className="text-[9px] font-black text-gray-700  leading-none">{student.class_name}</p>
                     </div>
                     <div>
                        <p className="text-[7px] font-black text-gray-400  tracking-widest leading-none mb-0.5">Parent/Guardian</p>
                        <p className="text-[9px] font-black text-gray-700  leading-none">{student.father_name}</p>
                     </div>
                  </div>
                  
                  <div className="text-center w-16 mb-1">
                     <div className="h-8 flex flex-col justify-end items-center opacity-30 select-none grayscale">
                        <img src="/logo.png" alt="" className="w-5 h-5 mb-1" />
                     </div>
                     <div className="border-t border-blue-900 pt-1">
                        <p className="text-[5px] font-black text-blue-900  tracking-widest leading-none">Principal Sign</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="absolute top-4 right-4 opacity-10">
               <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-900"></div>
            </div>
          </div>
        </div>
      </div>

      {!hidePrintButton && (
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-xs   shadow-xl hover:shadow-2xl transition-all active:scale-95 no-print"
        >
          🖨️ Print Digital Card
        </button>
      )}
    </div>
  );
};

export default StudentICard;
