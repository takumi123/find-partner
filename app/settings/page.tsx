import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">設定</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* 通知設定 */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-medium mb-4">通知設定</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">メール通知</h3>
                    <p className="text-sm text-gray-500">新しい分析結果の通知を受け取る</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* アカウント設定 */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-medium mb-4">アカウント設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="メールアドレスを入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">パスワード</label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="新しいパスワード"
                  />
                </div>
              </div>
            </div>

            {/* データ管理 */}
            <div>
              <h2 className="text-lg font-medium mb-4">データ管理</h2>
              <div className="space-y-4">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  アカウントを削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
