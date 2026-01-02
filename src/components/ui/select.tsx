import React from "react";
export const Select = ({ children, onValueChange }: any) => <div>{children}</div>;
export const SelectTrigger = ({ children, className }: any) => <button className={`border p-2 rounded w-full ${className}`}>{children}</button>;
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: any) => <div className="mt-1 border rounded bg-white shadow">{children}</div>;
export const SelectItem = ({ children, value }: any) => <div className="p-2 hover:bg-gray-100 cursor-pointer">{children}</div>;