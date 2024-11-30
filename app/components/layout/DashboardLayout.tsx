"use client";

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string | null;
  userRole?: string | null;
}

export const DashboardLayout = ({ children, userName, userRole }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header userName={userName} userRole={userRole} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
