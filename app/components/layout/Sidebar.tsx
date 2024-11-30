"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

export const Sidebar = () => {
  const pathname = usePathname();
  
  const navigation: NavItem[] = [
    { name: 'ダッシュボード', href: '/dashboard', icon: '📊' },
    { name: '分析結果', href: '/analysis', icon: '📈' },
    { name: 'プロフィール', href: '/profile', icon: '👤' },
    { name: '設定', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-full">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg hover:bg-gray-100 group ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
