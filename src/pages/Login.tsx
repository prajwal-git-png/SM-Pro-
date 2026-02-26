import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const { settings, updateSettings } = useStore();
  const [formData, setFormData] = useState({
    userName: settings?.userName || '',
    empId: settings?.empId || '',
    storeLocation: settings?.storeLocation || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName || !formData.empId || !formData.storeLocation) {
      toast.error('Please fill in all fields');
      return;
    }
    
    await updateSettings({
      ...formData,
      isLoggedIn: true,
    });
    toast.success('Welcome back!');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#050505] text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Optimized Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/30 via-blue-500/5 to-transparent" />
        <div className="absolute top-[20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/30 via-purple-500/5 to-transparent" />
      </div>

      <div className="glass-panel p-8 rounded-3xl w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome</h1>
          <p className="opacity-70 text-sm">Sign in to SalesPro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">User Name</label>
            <input
              type="text"
              required
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="glass-input w-full"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Employee ID</label>
            <input
              type="text"
              required
              value={formData.empId}
              onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
              className="glass-input w-full"
              placeholder="Employee ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Store Name / Location</label>
            <input
              type="text"
              required
              value={formData.storeLocation}
              onChange={(e) => setFormData({ ...formData, storeLocation: e.target.value })}
              className="glass-input w-full"
              placeholder="Store"
            />
          </div>

          <button type="submit" className="glass-button w-full flex items-center justify-center gap-2 mt-8 shine-text !text-white">
            Continue to App
          </button>
        </form>
      </div>
    </div>
  );
}
