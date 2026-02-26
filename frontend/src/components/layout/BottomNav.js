import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, FileText, Calendar, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Logbook' },
  { to: '/dashboard/generator', icon: FileText, label: 'Laporan' },
  { to: '/dashboard/rekap', icon: Calendar, label: 'Rekap' },
  { to: '/dashboard/profile', icon: User, label: 'Profil' },
];

export const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            data-testid={`bottomnav-${item.label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[64px] py-2 transition-colors ${
                isActive
                  ? 'text-teal-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
