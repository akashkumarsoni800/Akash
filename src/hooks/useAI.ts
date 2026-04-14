import { useState } from 'react';
import { supabase } from "../supabaseClient";
import { getCurrentSchoolId } from "./useQueries";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }

// ─── School Context Fetcher ──────────────────────────────────────────────────
const fetchSchoolContext = async (): Promise<string> => {
  try {
    const schoolId = getCurrentSchoolId();
    if (!schoolId) return "";

    const [studentsRes, attendanceRes, feesRes] = await Promise.all([
      supabase.from('students').select('student_id,full_name,class_name,section').eq('school_id', schoolId).eq('is_approved', 'approved'),
      supabase.from('attendance').select('student_id,status,date').eq('school_id', schoolId).order('date', { ascending: false }).limit(500),
      supabase.from('fees').select('student_id,status').eq('school_id', schoolId),
    ]);

    const students = studentsRes.data || [];
    const attendance = attendanceRes.data || [];
    const fees = feesRes.data || [];

    const totalStudents = students.length;
    const pendingFees = fees.filter((f: any) => f.status === 'Pending').length;
    const presentToday = attendance.filter((a: any) => {
      const today = new Date().toISOString().split('T')[0];
      return a.date === today && a.status === 'Present';
    }).length;

    // Low attendance students
    const attByStudent = new Map<number, { total: number; present: number }>();
    attendance.forEach((a: any) => {
      if (!attByStudent.has(a.student_id)) attByStudent.set(a.student_id, { total: 0, present: 0 });
      const rec = attByStudent.get(a.student_id)!;
      rec.total++;
      if (a.status === 'Present') rec.present++;
    });

    const lowAttStudents = students.filter((s: any) => {
      const rec = attByStudent.get(s.student_id);
      if (!rec || rec.total === 0) return false;
      return (rec.present / rec.total) < 0.75;
    });

    const ctx = `
SCHOOL DATA SUMMARY:
- Total approved students: ${totalStudents}
- Students with pending fees: ${pendingFees}
- Present today: ${presentToday}
- Students with <75% attendance: ${lowAttStudents.length}
- Low attendance students: ${lowAttStudents.slice(0, 10).map((s: any) => {
      const rec = attByStudent.get(s.student_id);
      const pct = rec ? Math.round((rec.present / rec.total) * 100) : 0;
      return `${s.full_name} (Class ${s.class_name}, ${pct}%)`;
    }).join(', ')}

STUDENT LIST (first 20): ${students.slice(0, 20).map((s: any) => `${s.full_name} (Class ${s.class_name})`).join(', ')}
    `.trim();

    return ctx;
  } catch {
    return "";
  }
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API Key missing! Add VITE_GROQ_API_KEY to .env file. Get free key at console.groq.com");
      }

      // Fetch live school context
      const schoolContext = await fetchSchoolContext();

      const systemPrompt = `You are Adukul AI — the intelligent assistant for Adukul School Management System.
You help school administrators and teachers manage their school efficiently.

${schoolContext ? `LIVE SCHOOL DATA:\n${schoolContext}` : ''}

Your capabilities:
- Answer questions about students, attendance, fees, results
- Provide insights and recommendations based on school data
- Help draft notices, messages, WhatsApp reminders
- Suggest actions for at-risk students
- Answer in Hinglish (Hindi + English mix) — friendly and professional

Always be helpful, concise, and action-oriented. If you don't have specific data, say so honestly.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (response.status === 401) throw new Error("Invalid API Key");
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "Sorry, koi response nahi mila.";

      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const msg = error?.message || 'Unknown error';

      let userMsg = '⚠️ Sorry, kuch error aa gaya. Dobara try karo.';
      if (msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
        toast.error("Groq quota exceeded. Thodi der baad try karo.");
        userMsg = '⏳ Abhi bahut requests ho gayi hain. 1 minute baad try karo.';
      } else if (msg.includes('API Key') || msg.includes('401')) {
        toast.error("Groq API Key missing! console.groq.com se free key lo aur .env mein VITE_GROQ_API_KEY set karo.");
        userMsg = '🔑 AI Key set nahi hai. Admin se contact karo.';
      } else {
        toast.error("AI Error: " + msg);
      }

      setMessages([...newMessages, { role: 'assistant', content: userMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, sendMessage, isLoading, clearMessages };
};
