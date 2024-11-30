"use client";

import React from 'react';

type AnalysisStatus = 'waiting' | 'processing' | 'completed' | 'error';

interface AnalysisResult {
  status: AnalysisStatus;
  lastUpdated?: Date;
  summary?: string;
  score?: number;
}

export const AnalysisResults = () => {
  // TODO: 実際のデータ取得ロジックを実装
  const mockResult: AnalysisResult = {
    status: 'waiting',
    lastUpdated: new Date(),
  };

  const getStatusBadge = (status: AnalysisStatus) => {
    const styles = {
      waiting: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    };

    const labels = {
      waiting: '分析待ち',
      processing: '分析中',
      completed: '分析完了',
      error: 'エラー',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleStartAnalysis = async () => {
    try {
      // TODO: 分析開始処理の実装
      console.log('分析を開始します');
    } catch (error) {
      console.error('分析開始エラー:', error);
      alert('分析の開始に失敗しました。');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">分析結果</h2>
      <div className="space-y-4">
        <div className="border rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">最新の分析状況</h3>
            {getStatusBadge(mockResult.status)}
          </div>
          
          {mockResult.lastUpdated && (
            <p className="text-sm text-gray-900">
              最終更新: {mockResult.lastUpdated.toLocaleString()}
            </p>
          )}

          {mockResult.summary && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">分析サマリー</h4>
              <p className="text-sm text-gray-900">{mockResult.summary}</p>
            </div>
          )}

          {mockResult.score !== undefined && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">総合スコア</h4>
              <div className="text-2xl font-bold text-blue-600">
                {mockResult.score}
              </div>
            </div>
          )}
        </div>

        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          onClick={handleStartAnalysis}
        >
          分析を開始
        </button>
      </div>
    </div>
  );
};
