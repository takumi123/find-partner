"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import axios from 'axios';

interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  mimeType?: string;
  status?: 'processed' | 'error' | 'existing';
  error?: string;
}

interface ApiSuccessResponse {
  success: true;
  files: GoogleDriveFile[];
  savedFolderId?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

type AxiosError = {
  response?: {
    status: number;
  };
  message: string;
};

const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('response' in error || 'request' in error)
  );
};

const isSuccessResponse = (response: ApiResponse): response is ApiSuccessResponse => {
  return response.success === true;
};

export const GoogleDriveConnect = () => {
  const { data: session, update } = useSession();
  const [folders, setFolders] = useState<GoogleDriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [videos, setVideos] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  const handleReauth = async () => {
    try {
      await signIn('google', { callbackUrl: window.location.href });
      setNeedsReauth(false);
      setError(null);
    } catch (error) {
      console.error('再認証エラー:', error);
      setError('再認証に失敗しました。もう一度お試しください。');
    }
  };

  const handleApiError = useCallback((error: unknown) => {
    console.error('API エラー:', error);
    if (isAxiosError(error)) {
      if (error.response?.status === 401) {
        setNeedsReauth(true);
        setError('認証の有効期限が切れました。再認証が必要です。');
      } else {
        setError(error.message || 'エラーが発生しました');
      }
    } else {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<ApiResponse>('/api/auth/google_drive');
      
      if (!isSuccessResponse(response.data)) {
        throw new Error(response.data.error || 'フォルダ一覧の取得に失敗しました');
      }
      
      setFolders(response.data.files);
      
      if (response.data.savedFolderId) {
        setSelectedFolder(response.data.savedFolderId);
        setIsWatching(true);
        await fetchVideos(response.data.savedFolderId);
      }
      
      setNeedsReauth(false);
    } catch (error) {
      handleApiError(error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchVideos = useCallback(async (folderId: string) => {
    if (!folderId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/google_drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      });

      const data = await response.json() as ApiResponse;
      
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsReauth(true);
          throw new Error('認証の有効期限が切れました。再認証が必要です。');
        }
        throw new Error(data.success === false ? data.error : '動画ファイル一覧の取得に失敗しました');
      }

      if (isSuccessResponse(data)) {
        setVideos(data.files);
        setNeedsReauth(false);
      } else {
        throw new Error(data.error || '動画データの形式が不正です');
      }
    } catch (error) {
      handleApiError(error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const setWatchFolder = useCallback(async (folderId: string) => {
    if (!folderId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/google_drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, action: 'setWatchFolder' }),
      });

      const data = await response.json() as ApiResponse;
      
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsReauth(true);
          throw new Error('認証の有効期限が切れました。再認証が必要です。');
        }
        throw new Error(data.success === false ? data.error : 'フォルダの監視設定に失敗しました');
      }

      if (isSuccessResponse(data)) {
        setIsWatching(true);
        setNeedsReauth(false);
        await update();
      } else {
        throw new Error(data.error || 'フォルダの監視設定に失敗しました');
      }
    } catch (error) {
      handleApiError(error);
      setIsWatching(false);
    } finally {
      setLoading(false);
    }
  }, [handleApiError, update]);

  const handleFolderSelect = useCallback(async (folderId: string) => {
    setSelectedFolder(folderId);
    if (folderId) {
      await setWatchFolder(folderId);
      await fetchVideos(folderId);
    }
  }, [fetchVideos, setWatchFolder]);

  useEffect(() => {
    if (session?.user) {
      fetchFolders();
    }
  }, [session, fetchFolders]);

  if (!session?.user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Google Driveに接続するにはログインが必要です。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Google Drive連携</h2>
        {session.user.googleDriveConnected && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            接続済み
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
          {needsReauth && (
            <button
              onClick={handleReauth}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              再認証する
            </button>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          監視するフォルダを選択
        </label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedFolder}
          onChange={(e) => handleFolderSelect(e.target.value)}
          disabled={loading || needsReauth}
        >
          <option value="">フォルダを選択してください</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        {isWatching && selectedFolder && (
          <p className="mt-2 text-sm text-green-600">
            このフォルダを監視中です。新しい動画を確認するには再読み込みしてください。
          </p>
        )}
      </div>

      {selectedFolder && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">動画一覧</h3>
          <ul className="divide-y divide-gray-200">
            {videos.map((video) => (
              <li key={video.id} className="py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-900">{video.name}</span>
                  {video.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      video.status === 'processed' ? 'bg-green-100 text-green-800' :
                      video.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {video.status === 'processed' ? '処理済み' :
                       video.status === 'error' ? 'エラー' :
                       '既存'}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
