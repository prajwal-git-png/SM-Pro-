/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewEntry } from './pages/NewEntry';
import { Attendance } from './pages/Attendance';
import { Target } from './pages/Target';
import { CRM } from './pages/CRM';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { useStore } from './store/useStore';
import { useEffect } from 'react';

export default function App() {
  const { settings, loadSettings, isInitialized } = useStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 relative mb-4">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-sm font-medium tracking-widest uppercase opacity-50 animate-pulse">Initializing</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!settings?.isLoggedIn ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="new-entry" element={<NewEntry />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="target" element={<Target />} />
            <Route path="crm" element={<CRM />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
      <Toaster position="top-center" toastOptions={{
        className: '!bg-slate-800 !text-white !rounded-2xl !backdrop-blur-xl !bg-opacity-80 border border-white/10',
      }} />
    </BrowserRouter>
  );
}
