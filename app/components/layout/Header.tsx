"use client";

import React from 'react';
import { handleSignOut } from '../../actions/auth';

interface HeaderProps {
  userName?: string | null;
  userRole?: string | null;
}

export const Header = ({ userName, userRole }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Find Partner</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-900">
              {userRole === 'admin' ? '管理者' : 'ユーザー'}モード
            </span>
            <span className="text-sm text-gray-900">
              {userName ?? 'ゲスト'}さん
            </span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
};
