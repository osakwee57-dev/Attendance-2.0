import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { LEVELS } from './constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Common Dashboard Layout Shell
 */
const DashboardLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white text-xs font-bold">FE</span>
              </div>
              <span className="font-bold text-slate-800 tracking-tight">Engineering Portal</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm text-slate-900 font-bold leading-none">{user.full_name}</span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">
                  {user.role === 'hoc' ? 'HOC' : 'Student'} • {user.department}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-white hover:bg-red-600 font-bold px-4 py-2 border border-red-200 rounded-lg transition-all duration-200 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
};

/**
 * Student Dashboard View
 */
export const StudentDashboard: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [searchParams] = useSearchParams();
  const [passcode, setPasscode] = useState(searchParams.get('code') || '');
  const [isSigning, setIsSigning] = useState(false);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const handleSignAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || passcode.length !== 6) {
      setMessage({ text: 'Please enter a valid 6-digit passcode.', type: 'error' });
      return;
    }
    
    setIsSigning(true);
    setMessage({ text: 'Verifying session...', type: 'info' });

    try {
      const { data: session, error: sError } = await supabase
        .from('sessions')
        .select('id, is_active')
        .eq('passcode', passcode)
        .eq('is_active', true)
        .maybeSingle();

      if (sError || !session) {
        throw new Error('Invalid or expired session code.');
      }

      const { error: logError } = await supabase
        .from('attendance_logs')
        .insert([{ 
          session_id: session.id, 
          student_matric: user.matric_number 
        }]);

      if (logError) {
        if (logError.code === '23505') {
          throw new Error('You have already signed for this session.');
        }
        throw logError;
      }

      setMessage({ text: 'Attendance recorded successfully!', type: 'success' });
      setPasscode('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSigning(false);
    }
  };

  const updateLevel = async (newLevel: string) => {
    setIsUpdatingLevel(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ level: parseInt(newLevel) })
        .eq('matric_number', user.matric_number);

      if (error) throw error;
      const updatedUser = { ...user, level: newLevel };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload(); 
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  return (
    <DashboardLayout title={`Welcome, ${user.full_name}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Sign Attendance
            </h3>
            <form onSubmit={handleSignAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enter 6-Digit Passcode</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center text-3xl tracking-[0.2em] transition-all text-black font-bold"
                  placeholder="000000"
                />
              </div>
              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium animate-in fade-in duration-300 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 
                  message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {message.text}
                </div>
              )}
              <button 
                type="submit"
                disabled={isSigning || !passcode}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-[0.98]"
              >
                {isSigning ? 'Verifying...' : 'Submit Attendance'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2">My Profile</h3>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-medium">Matric:</span>
                <span className="font-bold text-slate-900 font-mono uppercase">{user.matric_number}</span>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Update Level</span>
                  <select 
                    value={user.level}
                    disabled={isUpdatingLevel}
                    onChange={(e) => updateLevel(e.target.value)}
                    className="text-sm font-black text-blue-700 bg-white border border-blue-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  >
                    {LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl} Level</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg mb-8">Course Announcements</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-700">No active announcements</h4>
              <p className="text-sm text-slate-500 max-w-sm mt-2">
                Faculty updates will appear here once posted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/**
 * HOC Dashboard View
 */
export const HocDashboard: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [view, setView] = useState<'live' | 'directory'>('live');
  const [courseCode, setCourseCode] = useState('');
  const [activeSession, setActiveSession] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [fullClassList, setFullClassList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);

  const filteredList = useMemo(() => {
    return fullClassList.filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matric_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fullClassList, searchTerm]);

  useEffect(() => {
    const initData = async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('hoc_matric', user.matric_number)
        .eq('is_active', true)
        .maybeSingle();

      if (session) setActiveSession(session);
      
      const { data: list } = await supabase
        .from('users')
        .select('full_name, matric_number, level, signature_data')
        .eq('department', user.department)
        .eq('level', parseInt(user.level))
        .order('matric_number', { ascending: true });
        
      setFullClassList(list || []);
    };
    initData();
  }, [user.matric_number, user.department, user.level]);

  useEffect(() => {
    if (!activeSession) return;

    const fetchLiveAttendees = async () => {
      const { data } = await supabase
        .from('attendance_logs')
        .select(`
          student_matric,
          created_at,
          users:student_matric (full_name, signature_data)
        `)
        .eq('session_id', activeSession.id)
        .order('created_at', { ascending: false });
      
      setAttendees(data || []);
    };

    fetchLiveAttendees();

    const channel = supabase.channel(`live-session-${activeSession.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'attendance_logs', filter: `session_id=eq.${activeSession.id}` }, 
        () => fetchLiveAttendees()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeSession]);

  const startSession = async () => {
    if (!courseCode.trim()) return alert('Please enter a course code');
    
    setIsStarting(true);
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert([{ 
            course_code: courseCode.toUpperCase().trim(), 
            passcode, 
            hoc_matric: user.matric_number,
            is_active: true 
        }])
        .select().single();

      if (error) throw error;
      setActiveSession(session);
      
      // IMMEDIATELY add the HOC to the attendance log
      await supabase.from('attendance_logs').insert([
        { 
          session_id: session.id, 
          student_matric: user.matric_number 
        }
      ]);
      
      alert("Session Started! You have been added to the list as the first attendee.");
      setMessage('');
      setCourseCode('');
    } catch (err: any) {
      setMessage(err.message || 'Error starting session');
    } finally {
      setIsStarting(false);
    }
  };

  const updateLevel = async (newLevel: string) => {
    setIsUpdatingLevel(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ level: parseInt(newLevel) })
        .eq('matric_number', user.matric_number);
      if (error) throw error;
      localStorage.setItem('user', JSON.stringify({ ...user, level: newLevel }));
      window.location.reload(); 
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  const stopSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("End the attendance session and close access?")) return;

    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', activeSession.id);
      
    if (error) {
      console.error("Error stopping session:", error);
      alert("Failed to stop session. Check console.");
    } else {
      setActiveSession(null);
      setAttendees([]);
    }
  };

  const copyShareLink = () => {
    if (!activeSession) return;
    const link = `${window.location.origin}/#/student-dashboard?code=${activeSession.passcode}`;
    navigator.clipboard.writeText(`Sign attendance for ${activeSession.course_code}: ${link}`);
    alert("Shareable link copied!");
  };

  const exportLiveSessionToPDF = () => {
    if (!activeSession) return;
    
    const doc = new jsPDF();
    
    // Header configuration
    const headerLine1 = `DEPARTMENT: ${user.department.toUpperCase()}`;
    const headerLine2 = `COURSE CODE: ${activeSession.course_code.toUpperCase()}`;
    const headerLine3 = `LEVEL: ${user.level}L`;
    const dateStr = `DATE: ${new Date().toLocaleDateString()}`;

    // Draw Header Text
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(headerLine1, 14, 15);
    doc.text(headerLine2, 14, 22);
    doc.text(headerLine3, 14, 29);
    doc.text(dateStr, 140, 15);
    
    doc.line(14, 32, 196, 32); // Horizontal line under header

    autoTable(doc, {
      head: [['S/N', 'Matric Number', 'Full Name', 'Signature', 'Time Signed']],
      body: attendees.map((a, index) => [
        index + 1,
        a.student_matric, 
        a.users?.full_name || 'HOC Member', 
        '', // Placeholder for signature image
        new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ]),
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      styles: { fontSize: 8, minCellHeight: 14, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 10 },
        3: { cellWidth: 35 }
      },
      didDrawCell: (data) => {
        // Embed signature image if it's the 'Signature' column
        if (data.section === 'body' && data.column.index === 3) {
          const attendee = attendees[data.row.index];
          const signature = attendee.users?.signature_data;
          if (signature) {
            try {
              // Add student's digital signature directly to the cell
              doc.addImage(signature, 'PNG', data.cell.x + 2, data.cell.y + 1, 30, 11);
            } catch (e) {
              console.error("Error embedding signature in PDF", e);
            }
          }
        }
      },
    });
    
    doc.save(`${activeSession.course_code}_Attendance.pdf`);
  };

  const exportDirectoryToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Class Register: ${user.department}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`${user.level} Level`, 14, 28);
    autoTable(doc, {
      head: [['S/N', 'Matric Number', 'Full Name']],
      body: filteredList.map((s, i) => [i + 1, s.matric_number, s.full_name]),
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillStyle: '#334155' },
    });
    doc.save(`${user.department}_Level_${user.level}_Register.pdf`);
  };

  return (
    <DashboardLayout title="HOC Administrative Panel">
      <div className="flex border-b border-slate-200 mb-8 bg-white rounded-t-xl px-2 shadow-sm overflow-hidden">
        <button 
          onClick={() => setView('live')}
          className={`px-8 py-5 font-bold text-xs tracking-widest transition-all border-b-2 whitespace-nowrap uppercase ${
            view === 'live' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Live Session
        </button>
        <button 
          onClick={() => setView('directory')}
          className={`px-8 py-5 font-bold text-xs tracking-widest transition-all border-b-2 whitespace-nowrap uppercase ${
            view === 'directory' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Class Register
        </button>
      </div>

      {view === 'live' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {!activeSession ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4">Start New Session</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Course Code</label>
                    <input 
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-black"
                      placeholder="e.g. MEE 501"
                    />
                  </div>
                  {message && <p className="text-xs text-red-600 font-semibold">{message}</p>}
                  <button 
                    onClick={startSession}
                    disabled={isStarting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isStarting ? 'Starting...' : 'Generate Passcode'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-600 p-6 rounded-2xl shadow-xl text-white space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Tracking Active</span>
                    <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                  </div>
                  <h2 className="text-3xl font-black">{activeSession.course_code}</h2>
                </div>
                <div className="bg-blue-700/50 p-6 rounded-2xl border border-blue-400/30 text-center shadow-inner">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 mb-2">Access Passcode</span>
                  <div className="text-5xl font-mono font-black tracking-widest">{activeSession.passcode}</div>
                </div>
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <button 
                    onClick={exportLiveSessionToPDF} 
                    className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Export Live List to PDF
                  </button>
                  <button onClick={copyShareLink} className="w-full py-3 bg-blue-500/50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-blue-400/50">
                    Copy Shareable Link
                  </button>
                  <button onClick={stopSession} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-all active:scale-95">
                    Stop Session
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Administrative Role</h3>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
                   <div className="flex items-center gap-1">
                    <span>Year: </span>
                    <select value={user.level} disabled={isUpdatingLevel} onChange={(e) => updateLevel(e.target.value)} className="font-black text-blue-600 bg-blue-50 rounded px-1 outline-none cursor-pointer">
                      {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
                    </select>
                  </div>
                  <span>ENG Dept Portal</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[550px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Live Attendee Feed</h3>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase border border-blue-100">
                  {attendees.length} Attendees
                </span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                {!activeSession ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40">
                    <p className="text-xs font-bold uppercase tracking-widest">No active session started</p>
                  </div>
                ) : attendees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Listening for sign-ins...</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Matriculation</th>
                        <th className="px-6 py-4">Signature</th>
                        <th className="px-6 py-4 text-right">Time Signed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendees.map((a, i) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors animate-in slide-in-from-top-1">
                          <td className="px-6 py-4 text-sm font-bold text-slate-800 uppercase leading-tight">{a.users?.full_name || 'HOC Member'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono tracking-tighter">{a.student_matric}</td>
                          <td className="px-6 py-4">
                            {a.users?.signature_data && (
                               <img src={a.users.signature_data} className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity" alt="Sign" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 text-right font-medium">
                            {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50/50 gap-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-tight">Student Directory</h3>
              <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">{user.department} • {user.level}L</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-inner bg-white text-black font-medium"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <button onClick={exportDirectoryToPDF} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg hover:bg-slate-900 active:scale-95 transition-all">
                Download PDF
              </button>
              <div className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-200">
                {filteredList.length} Students
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5">S/N</th>
                  <th className="px-6 py-5">Matriculation</th>
                  <th className="px-6 py-5">Student Name</th>
                  <th className="px-6 py-5 text-center">Verified Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((s, i) => (
                  <tr key={s.matric_number} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 text-xs font-black text-slate-300">{i + 1}</td>
                    <td className="px-6 py-5 text-sm font-mono font-bold text-blue-600 uppercase tracking-tighter">{s.matric_number}</td>
                    <td className="px-6 py-5 text-sm font-extrabold text-slate-800 uppercase tracking-tight">{s.full_name}</td>
                    <td className="px-6 py-5 text-center">
                      {s.signature_data ? (
                        <div className="flex justify-center">
                          <img src={s.signature_data} alt="Sign" className="h-8 max-w-[150px] object-contain hover:scale-125 transition-transform cursor-pointer" />
                        </div>
                      ) : <span className="text-[10px] font-bold text-slate-400 italic uppercase">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
