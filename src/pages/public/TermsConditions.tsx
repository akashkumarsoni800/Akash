import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsConditions = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-[1000px] mx-auto px-6 py-4 flex justify-between items-center">
                    <button 
                        onClick={() => navigate('/')} 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" className="w-6 h-6" alt="Logo" />
                        <span className="text-sm font-black uppercase tracking-tighter">Adukul</span>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6 max-w-[800px] mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-12"
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-6">
                            <Gavel size={28} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Terms & Conditions</h1>
                        <p className="text-sm font-black text-slate-400 tracking-widest uppercase">Last Updated: April 2024</p>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-10 text-slate-600 leading-relaxed">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the Adukul platform, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, you must immediately cease all access and use of our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">2. Use of License</h2>
                            <p>
                                Adukul grants schools a non-exclusive, non-transferable license to use the management platform for administrative purposes according to the plan selected (Free or Enterprise).
                            </p>
                            <ul className="list-disc pl-6 space-y-2 font-medium">
                                <li><strong>User Accounts:</strong> Schools are responsible for maintaining the confidentiality of admin, teacher, and student credentials.</li>
                                <li><strong>Data Ownership:</strong> Most school data remains the property of the school administrator. Adukul hosts and processes it on your behalf.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">3. User Responsibilities</h2>
                            <p>
                                You agree not to use the services for any unlawful purpose or in any way that interrupts or damages the service. Schools must ensure they have parent/guardian consent for students' data collection.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">4. Limitation of Liability</h2>
                            <p>
                                To the maximum extent permitted by law, Adukul shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">5. Modifications</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the platform. Your continued use indicates your acceptance of the updated terms.
                            </p>
                        </section>

                        <section className="space-y-4 p-8 bg-indigo-50/30 border border-indigo-100 rounded-lg">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-black">Legal Jurisdiction</h2>
                            <p className="font-medium">
                                These terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes will be subject to the exclusive jurisdiction of the courts in Patna, Bihar.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            <footer className="py-12 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2024 Adukul School Management. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default TermsConditions;
