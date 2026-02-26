import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, ClipboardList, FileCheck, Calendar, Database } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Logbook', end: true },
  { to: '/dashboard/e-remunerasi', icon: ClipboardList, label: 'Remun' },
  { to: '/dashboard/e-kinerja', icon: FileCheck, label: 'Kinerja' },
  { to: '/dashboard/rekap', icon: Calendar, label: 'Rekap' },
  { to: '/dashboard/pasien', icon: Database, label: 'Pasien' },
];

export const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-50">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={`bottomnav-${item.label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
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
