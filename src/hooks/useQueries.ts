import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import { UserRole } from '../backend';
import { toast } from "sonner";

// --- 1. AUTHENTICATION (Magic Login Fix) ---
export const useInternetIdentity = () => {
  // Shuruat mein check karo ki login hai ya nahi
  const [identity, setIdentity] = useState<boolean>(() => {
    return localStorage.getItem("adarsh_school_login") === "true";
  });

  useEffect(() => {
    // Ye function tab chalega jab bhi login status badlega
    const checkLogin = () => {
      const isLogged = localStorage.getItem("adarsh_school_login") === "true";
      setIdentity(isLogged);
    };

    // Event listeners lagayein (Taaki App.tsx ko turant khabar mile)
    window.addEventListener("storage", checkLogin);
    window.addEventListener("local-login-event", checkLogin);

    return () => {
      window.removeEventListener("storage", checkLogin);
      window.removeEventListener("local-login-event", checkLogin);
    };
  }, []);

  const login = () => {
    console.log("Login Action Triggered!");
    localStorage.setItem("adarsh_school_login", "true");
    // Pure system ko chillakar batao ki LOGIN HO GYA!
    window.dispatchEvent(new Event("local-login-event"));
  };

  const logout = () => {
    localStorage.removeItem("adarsh_school_login");
    window.dispatchEvent(new Event("local-login-event"));
    window.location.reload();
  };

  return { identity, isInitializing: false, login, logout };
};

// --- 2. PROFILE & ROLES ---
export const useGetCallerUserProfile = () => {
  return { 
    data: { 
      userType: 'admin', 
      name: 'Principal Dinesh', 
      email: 'principal@adarsh.com' 
    }, 
    isLoading: false, 
    isFetched: true 
  };
};

// Sirf ye ek baar hona chahiye puri file mein 👇
export const useGetCallerUserRole = () => {
  return { data: 'admin', isLoading: false }; 
};



// ✅ YE RAHA WO MISSING FUNCTION (Jiska Error Aa Raha Tha)
export const useSaveCallerUserProfile = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      console.log("Saving Profile (Mock):", data);
      return true;
    },
    onSuccess: () => {
      toast.success("Profile Updated!");
    }
  });
};

// --- 3. ADMIN MODULES (Supabase) ---

// Fetch Pending Students
export const useListApprovals = () => {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('approval_status', 'pending');
      if (error) throw error;
      return data || [];
    }
  });
};

// Approve Student
export const useApproveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('students')
        .update({ approval_status: 'approved' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success("Student Approved Successfully!");
    }
  });
};

// Fetch All Approved Students
export const useGetAllApprovedStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('approval_status', 'approved');
      if (error) throw error;
      return data || [];
    }
  });
};

// --- 4. TEACHER MANAGEMENT MODULES ---

// Fetch All Teachers
export const useGetAllTeachers = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('*');
      if (error) throw error;
      return data || [];
    }
  });
};

// Register New Teacher
export const useRegisterTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('teachers').insert([{
        full_name: formData.name,
        subject: formData.subject,
        email: formData.email,
        phone: formData.phone
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success("Teacher Registered!");
    }
  });
};



export const useAddExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examData: any) => {
      const { error } = await supabase.from('exams').insert([examData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success("Exam Created!");
    }
  });
};

// --- 6. PUBLIC REGISTRATION ---
export const useRegisterStudent = () => {
  return useMutation({
    mutationFn: async (studentData: any) => {
      const { error } = await supabase.from('students').insert([{
        full_name: studentData.name,
        class_name: studentData.class,
        section: studentData.section,
        parent_name: studentData.parentName,
        contact_number: studentData.contact,
        approval_status: 'pending'
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registration Submitted! Wait for Admin Approval.");
    }
  });
};

// --- 7. HELPERS (Mock Data to prevent crashes) ---
export const useGetMyStudentId = () => ({ data: "STU-001", isLoading: false });
export const useGetStudentById = (id: any) => ({ data: {}, isLoading: false });
export const useIsStudentApproved = () => ({ data: true, isLoading: false });
export const useGetMyTeacherId = () => ({ data: "TCH-001", isLoading: false });
export const useGetTeacherById = (id: any) => ({ data: {}, isLoading: false });
export const useSetApproval = () => ({ mutate: () => {} });// --- EXAMS MODULE (Exams ki list laane ke liye) ---
export const useGetAllExams = () => {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      // Supabase se exams table ka data mango
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('exam_date', { ascending: true }); // Date ke hisab se sort karega
        
      if (error) {
        console.error("Error fetching exams:", error);
        throw error;
      }
      return data || [];
    }
  });
};

// --- RESULTS MODULE (Marks upload karne ke liye) ---
export const useAddResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultData: any) => {
      console.log("Uploading Result:", resultData);
      
      const { error } = await supabase
        .from('results')
        .insert([{
          student_id: resultData.studentId,
          exam_id: resultData.examId,
          marks_obtained: resultData.marks,
          remarks: resultData.remarks
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      // Data refresh karo aur message dikhao
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success("Marks Uploaded Successfully! 🎉");
    },
    onError: (error: any) => {
      toast.error("Failed to upload marks: " + error.message);
    }
  });
};
// --- STUDENT RESULT MODULE ---
// Bracket ke andar "studentId: any" hona zaroori hai 👇
export const useGetStudentResults = (studentId: any) => {
  return useQuery({
    queryKey: ['results', studentId],
    queryFn: async () => {
      // Agar ID nahi hai to khali array wapis karo
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          exams (
            exam_name,
            subject,
            total_marks
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      return data || [];
    },
    // Ye query tabhi chalegi jab ID milegi
    enabled: !!studentId 
  });
};