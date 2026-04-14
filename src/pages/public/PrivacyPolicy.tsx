import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                            <ShieldCheck size={28} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Privacy Policy</h1>
                        <p className="text-sm font-black text-slate-400 tracking-widest uppercase">Last Updated: April 2024</p>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-10 text-slate-600 leading-relaxed">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">1. Information We Collect</h2>
                            <p>
                                At Adukul, we are committed to protecting your privacy. We collect primary data required for school administration, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 font-medium">
                                <li><strong>Administrative Data:</strong> School name, branch details, and administrator contact information.</li>
                                <li><strong>Student & Staff Records:</strong> Names, attendance, academic results, and contact details provided by the school.</li>
                                <li><strong>Fee Information:</strong> Transaction records and payment statuses.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">2. How We Use Your Data</h2>
                            <p>
                                We use the collected information solely for providing educational services and school management functionalities:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 font-medium">
                                <li>To manage digital attendance and academic reporting.</li>
                                <li>To facilitate fee collection and automated reminders.</li>
                                <li>To ensure secure communication between school staff, parents, and students.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">3. Data Security</h2>
                            <p>
                                We implement industry-standard security measures, including Row Level Security (RLS) on our database and encrypted storage, to protect your sensitive information from unauthorized access or breaches.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">4. Third-Party Services</h2>
                            <p>
                                We do not sell or trade your data. We may use verified third-party partners (like Supabase for database hosting and WhatsApp for reminders) to deliver our services, subject to their respective privacy controls.
                            </p>
                        </section>

                        <section className="space-y-4 p-8 bg-slate-50 border border-slate-100 rounded-lg">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Contact Us</h2>
                            <p className="font-medium">
                                If you have any questions about this Privacy Policy, please contact our support team at:
                                <br /><strong>support@adukul.com</strong>
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

export default PrivacyPolicy;
