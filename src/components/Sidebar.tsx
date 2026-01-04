import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Sidebar khulne/band hone ka state

  // Role check logic
  const isAdmin = location.pathname.includes('/admin');
  
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("adarsh_school_login");
      navigate('/');
    }
  };

  // Toggle function
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* === 1. TOP NAVIGATION BAR (Always Visible) === */}
      <div className="bg-blue-900 text-white h-16 flex items-center justify-between px-4 shadow-md z-20 sticky top-0">
        
        {/* Left: Hamburger & Logo Name */}
        <div className="flex items-center gap-4">
          {/* Hamburger Button (Three Lines) */}
          <button 
            onClick={toggleSidebar} 
            className="text-2xl focus:outline-none hover:bg-blue-800 p-2 rounded"
          >
            {isOpen ? '✖' : '☰'} 
          </button>

          <h1 className="text-lg font-bold tracking-wide hidden md:block">
            Adarsh Shishu Mandir
          </h1>
        </div>

        {/* Right: User Info / Logo */}
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">
            {isAdmin ? 'Admin Panel' : 'School App'}
          </span>
          {/* Small Logo in Header */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-8 h-8 rounded-full bg-white object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }} // Agar logo na mile to chhupa do
          />
        </div>
      </div>

      {/* === 2. SIDEBAR DRAWER (Sliding Panel) === */}
      {/* Background Overlay (Click outside to close) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Main Sidebar Content */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header (Logo Area) */}
        <div className="h-40 bg-blue-900 flex flex-col items-center justify-center text-white">
          {/* LOGO IMAGE */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden mb-2 border-4 border-blue-200">
             {/* Yahan Logo Dikhna Chahiye */}
             <img 
               src="/logo.png" 
               alt="School Logo" 
               className="w-full h-full object-cover"
               onError={(e) => { 
                 // Agar image load na ho, to fallback text dikhao
                 e.currentTarget.style.display = 'none'; 
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
               }} 
             />
             {/* Fallback Icon if image fails */}
             <span className="text-4xl hidden">🏫</span>
          </div>
          <h2 className="font-bold text-lg">Menu</h2>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-250px)]">
          
          <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
            <span>🏠</span> Dashboard
          </Link>

          {isAdmin && (
            <>
              <Link to="/admin/manage-fees" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
                <span>💰</span> Manage Fees
              </Link>
              <Link to="/admin/create-exam" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
                <span>📝</span> Create Exam
              </Link>
              <Link to="/admin/upload-result" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
                <span>📤</span> Upload Result
              </Link>
              <Link to="/admin/add-event" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
                <span>📢</span> Add Notice
              </Link>
              
              <div className="border-t my-2"></div>
              
              <Link to="/admin/add-student" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
                <span>🎓</span> Add Student
              </Link>
              <Link to="/admin/add-teacher" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded transition font-medium">
                <span>👨‍🏫</span> Add Teacher
              </Link>
            </>
          )}

        </nav>

        {/* Footer Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-100 text-red-600 py-2 rounded font-bold hover:bg-red-200 transition flex items-center justify-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* === 3. MAIN CONTENT AREA === */}
      <div className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </div>

    </div>
  );
};

export default Sidebar;
