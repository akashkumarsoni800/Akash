import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Role check karne ka simple tarika (URL se)
  const isAdmin = location.pathname.includes('/admin');
  const isStudent = location.pathname.includes('/student');
  
  // Logout function (Abhi ke liye simple)
  const handleLogout = () => {
    // Agar Supabase hota to: await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* SIDEBAR START */}
      <div className="w-64 bg-blue-900 text-white flex flex-col fixed h-full z-10">
        
        {/* LOGO AREA */}
        <div className="p-6 flex flex-col items-center border-b border-blue-800">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl mb-2">
            🏫
          </div>
          <h2 className="text-lg font-bold">School App</h2>
        </div>

        {/* MENU LINKS */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          
          <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} className="block px-4 py-3 hover:bg-blue-800 rounded transition">
            🏠 Dashboard
          </Link>

          {/* Sirf Admin ke liye */}
          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" className="block px-4 py-3 hover:bg-blue-800 rounded transition">
                💰 Manage Fees
              </Link>
              <Link to="/admin/create-exam" className="block px-4 py-3 hover:bg-blue-800 rounded transition">
                📝 Create Exam
              </Link>
              <Link to="/admin/upload-result" className="block px-4 py-3 hover:bg-blue-800 rounded transition">
                📤 Upload Result
              </Link>
              <Link to="/admin/add-event" className="block px-4 py-3 hover:bg-blue-800 rounded transition">
                📢 Add Notice
              </Link>
            </>
          )}

        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-bold"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 p-8">
        <Outlet />
      </div>

    </div>
  );
};

export default Sidebar;
