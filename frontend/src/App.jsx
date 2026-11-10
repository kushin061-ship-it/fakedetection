import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import {
  OverviewPage,
  PredictPage,
  ModelsPage,
  ErrorsPage,
  ExplainabilityPage,
  PatternsPage,
  BatchPage,
  NotFoundPage,
  DesignCheckPage,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="predict" element={<PredictPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="errors" element={<ErrorsPage />} />
          <Route path="explainability" element={<ExplainabilityPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="batch" element={<BatchPage />} />
          <Route path="design-check" element={<DesignCheckPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
