
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

const LoginPage: React.FC = () => {
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: 'Logging in...', type: 'info' });
    setIsLoading(true);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('matric_number', matricNumber)
        .eq('password', password)
        .single();

      if (error || !user) {
        setMessage({ text: 'Invalid Matriculation Number or Password', type: 'error' });
      } else {
        setMessage({ text: 'Login Successful!', type: 'success' });
        localStorage.setItem('user', JSON.stringify(user));

        setTimeout(() => {
          if (user.role === 'hoc') {
            navigate('/hoc-dashboard');
          } else {
            navigate('/student-dashboard');
          }
        }, 1000);
      }
    } catch (err) {
      setMessage({ text: 'An error occurred during login.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Student Login</h2>
          <p className="mt-2 text-sm text-slate-600">
            Welcome back to the Faculty of Engineering Portal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Matriculation Number</label>
              <input
                type="text"
                required
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ENG/XX/XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in duration-300 ${
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
              'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white shadow-lg transition-all transform active:scale-[0.98] ${
                isLoading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500 font-semibold">
              New here? Register a new account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
