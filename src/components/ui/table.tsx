import React from "react";

export const Table = ({ className, children }: any) => <div className="w-full overflow-auto"><table className={`w-full caption-bottom text-sm ${className}`}>{children}</table></div>;
export const TableHeader = ({ className, children }: any) => <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>;
export const TableBody = ({ className, children }: any) => <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
export const TableRow = ({ className, children }: any) => <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>{children}</tr>;
export const TableHead = ({ className, children }: any) => <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</th>;
export const TableCell = ({ className, children }: any) => <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</td>;