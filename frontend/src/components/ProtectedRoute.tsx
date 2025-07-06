import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // TODO: Add token validation logic here. A token might exist but be expired.
  // For now, just checking for existence is enough for the structure.

  return <Outlet />;
};

export default ProtectedRoute; 