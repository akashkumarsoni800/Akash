import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  ChevronLeft,
  Printer,
  RefreshCw
} from "lucide-react";

const StudentProfile = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [student, setStudent] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });

  useEffect(() => {
    if (id) fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {

    try {

      setLoading(true);

      const studentId = Number(id);

      /* -----------------------------
      FETCH STUDENT
      ------------------------------*/

      const { data: std, error: stdErr } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();

      if (stdErr) throw stdErr;

      if (!std) {
        setStudent(null);
        return;
      }

      setStudent(std);

      /* -----------------------------
      FETCH FEES
      ------------------------------*/

      const { data: feeData, error: feeErr } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", std.student_id)
        .order("created_at", { ascending: false });

      if (feeErr) throw feeErr;

      setFees(feeData || []);

      /* -----------------------------
      FETCH RESULTS
      ------------------------------*/

      const { data: resData, error: resErr } = await supabase
        .from("results")
        .select("*, exams(title)")
        .eq("student_id", std.student_id);

      if (!resErr) setResults(resData || []);

      /* -----------------------------
      FETCH ATTENDANCE
      ------------------------------*/

      const { data: att, error: attErr } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", std.student_id);

      if (!attErr && att) {

        const present = att.filter((a: any) => a.status === "Present").length;

        setAttendance({
          present,
          total: att.length
        });

      }

    } catch (err: any) {

      console.error(err);

      toast.error("Profile load failed : " + err.message);

    } finally {

      setLoading(false);

    }

  };

  /* --------------------------------
  LOADING SCREEN
  -------------------------------- */

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="font-black uppercase tracking-widest text-gray-400 italic">
          Loading Student Database...
        </p>
      </div>
    );

  /* --------------------------------
  NOT FOUND
  -------------------------------- */

  if (!student)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-black text-rose-500 uppercase">
          Record Not Found
        </h2>
        <p className="text-gray-400 mt-2">
          Student ID {id} does not exist.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-6 bg-indigo-600 text-white px-8 py-2 rounded-xl"
        >
          Go Back
        </button>
      </div>
    );

  /* --------------------------------
  CALCULATIONS
  -------------------------------- */

  const attendanceRate =
    attendance.total > 0
      ? Math.round((attendance.present / attendance.total) * 100)
      : 0;

  const totalFees = fees.reduce(
    (sum, f) => sum + Number(f.total_amount || 0),
    0
  );

  const paidFees = fees
    .filter((f) => f.status === "Paid")
    .reduce((sum, f) => sum + Number(f.total_amount || 0), 0);

  const dueFees = totalFees - paidFees;

  /* --------------------------------
  UI
  -------------------------------- */

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">

      <div className="max-w-6xl mx-auto px-4 pt-8">

        {/* NAVIGATION */}

        <div className="flex justify-between mb-8">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl text-xs font-bold text-indigo-600 shadow"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex gap-3">

            <button
              onClick={fetchStudentData}
              className="bg-indigo-600 text-white px-5 py-3 rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => window.print()}
              className="bg-black text-white px-5 py-3 rounded-xl flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>

          </div>

        </div>

        {/* HEADER */}

        <div className="bg-indigo-900 text-white rounded-3xl p-10 mb-10 flex justify-between items-center">

          <div className="flex gap-6 items-center">

            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-indigo-700 flex items-center justify-center">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={50} />
              )}
            </div>

            <div>

              <h1 className="text-4xl font-black uppercase">
                {student.full_name}
              </h1>

              <p className="text-indigo-200 mt-2">
                Class : {student.class_name}
              </p>

              <p className="text-indigo-200">
                Roll : {student.roll_no}
              </p>

            </div>

          </div>

          <div className="text-center">

            <p className="text-sm text-indigo-200">
              Attendance
            </p>

            <p className="text-5xl font-black">
              {attendanceRate}%
            </p>

          </div>

        </div>

        {/* GRID */}

        <div className="grid md:grid-cols-3 gap-8">

          {/* STUDENT INFO */}

          <div className="bg-white p-8 rounded-3xl shadow">

            <h3 className="font-black mb-6 text-gray-500 uppercase text-xs">
              Student Info
            </h3>

            <InfoItem icon={User} label="Student ID" value={student.student_id} />
            <InfoItem icon={User} label="Father Name" value={student.father_name} />
            <InfoItem icon={Phone} label="Contact" value={student.contact_number} />
            <InfoItem icon={MapPin} label="Address" value={student.address} />

          </div>

          {/* FINANCIAL */}

          <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow">

            <h3 className="font-black mb-6 text-gray-500 uppercase text-xs flex items-center gap-2">
              <CreditCard size={16} />
              Financial Summary
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-8">

              <StatCard title="Total Fees" value={`₹${totalFees}`} />
              <StatCard title="Paid" value={`₹${paidFees}`} />
              <StatCard title="Due" value={`₹${dueFees}`} />

            </div>

            {/* FEES TABLE */}

            {fees.length === 0 ? (
              <p className="text-center text-gray-400">
                No fee records found
              </p>
            ) : (

              <table className="w-full text-left">

                <thead>
                  <tr className="text-xs text-gray-400 uppercase">
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {fees.map((f) => (

                    <tr key={f.id} className="border-t">

                      <td className="py-4 font-bold">
                        {f.month || "Current"}
                      </td>

                      <td className="font-bold text-indigo-600">
                        ₹{Number(f.total_amount).toLocaleString()}
                      </td>

                      <td>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            f.status === "Paid"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {f.status}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: any) => (

  <div className="flex items-start gap-3 mb-5">

    <div className="bg-gray-100 p-2 rounded-xl">
      <Icon size={16} />
    </div>

    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-bold">{value || "N/A"}</p>
    </div>

  </div>

);

const StatCard = ({ title, value }: any) => (

  <div className="bg-gray-50 p-4 rounded-xl text-center">

    <p className="text-xs text-gray-400 uppercase">
      {title}
    </p>

    <p className="text-2xl font-black text-indigo-600">
      {value}
    </p>

  </div>

);

export default StudentProfile;
