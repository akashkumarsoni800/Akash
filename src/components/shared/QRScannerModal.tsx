import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Zap } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the container is rendered
      const timeout = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "global-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(
          (decodedText) => {
            onScanSuccess(decodedText);
            scanner.clear();
          },
          (error) => {
            // Silence common scanner errors
          }
        );

        scannerRef.current = scanner;
      }, 300);

      return () => {
        clearTimeout(timeout);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [isOpen, onScanSuccess]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative border border-slate-100 mx-4"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <Camera size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Global ID Scanner</h2>
                  <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">Smart Student Lookup</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-transparent hover:border-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scanner Area */}
            <div className="p-8 md:p-12 flex flex-col items-center">
              <div id="global-reader" className="w-full max-w-sm rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl relative bg-black min-h-[300px]">
                <div className="absolute inset-0 pointer-events-none z-10">
                   <div className="w-full h-full border-[40px] border-slate-950/40"></div>
                   <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan-line"></div>
                </div>
              </div>

              <div className="mt-10 w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0 animate-pulse">
                  <Zap size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed tracking-wider">
                  Align the Student ID card within the frame. The system will automatically detect the student and redirect you to their financial hub.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-900 text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Verification Shield v4.2</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRScannerModal;
