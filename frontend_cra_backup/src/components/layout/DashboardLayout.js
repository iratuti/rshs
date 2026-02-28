import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { Toaster } from '../ui/sonner';

export const DashboardLayout = ({ isAdmin = false }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header - only show on mobile for user dashboard */}
      {!isAdmin && <MobileHeader />}
      
      {/* Desktop Sidebar */}
      <Sidebar isAdmin={isAdmin} />
      
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        {/* Full width container */}
        <div className="w-full max-w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <Outlet />
        </div>
      </main>
      
      {/* Bottom Nav - mobile only for user dashboard */}
      {!isAdmin && <BottomNav />}
      
      <Toaster position="top-center" richColors />
    </div>
  );
};

export default DashboardLayout;
