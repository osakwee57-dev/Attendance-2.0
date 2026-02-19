
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRegistrationData } from './types';
import { DEPARTMENTS, LEVELS, HOC_SECRET_CODE } from './constants';
import SignaturePad from './components/SignaturePad';
import AssistantSidebar from './components/AssistantSidebar';
import { supabase } from './supabaseClient';

const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<UserRegistrationData>({
    matric_number: '',
    full_name: '',
    password: '',
    department: '',
    level: '100',
    isHoc: false,
    secretCode: ''
  });
  const [signatureData, setSignatureData] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'info' | 'error' | 'success' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    if (formData.isHoc && formData.secretCode !== HOC_SECRET_CODE) {
      setMessage({ text: 'Invalid HOC Secret Code', type: 'error' });
      return false;
    }
    if (!signatureData) {
      setMessage({ text: 'Please provide your digital signature.', type: 'error' });
      return false;
    }
    if (!formData.department) {
      setMessage({ text: 'Please select your department.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setMessage({ text: 'Registering...', type: 'info' });

    try {
      const { error } = await supabase
        .from('users')
        .insert([
          {
            matric_number: formData.matric_number,
            full_name: formData.full_name,
            password: formData.password,
            department: formData.department,
            level: parseInt(formData.level),
            role: formData.isHoc ? 'hoc' : 'student',
            signature_data: signatureData
          }
        ]);

      if (error) throw error;

      setMessage({ text: 'Registration Successful! Please Login.', type: 'success' });
      
      setFormData({
        matric_number: '',
        full_name: '',
        password: '',
        department: '',
        level: '100',
        isHoc: false,
        secretCode: ''
      });
      setSignatureData('');
      
    } catch (err: any) {
      console.error('Supabase Error:', err);
      setMessage({ 
        text: `Error: ${err.message || 'An unexpected error occurred'}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Student Portal <span className="text-blue-600">Registration</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Join the Faculty of Engineering online community.
          </p>
          <div className="mt-4">
             <Link to="/login" className="text-blue-600 font-semibold hover:underline">Already registered? Login here</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Matriculation Number</label>
                    <input
                      name="matric_number"
                      value={formData.matric_number}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g. ENG/20/001"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      name="full_name"
                      value={formData.full_name}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="John Doe"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <select
                      name="department"
                      value={formData.department}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                    <select
                      name="level"
                      value={formData.level}
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                      onChange={handleInputChange}
                    >
                      {LEVELS.map(level => (
                        <option key={level} value={level}>{level} Level</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      name="isHoc"
                      type="checkbox"
                      checked={formData.isHoc}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      onChange={handleInputChange}
                    />
                    <span className="text-sm font-medium text-slate-700">Are you a Head of Class (HOC)?</span>
                  </label>

                  {formData.isHoc && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-medium text-slate-700 mb-1">HOC Secret Code</label>
                      <input
                        name="secretCode"
                        type="password"
                        value={formData.secretCode}
                        required={formData.isHoc}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Enter authentication code"
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>

                <SignaturePad onCapture={setSignatureData} />

                {message && (
                  <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in duration-300 ${
                    message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
                    isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 sticky top-8">
            <AssistantSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
