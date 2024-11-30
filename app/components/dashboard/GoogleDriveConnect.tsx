"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Folder {
  id: string;
  name: string;
}

interface VideoFile {
  id: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export const GoogleDriveConnect = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);

  // フォルダ一覧を取得
  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/google_drive');
      const data = await response.json();
      if (Array.isArray(data)) {
        setFolders(data);
      }
    } catch (error) {
      console.error('フォルダ一覧取得エラー:', error);
      alert('フォルダ一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 動画ファイル一覧を取得
  const fetchVideos = async (folderId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/google_drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setVideos(data);
      }
    } catch (error) {
      console.error('動画ファイル一覧取得エラー:', error);
      alert('動画ファイル一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // フォルダ選択時の処理
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    setSelectedVideo(null);
    fetchVideos(folderId);
  };

  // 動画選択時の処理
  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video);
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Google Drive連携</h2>
      
      {/* フォルダ選択セクション */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          フォルダを選択
        </label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedFolder}
          onChange={(e) => handleFolderSelect(e.target.value)}
          disabled={loading}
        >
          <option value="">フォルダを選択してください</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* 動画一覧セクション */}
      {selectedFolder && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">動画一覧</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`cursor-pointer p-2 rounded-lg border ${
                  selectedVideo?.id === video.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleVideoSelect(video)}
              >
                {video.thumbnailLink ? (
                  <div className="relative w-full h-32 mb-2">
                    <Image
                      src={video.thumbnailLink}
                      alt={video.name}
                      fill
                      className="object-cover rounded"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded mb-2">
                    <span className="text-gray-400">サムネイルなし</span>
                  </div>
                )}
                <p className="text-sm text-gray-900 truncate">{video.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 選択した動画の表示セクション */}
      {selectedVideo && (
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">
            選択した動画: {selectedVideo.name}
          </h3>
          <div className="aspect-video">
            <iframe
              src={selectedVideo.webViewLink}
              className="w-full h-full rounded"
              allowFullScreen
              title={`${selectedVideo.name}のプレビュー`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
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
