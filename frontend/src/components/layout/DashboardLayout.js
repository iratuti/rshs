import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from '../ui/sonner';

export const DashboardLayout = ({ isAdmin = false }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        {/* Full width container - removed max-w-4xl restriction */}
        <div className="w-full max-w-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <Outlet />
        </div>
      </main>
      {!isAdmin && <BottomNav />}
      <Toaster position="top-center" richColors />
    </div>
  );
};

export default DashboardLayout;
