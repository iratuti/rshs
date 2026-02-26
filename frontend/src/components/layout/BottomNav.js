import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, ClipboardList, FileCheck, Calendar, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Logbook', end: true },
  { to: '/dashboard/e-remunerasi', icon: ClipboardList, label: 'Remun', end: false },
  { to: '/dashboard/e-kinerja', icon: FileCheck, label: 'Kinerja', end: false },
  { to: '/dashboard/rekap', icon: Calendar, label: 'Rekap', end: false },
  { to: '/dashboard/profile', icon: User, label: 'Profil', end: false },
];

export const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={`bottomnav-${item.label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive
                  ? 'text-teal-600'
                  : 'text-slate-400 active:text-slate-600'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
