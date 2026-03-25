import React from "react";
export const Label = ({ className, ...props }: any) => (
  <label className={`text-sm font-black leading-none ${className || ""}`} {...props} />
);