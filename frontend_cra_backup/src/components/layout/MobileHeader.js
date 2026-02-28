import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X,
  BookOpen, 
  ClipboardList, 
  FileCheck, 
  Calendar, 
  CreditCard, 
  HelpCircle,
  Database,
  LogOut,
  Stethoscope,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const menuItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Input Logbook', end: true },
  { to: '/dashboard/e-remunerasi', icon: ClipboardList, label: 'e-Remunerasi' },
  { to: '/dashboard/e-kinerja', icon: FileCheck, label: 'e-Kinerja' },
  { to: '/dashboard/rekap', icon: Calendar, label: 'Rekap Logbook' },
  { to: '/dashboard/pasien', icon: Database, label: 'Master Data Pasien' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing/Langganan' },
  { to: '/dashboard/support', icon: HelpCircle, label: 'Tiket Support' },
  { to: '/dashboard/profile', icon: User, label: 'Profil' },
];

export const MobileHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const getStatusBadge = () => {
    if (!user?.status_langganan) return null;
    const status = user.status_langganan;
    const variants = {
      TRIAL: 'bg-amber-50 text-amber-700 border-amber-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      EXPIRED: 'bg-red-50 text-red-700 border-red-200'
    };
    return (
      <Badge className={`${variants[status]} border text-xs`}>
        {status}
      </Badge>
    );
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <header className="md:hidden sticky top-0 bg-white border-b border-slate-100 z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate('/dashboard')}
          data-testid="mobile-logo"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-slate-900 text-sm">
            Sepulang<span className="text-teal-600">Dinas</span>
          </span>
        </div>

        {/* Hamburger Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              data-testid="mobile-menu-btn"
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b border-slate-100">
              <SheetTitle className="text-left font-heading">Menu</SheetTitle>
            </SheetHeader>
            
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
            <nav className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={handleNavClick}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Logout Button - Separated */}
            <div className="p-4 border-t border-slate-100 mt-auto">
              <Button
                variant="outline"
                onClick={handleLogout}
                data-testid="mobile-logout-btn"
                className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default MobileHeader;
