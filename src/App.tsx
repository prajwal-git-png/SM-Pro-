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
  <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center text-slate-900 dark:text-white relative transition-colors duration-300">
    <div className="flex flex-col items-center justify-center flex-1 w-full">
      <div className="w-32 h-32 bg-slate-900 dark:bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="stroke-white dark:stroke-black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-12">SalesTrack</h1>
      <div className="w-8 h-8 opacity-50">
        <svg className="animate-spin w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
    <div className="absolute bottom-12 text-[10px] font-bold tracking-[0.3em] opacity-40 uppercase">
      Powered by AI
    </div>
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
