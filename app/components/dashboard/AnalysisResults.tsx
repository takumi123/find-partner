"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getGoogleDriveUrl } from '@/app/utils/google-drive';
import { StructuredAnalysisOutput } from '../../types/structured-output';

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  weight: number;
}

interface EvaluationScore {
  id: string;
  score: number;
  criteria: EvaluationCriteria;
}

interface Analysis {
  id: string;
  title: string;
  content: string;
  status: string;
  aiResponses: string | null;
  analysisResults: {
    geminiAnalysis: string;
    structuredOutput?: StructuredAnalysisOutput;
  } | null;
  createdAt: string;
  videoFile: {
    fileName: string;
    fileUrl: string;
    googleDriveFileId: string;
  } | null;
  audioFile: {
    fileName: string;
    fileUrl: string;
  } | null;
  evaluationScores: EvaluationScore[];
}

export const AnalysisResults = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (sessionStatus === 'loading') return;
      
      if (!session) {
        setLoading(false);
        return;
      }
      
      try {
        setError(null);
        const response = await fetch('/api/analyses');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '分析結果の取得に失敗しました');
        }
        
        if (data.success && Array.isArray(data.analyses)) {
          setAnalyses(data.analyses);
        } else {
          throw new Error('不正なレスポンス形式です');
        }
      } catch (error) {
        console.error('分析結果の取得エラー:', error);
        setError(error instanceof Error ? error.message : '分析結果の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [session, sessionStatus]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: '分析待ち',
      processing: '分析中',
      completed: '分析完了',
      error: 'エラー',
    };

    const statusKey = status.toLowerCase() as keyof typeof styles;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statusKey] || styles.error}`}>
        {labels[statusKey] || status}
      </span>
    );
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">分析結果</h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">分析結果</h2>
        <p className="text-gray-500 text-center py-4">ログインが必要です</p>
      </div>
    );
  }

  // 最新3件のみを表示
  const latestAnalyses = analyses.slice(0, 3);
  const hasMoreAnalyses = analyses.length > 3;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">分析結果</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {latestAnalyses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">分析結果がありません</p>
        ) : (
          <>
            {latestAnalyses.map((analysis) => (
              <div key={analysis.id} className="border rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{analysis.title}</h3>
                  {getStatusBadge(analysis.status)}
                </div>
                
                <p className="text-sm text-gray-900">
                  分析日時: {new Date(analysis.createdAt).toLocaleString()}
                </p>

                {analysis.audioFile && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">音声ファイル</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{analysis.audioFile.fileName}</span>
                      <a 
                        href={analysis.audioFile.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        音声を再生
                      </a>
                    </div>
                  </div>
                )}

                {analysis.evaluationScores && analysis.evaluationScores.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">評価スコア</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {analysis.evaluationScores.map((score) => (
                        <div key={score.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{score.criteria.name}</span>
                            {score.criteria.description && (
                              <p className="text-xs text-gray-500">{score.criteria.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{score.score.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">/ 10</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded mt-2">
                        <span className="text-sm font-medium text-blue-900">総合評価</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-900">
                            {(analysis.evaluationScores.reduce((acc, score) => acc + (score.score * score.criteria.weight), 0) / 
                              analysis.evaluationScores.reduce((acc, score) => acc + score.criteria.weight, 0)).toFixed(1)}
                          </span>
                          <span className="text-xs text-blue-700">/ 10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {analysis.content && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">分析内容</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {analysis.content}
                    </p>
                  </div>
                )}

                {analysis.videoFile && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">動画ファイル</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{analysis.videoFile.fileName}</span>
                      <a 
                        href={getGoogleDriveUrl(analysis.videoFile.googleDriveFileId)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        動画を表示
                      </a>
                    </div>
                  </div>
                )}

                {analysis.analysisResults?.geminiAnalysis && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Gemini分析結果</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {analysis.analysisResults.geminiAnalysis}
                    </p>
                  </div>
                )}

                {analysis.aiResponses && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">ChatGPT構造化分析</h4>
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                      {analysis.aiResponses}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {hasMoreAnalyses && (
              <div className="text-center pt-4">
                <Link 
                  href="/analysis"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  もっと見る
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
