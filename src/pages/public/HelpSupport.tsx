import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Phone, MessageSquare, ArrowLeft, Send, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const HelpSupport = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Support request sent! We'll get back to you shortly.");
        setEmail('');
        setMessage('');
    };

    const faqs = [
        { q: "How do I register my school?", a: "Click on 'Get Started' on the home page and fill out the school registration form." },
        { q: "Is there a mobile app?", a: "Yes, Adukul is a PWA that can be installed on any smartphone directly from your browser." },
        { q: "How can I reset my password?", a: "Go to the login page and click 'Forgot Password' to start the recovery process." },
        { q: "Can I manage multiple school branches?", a: "Absolutely. Adukul is designed for multi-school chains and individual institutions alike." }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 italic-none">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-[1200px] mx-auto px-6 py-5 flex justify-between items-center">
                    <button 
                        onClick={() => navigate('/')} 
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" className="w-8 h-8" alt="Logo" />
                        <span className="text-lg font-black uppercase tracking-tighter text-indigo-950">Adukul Support</span>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6 max-w-[1200px] mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    
                    {/* Left: Help Options */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-12"
                    >
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-indigo-600 text-white rounded-[5px] flex items-center justify-center shadow-xl shadow-indigo-100">
                                <HelpCircle size={32} />
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none text-slate-900">How can we <br/> help you?</h1>
                            <p className="text-lg text-slate-500 max-w-md">Our dedicated support team is available to help you with any technical or administrative queries.</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="p-8 bg-white border border-slate-100 rounded-[5px] shadow-sm hover:shadow-xl transition-all group">
                                <Mail className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-black uppercase tracking-tight text-slate-900 mb-1">Email Us</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">support@adukul.com</p>
                            </div>
                            <div className="p-8 bg-white border border-slate-100 rounded-[5px] shadow-sm hover:shadow-xl transition-all group">
                                <Phone className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="font-black uppercase tracking-tight text-slate-900 mb-1">Call Support</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+91 91234 56789</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {faqs.map((faq, idx) => (
                                    <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[5px]">
                                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm mb-2">{faq.q}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Contact Form */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-10 md:p-14 rounded-[5px] border border-slate-100 shadow-2xl sticky top-32"
                    >
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Send a Message</h2>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">We usually respond within 2 hours</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Email Address</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[5px] focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 font-medium transition-all"
                                        placeholder="name@school.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Message / Query</label>
                                    <textarea 
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[5px] focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 font-medium transition-all resize-none"
                                        placeholder="How can we help your school today?"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full py-5 bg-slate-900 text-white rounded-[5px] font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    Send Message <Send size={18} className="text-indigo-400" />
                                </button>
                            </form>

                            <div className="pt-8 border-t border-slate-50 text-center">
                                <div className="flex justify-center gap-6 text-slate-400">
                                    <MessageSquare size={20} className="hover:text-indigo-600 cursor-pointer transition-colors" />
                                    <Mail size={20} className="hover:text-indigo-600 cursor-pointer transition-colors" />
                                    <Phone size={20} className="hover:text-indigo-600 cursor-pointer transition-colors" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </main>

            <footer className="py-12 bg-white border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2024 Adukul Support Center. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default HelpSupport;
