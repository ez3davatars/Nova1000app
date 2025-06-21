import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import { VoiceModePage } from './pages/VoiceModePage';
import { AboutPage } from './pages/AboutPage';
import MicAccessPage from './pages/MicAccessPage';

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/voice" element={<VoiceModePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/mic-access" element={<MicAccessPage />} />
      </Routes>
    </Router>
  );
}