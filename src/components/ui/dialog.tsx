import React from "react";

export const Dialog = ({ children }: any) => <div>{children}</div>;
export const DialogTrigger = ({ children, asChild }: any) => <div className="inline-block">{children}</div>;
export const DialogContent = ({ children, className }: any) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50`}>
    <div className={`bg-white p-6 rounded-lg shadow-lg w-full max-w-lg ${className}`}>{children}</div>
  </div>
);
export const DialogHeader = ({ className, children }: any) => <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>;
export const DialogTitle = ({ className, children }: any) => <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>;
export const DialogDescription = ({ className, children }: any) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;