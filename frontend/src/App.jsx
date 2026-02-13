import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeApp from './employee/EmployeeApp';
import AdminApp from './admin/AdminApp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EmployeeApp />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


