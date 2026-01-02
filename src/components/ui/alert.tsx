import React from "react";

export const Alert = ({ variant = "default", className, children }: any) => {
  const bg = variant === "destructive" ? "bg-red-100 border-red-500 text-red-700" : "bg-blue-100 border-blue-500 text-blue-700";
  return (
    <div className={`p-4 border-l-4 rounded ${bg} ${className || ""}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }: any) => (
  <div className="text-sm">{children}</div>
);