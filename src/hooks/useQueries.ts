import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import { UserRole, ApprovalStatus } from '../backend';
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

// --- HELPER: GET CURRENT SCHOOL ID ---
export const getCurrentSchoolId = () => localStorage.getItem('current_school_id');

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
export const useGetCallerUserRole = () => {
  return { data: 'admin', isLoading: false }; 
};





// ✅ YE RAHA WO MISSING FUNCTION (Jiska Error Aa Raha Tha)
export const useSaveCallerUserProfile = (): any => {
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

// --- 3. DASHBOARD STATISTICS ---
export const useGetDashboardStats = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['dash-stats', schoolId],
    queryFn: async () => {
      const [stdRes, tchRes, penRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'approved').eq('school_id', schoolId),
        supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_approved', 'pending').eq('school_id', schoolId),
      ]);
      
      return {
        students: stdRes.count || 0,
        teachers: tchRes.count || 0,
        pending: penRes.count || 0,
      };
    },
    enabled: !!schoolId
  });
};

// --- 4. ADMIN MODULES (Supabase) ---

// Fetch Pending Students
export const useListApprovals = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['approvals', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'pending')
        .eq('school_id', schoolId); // ✅ School Isolation
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

// Set Approval Status (Approve/Reject)
export const useSetApprovalStatus = (): any => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: any; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('students')
        .update({ is_approved: status })
        .eq('student_id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dash-stats'] });
      toast.success("Status Updated Successfully!");
    }
  });
};

// Delete Student
export const useDeleteStudent = (): any => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('student_id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dash-stats'] });
      toast.success("Student records deleted successfully.");
    }
  });
};

// Fetch All Approved Students
export const useGetAllApprovedStudents = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['students', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', 'approved')
        .eq('school_id', schoolId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

// --- 4. TEACHER MANAGEMENT MODULES ---

// Fetch All Teachers
export const useGetAllTeachers = (role?: string): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['teachers', schoolId, role],
    queryFn: async () => {
      let query = supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId); // ✅ School Isolation
      
      if (role) {
        query = query.eq('role', role);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

// Register New Teacher
export const useRegisterTeacher = (): any => {
  const queryClient = useQueryClient();
  const schoolId = getCurrentSchoolId();
  return useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('teachers').insert([{
        full_name: formData.name,
        subject: formData.subject,
        email: formData.email,
        phone: formData.phone,
        school_id: schoolId
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dash-stats'] });
      toast.success("Teacher Registered!");
    }
  });
};

// Delete Teacher
export const useDeleteTeacher = (): any => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: any) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dash-stats'] });
      toast.success("Teacher records deleted successfully.");
    }
  });
};



