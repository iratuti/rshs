import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from '../ui/sonner';

export const DashboardLayout = ({ isAdmin = false }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      {!isAdmin && <BottomNav />}
      <Toaster position="top-center" richColors />
    </div>
  );
};

export default DashboardLayout;
