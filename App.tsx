
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './RegistrationPage';
import LoginPage from './LoginPage';
import { StudentDashboard, HocDashboard } from './Dashboard';

// Simple Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode, role?: 'student' | 'hoc' }> = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'hoc' ? '/hoc-dashboard' : '/student-dashboard'} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/hoc-dashboard" 
          element={
            <ProtectedRoute role="hoc">
              <HocDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
