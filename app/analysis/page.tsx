import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export default function AnalysisPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">分析結果</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* 分析結果の表示エリア */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-medium mb-2">最新の分析</h2>
              <p className="text-gray-600">
                まだ分析結果がありません。新しい分析を開始してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
