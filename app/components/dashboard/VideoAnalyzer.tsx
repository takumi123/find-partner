"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface VideoFile {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  googleDriveFileId: string;
  createdAt: string;
  analyses: Analysis[];
}

interface Analysis {
  id: string;
  analysisResults: string | null;
  aiResponses: string | null;
  totalScore: number | null;
  status: string;
  createdAt: string;
}

export const VideoAnalyzer = () => {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 動画一覧を取得
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '動画の取得に失敗しました');
      }

      setVideos(data.videos);
    } catch (error) {
      setError(error instanceof Error ? error.message : '動画の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 動画を分析
  const analyzeVideo = async (videoId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/videos', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '分析に失敗しました');
      }

      setAnalysis(data.analysis);
    } catch (error) {
      setError(error instanceof Error ? error.message : '分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 動画選択時の処理
  const handleVideoSelect = async (video: VideoFile) => {
    setSelectedVideo(video);
    // 既存の分析結果があれば表示
    if (video.analyses && video.analyses.length > 0) {
      setAnalysis(video.analyses[0]); // 最新の分析結果を表示
    } else {
      await analyzeVideo(video.id);
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (session?.user) {
      fetchVideos();
    }
  }, [session]);

  if (!session?.user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">分析を開始するにはログインが必要です。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">動画分析</h2>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 動画一覧 */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-3">動画一覧</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`cursor-pointer p-4 rounded-lg border ${
                selectedVideo?.id === video.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleVideoSelect(video)}
            >
              <p className="text-sm text-gray-900 truncate">{video.fileName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(video.createdAt).toLocaleDateString()}
              </p>
              {video.analyses.length > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    分析済み
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 分析結果 */}
      {selectedVideo && (
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">
            {selectedVideo.fileName}の分析結果
          </h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : analysis ? (
            <div className="prose max-w-none">
              {analysis.status === 'pending' ? (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-700">分析を実行中です...</p>
                </div>
              ) : (
                <>
                  {analysis.totalScore !== null && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-blue-900">総合スコア</h4>
                      <p className="text-2xl font-bold text-blue-600">{analysis.totalScore}</p>
                    </div>
                  )}
                  {analysis.analysisResults && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-gray-900">分析結果</h4>
                      <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {analysis.analysisResults}
                      </pre>
                    </div>
                  )}
                  {analysis.aiResponses && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900">AIレスポンス</h4>
                      <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {analysis.aiResponses}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">分析結果がありません</p>
          )}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-600">分析中...</p>
          </div>
        </div>
      )}
    </div>
  );
};