export const useAddExam = (): any => {
  const queryClient = useQueryClient();
  const schoolId = getCurrentSchoolId();
  return useMutation({
    mutationFn: async (examData: any) => {
      const { error } = await supabase.from('exams').insert([{
        ...examData,
        school_id: schoolId // ✅ Attached to school
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success("Exam Created!");
    }
  });
};

// --- 6. PUBLIC REGISTRATION ---
export const useRegisterStudent = (): any => {
  const schoolId = getCurrentSchoolId();
  return useMutation({
    mutationFn: async (studentData: any) => {
      const { error } = await supabase.from('students').insert([{
        full_name: studentData.name,
        class_name: studentData.class,
        section: studentData.section,
        parent_name: studentData.parentName,
        contact_number: studentData.contact,
        approval_status: 'pending',
        school_id: schoolId // ✅ Associated with school
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
// ✅ Fixed: Real Approval Mutation
export const useSetApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, status }: { user: string; status: ApprovalStatus }) => {
      const { error } = await supabase
        .from('students')
        .update({ approval_status: status })
        .eq('student_id', user); // Using student_id as it's the primary key in this schema
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    }
  });
};

// --- EXAMS MODULE (Exams ki list laane ke liye) ---
export const useGetAllExams = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['exams', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('school_id', schoolId) // ✅ School Isolation
        .order('exam_date', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

// Delete Exam
export const useDeleteExam = (): any => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: any) => {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success("Exam record deleted.");
    }
  });
};

// --- RESULTS MODULE (Marks upload karne ke liye) ---
export const useAddResult = (): any => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultData: any) => {
      const schoolId = getCurrentSchoolId();
      console.log("Uploading Result:", resultData);
      
      const { error } = await supabase
        .from('results')
        .insert([{
          student_id: resultData.studentId,
          exam_id: resultData.examId,
          marks_obtained: resultData.marks,
          remarks: resultData.remarks,
          school_id: schoolId // ✅ Associated with school
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
// --- 8. STUDENT DASHBOARD MODULE ---

export const useGetStudentProfile = (email: string): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['student-profile', email, schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .eq('school_id', schoolId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!email && !!schoolId
  });
};

export const useGetAttendancePct = (studentId: any): any => {
  return useQuery({
    queryKey: ['attendance-pct', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId);
      if (error) throw error;
      const att = data || [];
      const presentCount = att.filter((a: any) => a.status === 'Present').length;
      return att.length > 0 ? Math.round((presentCount / att.length) * 100) : 0;
    },
    enabled: !!studentId
  });
};

export const useGetPendingFeesTotal = (studentId: any): any => {
  return useQuery({
    queryKey: ['fees-pending', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fees')
        .select('total_amount')
        .eq('student_id', studentId)
        .eq('status', 'Pending');
      if (error) throw error;
      return (data || []).reduce((sum, f) => sum + Number(f.total_amount), 0);
    },
    enabled: !!studentId
  });
};

export const useGetActiveHomeworkCount = (className: string): any => {
  return useQuery({
    queryKey: ['homework-count', className],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('homework')
        .select('*', { count: 'exact', head: true })
        .eq('class_name', className);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!className
  });
};

// --- 9. EVENT/NOTICE MODULE ---
export const useGetLatestEvents = (limit: number = 10): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['latest-events', schoolId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

export const useGetDetailedAttendance = (studentId: any): any => {
  return useQuery({
    queryKey: ['attendance-detailed', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId
  });
};

export const useGetStudentHomework = (className: string): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['homework-detailed', className, schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homework')
        .select(`
          *,
          homework_submissions!left(*)
        `)
        .eq('class_name', className)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!className && !!schoolId
  });
};

export const useGetStudentFees = (studentId: any): any => {
  return useQuery({
    queryKey: ['fees-detailed', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fees')
        .select('*, fee_receipts(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId
  });
};
// --- STUDENT RESULT MODULE ---
// Bracket ke andar "studentId: any" hona zaroori hai 👇
export const useGetStudentResults = (studentId: any): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['results', studentId, schoolId],
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
        .eq('student_id', studentId)
        .eq('school_id', schoolId); // ✅ School Isolation

      if (error) throw error;
      return data || [];
    },
    // Ye query tabhi chalegi jab ID milegi
    enabled: !!studentId && !!schoolId
  });
};
// --- 10. FEE MANAGEMENT MODULE (ADMIN) ---

export const useGetFeeHeads = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['fee-heads', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_heads')
        .select('*')
        .eq('school_id', schoolId)
        .order('id');
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

export const useGetFeeStats = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['fee-stats', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fees')
        .select('student_id, status, total_amount')
        .eq('school_id', schoolId);
      if (error) throw error;
      
      const feeArray = data || [];
      const pendingStudentsCount = new Set(feeArray.filter((f: any) => f.status === 'Pending').map(f => f.student_id)).size;
      const collectedAmount = feeArray.reduce((sum: number, f: any) => 
        f.status === 'Paid' ? sum + (Number(f.total_amount) || 0) : sum, 0);
      const totalAmount = feeArray.reduce((sum: number, f: any) => sum + (Number(f.total_amount) || 0), 0);
      
      return {
        totalPending: pendingStudentsCount,
        totalCollected: collectedAmount,
        overdue: feeArray.filter((f: any) => f.status === 'Overdue').length,
        collectionRate: totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0
      };
    },
    enabled: !!schoolId
  });
};

export const useGetRecentPayments = (limit: number = 5): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['recent-payments', schoolId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fees')
        .select(`*, students(full_name, class_name, contact_number)`)
        .eq('school_id', schoolId)
        .eq('status', 'Paid')
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

export const useGetFeeReminders = (month: string, allMonths: boolean = false): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['fee-reminders', month, schoolId, allMonths],
    queryFn: async () => {
      let query = supabase
        .from('fees')
        .select(`*, students(full_name, contact_number, class_name)`)
        .eq('status', 'Pending')
        .eq('school_id', schoolId);
      
      if (!allMonths) {
        query = query.eq('month', month);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: (!!month || allMonths) && !!schoolId
  });
};

// Mutations
export const useAddFeeHead = (): any => {
  const queryClient = useQueryClient();
  const schoolId = getCurrentSchoolId();
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('fee_heads').insert([{ name, school_id: schoolId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      toast.success("Fee Head Added");
    }
  });
};

export const useDeleteFeeHead = (): any => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: any) => {
      const { error } = await supabase.from('fee_heads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-heads'] });
      toast.success("Fee Head Deleted");
    }
  });
};

export const useAssignFees = (): any => {
  const queryClient = useQueryClient();
  const schoolId = getCurrentSchoolId();
  return useMutation({
    mutationFn: async (fees: any[]) => {
      const feesWithSchool = fees.map(f => ({ ...f, school_id: schoolId }));
      const { error } = await supabase.from('fees').insert(feesWithSchool);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['fee-reminders'] });
      toast.success("✅ Fees Assigned Successfully!");
    }
  });
};

export const useGetAllStudents = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['students-all', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};

export const useGetNotices = (): any => {
  const schoolId = getCurrentSchoolId();
  return useQuery({
    queryKey: ['notices', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId
  });
};