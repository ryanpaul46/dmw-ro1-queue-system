import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Kiosk from './pages/Kiosk';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVDisplay from './pages/TVDisplay';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Kiosk />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tv" element={<TVDisplay />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
