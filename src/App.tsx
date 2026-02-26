/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { useStore } from './store/useStore';
import { useEffect, lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const NewEntry = lazy(() => import('./pages/NewEntry').then(m => ({ default: m.NewEntry })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Target = lazy(() => import('./pages/Target').then(m => ({ default: m.Target })));
const CRM = lazy(() => import('./pages/CRM').then(m => ({ default: m.CRM })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
    <div className="w-16 h-16 relative mb-4">
      <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <div className="text-sm font-medium tracking-widest uppercase opacity-50 animate-pulse">Loading</div>
  </div>
);

export default function App() {
  const { settings, loadSettings, isInitialized } = useStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
      <Toaster position="top-center" toastOptions={{
        className: '!bg-slate-800 !text-white !rounded-2xl !backdrop-blur-xl !bg-opacity-80 border border-white/10',
      }} />
    </BrowserRouter>
  );
}
