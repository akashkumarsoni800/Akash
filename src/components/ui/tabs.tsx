import React, { useState } from "react";

// Simple Tabs implementation to fix errors
export const Tabs = ({ defaultValue, className, children }: any) => {
  return <div className={className}>{children}</div>;
};

export const TabsList = ({ className, children }: any) => (
  <div className={`flex space-x-2 border-b mb-4 ${className || ""}`}>{children}</div>
);

export const TabsTrigger = ({ value, className, children }: any) => (
  <button className={`px-4 py-2 hover:bg-gray-100 rounded ${className || ""}`}>
    {children}
  </button>
);

export const TabsContent = ({ value, children }: any) => (
  <div className="mt-4">{children}</div>
);