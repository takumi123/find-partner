"use client";

import React from 'react';
import { Header } from './Header';
import Sidebar from './Sidebar';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string | null;
  userRole?: string | null;
}

export const DashboardLayout = ({ children, userName, userRole }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header userName={userName} userRole={userRole} />
      <div className="flex flex-1 bg-white">
        <Sidebar />
        <main className="flex-1 bg-gray-50 w-full">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 lg:ml-[64px]">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
