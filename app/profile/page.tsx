import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">プロフィール</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
              <div>
                <h2 className="text-xl font-medium">ユーザー名</h2>
                <p className="text-gray-600">example@email.com</p>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">基本情報</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">名前</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="名前を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">自己紹介</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={4}
                    placeholder="自己紹介を入力"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
