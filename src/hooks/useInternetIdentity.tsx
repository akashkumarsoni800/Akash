import { useState } from 'react';

export const useInternetIdentity = () => {
  // Yeh ek nakli login hai taaki error hat jaye
  const [identity] = useState<any>(null); 
  const [isInitializing] = useState(false);
  return { identity, isInitializing, login: () => {}, logout: () => {} };
};