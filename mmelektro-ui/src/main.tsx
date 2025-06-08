import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import LoginPage from './Login.tsx'
import AdminDashboard from './AdminDashboard.tsx';
import RegisterPage from './Register';
import LandingPage from './LandingPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/app' element={<ProtectedRoute><App /></ProtectedRoute>} />
      <Route path='/admin' element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path='/' element={<div>Dashboard (coming soon)</div>} />
    </Routes>
    </BrowserRouter>
  </StrictMode>,
)
