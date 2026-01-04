import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const StudentNotices = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
      if (data) setNotices(data);
    };
    fetchNotices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => navigate('/student/dashboard')} className="text-blue-600 font-bold mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-red-600 mb-6">Notice Board</h1>
      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white p-4 rounded shadow border-l-4 border-red-500">
            <h3 className="font-bold">{notice.title}</h3>
            <p className="text-sm">{notice.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default StudentNotices;
