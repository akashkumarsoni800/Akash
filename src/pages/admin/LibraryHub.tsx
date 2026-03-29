import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, Plus, Search, RefreshCw, CheckCircle, X, Camera, User, Zap, Clock, Library, ArrowLeft } from 'lucide-react';
import { getCurrentSchoolId } from '../../hooks/useQueries';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader';

const LibraryHub = () => {
  const navigate = useNavigate();
  const schoolId = getCurrentSchoolId();
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', total_copies: 1 });
  const [tab, setTab] = useState<'books' | 'issued'>('books');
  const scannerRef = useRef<any>(null);

  const fetchBooks = async () => {
    const { data } = await supabase.from('library_books').select('*').eq('school_id', schoolId).order('title');
    setBooks(data || []);
  };

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('book_issues')
      .select('*, library_books(title, author)')
      .eq('school_id', schoolId)
      .is('returned_at', null)
      .order('issued_date', { ascending: false });
    setIssues(data || []);
  };

  useEffect(() => {
    fetchBooks();
    fetchIssues();
  }, []);

  // Scanner logic
  useEffect(() => {
    if (showScanner) {
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner('lib-reader', { fps: 15, qrbox: { width: 250, height: 250 } }, false);
        scanner.render(async (decodedText) => {
          let studentId = decodedText.trim();
          if (studentId.includes('/v/')) {
            studentId = studentId.split('/v/').pop()?.split(/[?#]/)[0].replace(/\/$/, '') || studentId;
          }
          scanner.clear().catch(() => {});
          setShowScanner(false);

          const numericId = isNaN(Number(studentId)) ? null : Number(studentId);
          let { data } = numericId
            ? await supabase.from('students').select('*').eq('student_id', numericId).maybeSingle()
            : { data: null };
          if (!data) {
            const r2 = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
            data = r2.data;
          }

          if (data) {
            setScannedStudent(data);
            toast.success(`✅ ${data.full_name} identified`);
          } else {
            toast.error('Student not found');
          }
        }, () => {});
        scannerRef.current = scanner;
      }, 300);
      return () => { scannerRef.current?.clear().catch(() => {}); };
    }
  }, [showScanner]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('library_books').insert([{
      ...newBook, school_id: schoolId, available_copies: newBook.total_copies
    }]);
    if (error) { toast.error(error.message); } 
    else { toast.success('Book added!'); setShowAddBook(false); setNewBook({ title: '', author: '', total_copies: 1 }); fetchBooks(); }
    setLoading(false);
  };

  const handleIssueBook = async () => {
    if (!scannedStudent || !selectedBookId) return toast.error('Select a book first');
    setLoading(true);
    const book = books.find(b => b.id === selectedBookId);
    if (!book || book.available_copies < 1) return toast.error('Book not available');

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 day return policy

    const [issueRes] = await Promise.all([
      supabase.from('book_issues').insert([{
        school_id: schoolId,
        student_id: scannedStudent.student_id?.toString() || scannedStudent.id,
        student_name: scannedStudent.full_name,
        book_id: selectedBookId,
        issued_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
      }]),
      supabase.from('library_books').update({ available_copies: book.available_copies - 1 }).eq('id', selectedBookId)
    ]);

    if (issueRes.error) toast.error(issueRes.error.message);
    else { toast.success(`"${book.title}" issued to ${scannedStudent.full_name}`); setScannedStudent(null); setSelectedBookId(''); fetchBooks(); fetchIssues(); }
    setLoading(false);
  };

  const handleReturn = async (issue: any) => {
    setLoading(true);
    await Promise.all([
      supabase.from('book_issues').update({ returned_at: new Date().toISOString() }).eq('id', issue.id),
      supabase.from('library_books').update({ available_copies: issue.library_books.available_copies + 1 }).eq('id', issue.book_id)
    ]);
    toast.success('Book returned!');
    fetchBooks();
    fetchIssues();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter">
      <DashboardHeader userRole="admin" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Library Hub</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Issue & Return via QR Scan</p>
            </div>
          </div>
          <button onClick={() => setShowAddBook(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl">
            <Plus size={16} /> Add Book
          </button>
        </motion.div>

        {/* Quick Issue via QR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-[2rem] p-8 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Camera size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">Quick Issue via QR</h2>
              <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">Scan student ID to issue or return book</p>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button onClick={() => { setScannedStudent(null); setShowScanner(true); }}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl">
              <Camera size={16} /> Scan Student ID
            </button>
            {scannedStudent && <button onClick={() => setScannedStudent(null)} className="py-4 px-5 bg-white/10 rounded-2xl font-black text-xs tracking-widest hover:bg-white/20 transition-all">
              <X size={16} />
            </button>}
          </div>

          <AnimatePresence>
            {scannedStudent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 p-5 bg-slate-50 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                    {scannedStudent.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900 uppercase text-sm">{scannedStudent.full_name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Class {scannedStudent.class_name} • Roll #{scannedStudent.roll_no}</p>
                  </div>
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <CheckCircle size={10} /> Identified
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl font-black text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select Book to Issue --</option>
                    {books.filter(b => b.available_copies > 0).map(b => (
                      <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                    ))}
                  </select>
                  <button onClick={handleIssueBook} disabled={!selectedBookId || loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <BookOpen size={16} />}
                    Issue Book
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-2 border border-slate-100 shadow-sm">
          {(['books', 'issued'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all ${tab === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>
              {t === 'books' ? `📚 All Books (${books.length})` : `📋 Currently Issued (${issues.length})`}
            </button>
          ))}
        </div>

        {/* Books List */}
        {tab === 'books' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => (
              <motion.div key={book.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <BookOpen size={20} />
                </div>
                <h3 className="font-black text-slate-900 uppercase text-sm leading-none">{book.title}</h3>
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-2">{book.author}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${book.available_copies > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {book.available_copies}/{book.total_copies} available
                  </span>
                </div>
              </motion.div>
            ))}
            {books.length === 0 && <div className="col-span-3 text-center py-16 text-slate-300 font-black uppercase text-sm">No books added yet</div>}
          </div>
        )}

        {/* Issued Books */}
        {tab === 'issued' && (
          <div className="space-y-4">
            {issues.map(issue => (
              <motion.div key={issue.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-6 flex items-center justify-between border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase">{issue.student_name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {issue.library_books?.title} • Due: {issue.due_date}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleReturn(issue)} disabled={loading}
                  className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 disabled:opacity-50">
                  <CheckCircle size={14} /> Return
                </button>
              </motion.div>
            ))}
            {issues.length === 0 && <div className="text-center py-16 text-slate-300 font-black uppercase text-sm">No books currently issued</div>}
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      <AnimatePresence>
        {showAddBook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 uppercase">Add New Book</h2>
                <button onClick={() => setShowAddBook(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddBook} className="space-y-4">
                <input required value={newBook.title} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))}
                  placeholder="Book Title" className="w-full px-5 py-4 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={newBook.author} onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))}
                  placeholder="Author Name" className="w-full px-5 py-4 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min={1} value={newBook.total_copies} onChange={e => setNewBook(p => ({ ...p, total_copies: Number(e.target.value) }))}
                  placeholder="Number of Copies" className="w-full px-5 py-4 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Add Book
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
              <div className="w-full flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 uppercase">Scan Student ID</h2>
                <button onClick={() => setShowScanner(false)} className="p-3 rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                  <X size={20} />
                </button>
              </div>
              <div id="lib-reader" className="w-full max-w-xs rounded-2xl overflow-hidden border-4 border-slate-900 min-h-[260px]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Point camera at the QR code on the student's ID card</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryHub;
