'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen, 
  ClipboardList, 
  FileCheck, 
  Calendar, 
  CreditCard, 
  HelpCircle,
  Database,
  LogOut,
  Stethoscope,
  User,
  Users,
  DollarSign,
  Ticket,
  PercentCircle,
  Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const userMenuItems = [
  { href: '/dashboard', icon: BookOpen, label: 'Input Logbook' },
  { href: '/dashboard/e-remunerasi', icon: ClipboardList, label: 'e-Remunerasi' },
  { href: '/dashboard/e-kinerja', icon: FileCheck, label: 'e-Kinerja' },
  { href: '/dashboard/rekap', icon: Calendar, label: 'Rekap Logbook' },
  { href: '/dashboard/pasien', icon: Database, label: 'Master Data Pasien' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing/Langganan' },
  { href: '/dashboard/support', icon: HelpCircle, label: 'Tiket Support' },
  { href: '/dashboard/profile', icon: User, label: 'Profil' },
];

const adminMenuItems = [
  { href: '/admin', icon: Users, label: 'Kelola Pengguna' },
  { href: '/admin/tickets', icon: Ticket, label: 'Tiket Support' },
  { href: '/admin/promo-codes', icon: PercentCircle, label: 'Promo Codes' },
  { href: '/admin/revenue', icon: DollarSign, label: 'Pendapatan' },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const { user, logout, isAdmin: userIsAdmin } = useAuth();
  const pathname = usePathname();

  // Show admin menu if explicitly passed OR if user has admin role
  const showAdminMenu = isAdmin || userIsAdmin;
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const getStatusBadge = () => {
    if (!user?.status_langganan) return null;
    const status = user.status_langganan;
    const variants: Record<string, string> = {
      TRIAL: 'bg-amber-50 text-amber-700 border-amber-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      EXPIRED: 'bg-red-50 text-red-700 border-red-200'
    };
    return (
      <Badge className={`${variants[status]} border text-[10px]`}>
        {status}
      </Badge>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-slate-100">
        <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-heading font-bold text-slate-900">
              Sepulang<span className="text-teal-600">Dinas</span>
            </span>
            {showAdminMenu && (
              <Badge variant="secondary" className="ml-2 text-[10px]">ADMIN</Badge>
            )}
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.picture} alt={user?.name} />
            <AvatarFallback className="bg-teal-100 text-teal-700">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">Status:</span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`sidebar-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Section - shown on user dashboard when user is admin */}
        {!isAdmin && showAdminMenu && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Admin Panel</span>
            </div>
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`sidebar-admin-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <Button
          variant="ghost"
          onClick={logout}
          data-testid="sidebar-logout-btn"
          className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
