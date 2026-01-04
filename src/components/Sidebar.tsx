import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

// Dhyan de: Humne yahan se Supabase hata diya hai TESTING ke liye
// Taki White Screen hat jaye aur hume dashboard dikhne lage.

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-blue-900 text-white flex flex-col fixed h-full">
        <div className="p-6 text-center font-bold text-xl border-b border-blue-800">
          My School App
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-blue-800 rounded">
            🏠 Dashboard
          </Link>
          <Link to="/admin/manage-fees" className="block px-4 py-2 hover:bg-blue-800 rounded">
            💰 Manage Fees
          </Link>
          <Link to="/admin/create-exam" className="block px-4 py-2 hover:bg-blue-800 rounded">
            📝 Create Exam
          </Link>
          <Link to="/admin/upload-result" className="block px-4 py-2 hover:bg-blue-800 rounded">
            📤 Upload Result
          </Link>
          <Link to="/admin/add-event" className="block px-4 py-2 hover:bg-blue-800 rounded">
            📢 Add Event
          </Link>
        </nav>

        <div className="p-4">
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-red-600 py-2 rounded font-bold"
          >
            Logout (Test)
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 ml-64 p-8">
        {/* Ye Outlet zaruri hai, isi ki wajah se baki pages dikhte hain */}
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
