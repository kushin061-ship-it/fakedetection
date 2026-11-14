import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import DetectPage from './pages/DetectPage';
import BulkDetectPage from './pages/BulkDetectPage';
import ExplainabilityPage from './pages/ExplainabilityPage';
import ReportsPage from './pages/ReportsPage';
import ModelsPage from './pages/ModelsPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function RequireAuth({ children }) {
  const auth = JSON.parse(localStorage.getItem('tl_auth') || '{}');
  if (!auth.loggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="detect" element={<DetectPage />} />
          <Route path="bulk" element={<BulkDetectPage />} />
          <Route path="explainability" element={<ExplainabilityPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
