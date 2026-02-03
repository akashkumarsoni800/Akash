import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { FileUp, Search, UserCircle, Plus, Trash2, BookOpen } from 'lucide-react';

const UploadResult = () => {
  const [loading, setLoading] = useState(false);
  const [students, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [exams, setExams] = useState([]); // Database se exams store karne ke liye
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [classes, setClasses] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [results, setResults] = useState([{ subject: '', marks: '', max_marks: '100' }]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Students Fetch Karna
      const { data: stdData, error: stdError } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved');
      
      if (stdError) throw stdError;
      
      if (stdData) {
        setAllStudents(stdData);
        setFilteredStudents(stdData);
        // Unique classes nikalna filter ke liye
        const uniqueClasses = ['All', ...new Set(stdData.map(s => s.class_name))];
        setClasses(uniqueClasses);
      }

      // 2. Exams Fetch Karna (Dynamic List ke liye)
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (examError) throw examError;
      if (examData) setExams(examData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Data load karne mein error aayi");
    }
  };

  // ✅ CRASH FIX & DYNAMIC LOGIC
  const handleExamChange = (examId) => {
    setSelectedExam(examId);
    
    // Find the full exam object based on ID
    const exam = exams.find(e => e.id === examId);
    
    // Check agar exam exist karta hai aur usme subjects array hai
    if (exam && Array.isArray(exam.subjects)) {
      const autoSubjects = exam.subjects.map(subName => ({
        subject: subName,
        marks: '',
        max_marks: exam.max_marks || '100'
      }));
      
      setResults(autoSubjects);
      // ✅ Yahan pehle 'sub.length' tha jo crash kar raha tha, ab 'exam.subjects.length' hai
      toast.success(`${exam.subjects.length} Subjects Auto-Loaded!`);
    } else {
      // Agar subjects nahi mile to reset karein
      setResults([{ subject: '', marks: '', max_marks: '100' }]);
    }
  };

  const handleFilter = (term, cls) => {
    setSearch(term);
    let filtered = students;
    if (cls !== 'All') filtered = filtered.filter(s => s.class_name === cls);
    if (term) filtered = filtered.filter(s
