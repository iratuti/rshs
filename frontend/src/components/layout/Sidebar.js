import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  CreditCard, 
  HelpCircle,
  Users,
  BarChart3,
  MessageSquare,
  LogOut,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

const userMenuItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Input Logbook' },
  { to: '/dashboard/generator', icon: FileText, label: 'Generator Laporan' },
  { to: '/dashboard/rekap', icon: Calendar, label: 'Rekap Logbook' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { to: '/dashboard/support', icon: HelpCircle, label: 'Support' },
];

const adminMenuItems = [
  { to: '/admin', icon: Users, label: 'Semua User' },
  { to: '/admin/revenue', icon: BarChart3, label: 'Revenue' },
  { to: '/admin/tickets', icon: MessageSquare, label: 'Kelola Tiket' },
];

export const Sidebar = ({ isAdmin = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

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

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
          data-testid="sidebar-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-slate-900">
              Sepulang<span className="text-teal-600">Dinas</span>
            </h1>
            <p className="text-xs text-slate-500">
              {isAdmin ? 'Admin Panel' : 'Dashboard'}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
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
        {!isAdmin && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Status:</span>
            {getStatusBadge()}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin'}
            data-testid={`sidebar-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <Button
          variant="ghost"
          onClick={logout}
          data-testid="sidebar-logout-btn"
          className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
