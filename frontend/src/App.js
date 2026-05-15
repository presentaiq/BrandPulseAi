import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { ForgotPassword, ResetPassword } from './pages/PasswordReset';
import Dashboard from './pages/Dashboard';
import Workflow from './pages/Workflow';
import PostPublish from './pages/PostPublish';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import Settings from './pages/Settings';

import './styles/global.css';

const Protected = ({ title, children }) => (
  <ProtectedRoute>
    <AppLayout title={title}>{children}</AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<Protected title="Dashboard"><Dashboard /></Protected>} />
          <Route path="/workflow" element={<Protected title="Plan → Design → Post → Analyse"><Workflow /></Protected>} />
          <Route path="/publish" element={<Protected title="Publish Creative"><PostPublish /></Protected>} />
          <Route path="/analytics" element={<Protected title="Analytics"><Analytics /></Protected>} />
          <Route path="/recommendations" element={<Protected title="Recommendations"><Recommendations /></Protected>} />
          <Route path="/settings" element={<Protected title="Account Settings"><Settings /></Protected>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
