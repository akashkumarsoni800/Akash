import { useState } from 'react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { supabase } from "../supabaseClient";
import { getCurrentSchoolId } from "./useQueries";
import { toast } from "sonner";

// Initialize Gemini with v1beta — required for function calling / tools
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "", {
  apiVersion: 'v1beta'
});

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_student_list",
        description: "Fetch a list of students filtered by class and optional section.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            className: { type: SchemaType.STRING, description: "The class name (e.g. 10, 5th, etc.)" },
            section: { type: SchemaType.STRING, description: "Optional section (A, B, C)" },
          },
          required: ["className"],
        },
      },
      {
        name: "get_student_details",
        description: "Get detailed information about a specific student by name or ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: "Student name or partial name" },
          },
          required: ["query"],
        },
      },
      {
        name: "mark_attendance",
        description: "Mark attendance for a specific student.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            studentId: { type: SchemaType.NUMBER, description: "The numeric student ID" },
            status: { type: SchemaType.STRING, enum: ["Present", "Absent", "Late"], description: "Attendance status" },
          },
          required: ["studentId", "status"],
        },
      },
      {
        name: "get_fee_summary",
        description: "Check the fee status of a student.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            studentId: { type: SchemaType.NUMBER, description: "The numeric student ID" },
          },
          required: ["studentId"],
        },
      },
      {
        name: "create_system_notice",
        description: "Create a new notice for the school.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING, description: "Title of the notice" },
            content: { type: SchemaType.STRING, description: "Detailed content of the notice" },
          },
          required: ["title", "content"],
        },
      }
    ],
  },
];

export const useAI = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const executeTool = async (call: any) => {
    const schoolId = getCurrentSchoolId();
    const { name, args } = call;

    try {
      switch (name) {
        case "get_student_list": {
          let query = supabase.from('students').select('*').eq('school_id', schoolId).ilike('class_name', `%${args.className}%`);
          if (args.section) query = query.eq('section', args.section);
          const { data } = await query;
          return data;
        }
        case "get_student_details": {
          const { data } = await supabase.from('students').select('*, fees(*), attendance(*)').eq('school_id', schoolId).ilike('full_name', `%${args.query}%`);
          return data;
        }
        case "mark_attendance": {
          const { error } = await supabase.from('attendance').insert([{
            student_id: args.studentId,
            status: args.status,
            date: new Date().toISOString().split('T')[0],
            school_id: schoolId
          }]);
          if (error) throw error;
          toast.success(`Attendance marked as ${args.status}`);
          return { success: true };
        }
        case "get_fee_summary": {
          const { data } = await supabase.from('fees').select('*').eq('student_id', args.studentId);
          return data;
        }
        case "create_system_notice": {
          const { error } = await supabase.from('notices').insert([{
            title: args.title,
            content: args.content,
            school_id: schoolId
          }]);
          if (error) throw error;
          toast.success("Notice created successfully!");
          return { success: true };
        }
        default:
          return { error: "Tool not found" };
      }
    } catch (err: any) {
      console.error(`Tool execution failed: ${name}`, err);
      return { error: err.message };
    }
  };

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    const newMessages = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key missing! Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      console.log("AI Request using model: gemini-2.0-flash (v1beta)");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", 
        tools: TOOLS as any,
      });

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: "You are Adukul AI, the intelligent control center for Adukul School Management System. Your job is to help administrators and teachers manage the school. You can query students, mark attendance, check fees, and create notices. Always be professional, helpful, and concise. Use tools whenever a user asks for data or actions. If a tool requires an ID you don't have, ask for the student's name first to find it." }],
          },
          {
            role: 'model',
            parts: [{ text: "Understood. I am Adukul AI. I am ready to help you manage the school efficiently. How can I assist you today?" }],
          },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        ],
      });

      let result = await chat.sendMessage(userInput);
      let response = result.response;
      let calls = response.functionCalls();

      while (calls && calls.length > 0) {
        const toolResults = await Promise.all(calls.map(async (call) => {
            const data = await executeTool(call);
            return {
                functionResponse: {
                    name: call.name,
                    response: { content: data }
                }
            };
        }));

        result = await chat.sendMessage(toolResults as any);
        response = result.response;
        calls = response.functionCalls();
      }

      const text = response.text();
      setMessages([...newMessages, { role: 'model', content: text }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const msg = error?.message || 'Unknown error';
      if (msg.includes('API_KEY') || msg.includes('API key')) {
        toast.error("AI Key missing or invalid. Check VITE_GEMINI_API_KEY in .env");
      } else if (msg.includes('429') || msg.includes('quota')) {
        toast.error("AI quota exceeded. Try again after some time.");
      } else {
        toast.error("AI failed: " + msg);
      }
      setMessages([...newMessages, { role: 'model', content: '⚠️ Sorry, kuch error aa gaya. Dobara try karo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};
