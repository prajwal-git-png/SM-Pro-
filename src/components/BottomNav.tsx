import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Target, HeadphonesIcon, Settings, PlusCircle } from 'lucide-react';
import { cn } from '../utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-entry', icon: PlusCircle, label: 'New Entry' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/target', icon: Target, label: 'Target' },
  { to: '/crm', icon: HeadphonesIcon, label: 'CRM' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="glass-panel mx-4 mb-4 rounded-2xl flex justify-between items-center px-2 py-2 bg-white/60 dark:bg-black/60">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-slate-900/5 dark:border-white/5'
                  : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white/90 hover:bg-slate-900/5 dark:hover:bg-white/5'
              )
            }
          >
            <item.icon className="w-6 h-6" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
