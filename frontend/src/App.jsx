import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import DetectPage from './pages/DetectPage';
import ExplainabilityPage from './pages/ExplainabilityPage';
import ModelsPage from './pages/ModelsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DetectPage />} />
          <Route path="explainability" element={<ExplainabilityPage />} />
          <Route path="model" element={<ModelsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
