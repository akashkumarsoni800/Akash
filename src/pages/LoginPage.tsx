import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 👇 DHYAN DE: Supabase aur Toast ko comment kar diya hai
// import { supabase } from '../supabaseClient';
// import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Abhi database check nahi karega, bas alert dega
    alert("Test Login Button Clicked! ✅");
    console.log("Email:", email, "Password:", password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">
          TEST LOGIN PAGE
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-bold">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-bold">Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-3 rounded font-bold"
          >
            Check System
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;
