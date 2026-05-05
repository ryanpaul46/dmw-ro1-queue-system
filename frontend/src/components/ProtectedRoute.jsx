import { Navigate } from 'react-router-dom';

// Protects routes that require authentication
export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}
