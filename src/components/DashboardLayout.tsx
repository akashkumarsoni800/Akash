// src/components/DashboardLayout.tsx
import React from "react";
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <nav className="bg-white p-4 shadow mb-4">Dashboard Header</nav>
      <main>{children}</main>
    </div>
  );
};
export default DashboardLayout;