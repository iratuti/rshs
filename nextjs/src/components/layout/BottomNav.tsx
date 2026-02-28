'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, FileCheck, Calendar, Database } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: BookOpen, label: 'Logbook' },
  { href: '/dashboard/e-remunerasi', icon: ClipboardList, label: 'Remun' },
  { href: '/dashboard/e-kinerja', icon: FileCheck, label: 'Kinerja' },
  { href: '/dashboard/rekap', icon: Calendar, label: 'Rekap' },
  { href: '/dashboard/pasien', icon: Database, label: 'Pasien' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-50">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`bottomnav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                isActive
                  ? 'text-teal-600'
                  : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
