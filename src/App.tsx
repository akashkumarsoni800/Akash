import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // ❌ BrowserRouter hata diya
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// Error Boundary (Crash Catcher)
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("CRASH:", error); }
  render() {
    if (this.state.hasError) return <div className="p-10 text-red-600 font-bold">💥 Something went wrong. Check Console.</div>;
    return this.props.children;
  }
}

// Pages Import
import ManageFees from './pages/ManageFees';
import AdminDashboard from './pages/AdminDashboard'; 
// Baki imports agar zarurat ho to uncomment karein
// import LoginPage from './pages/LoginPage';

const queryClient = new QueryClient();

// --- TEST COMPONENT ---
const ManualAuth = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
      <h1 className="text-2xl font-bold text-blue-900">✅ App Fixed!</h1>
      <button onClick={() => window.location.href = '/admin/manage-fees'} className="p-3 bg-blue-600 text-white rounded">
        Go to Manage Fees
      </button>
      <button onClick={() => window.location.href = '/admin/dashboard'} className="p-3 bg-green-600 text-white rounded">
        Go to Dashboard
      </button>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <Toaster position="top-center" richColors />
            
            {/* 🛑 YAHAN SE BROWSERROUTER HATA DIYA HAI */}
            
            <Routes>
              <Route path="/" element={<ManualAuth />} />
              
              {/* Apke Pages */}
              <Route path="/admin/manage-fees" element={<ManageFees />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Agar koi galat link dale to Home par bhej do */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
