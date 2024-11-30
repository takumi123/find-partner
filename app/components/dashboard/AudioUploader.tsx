"use client";

import React, { useState } from 'react';

export const AudioUploader = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
    } else {
      alert('音声ファイルを選択してください。');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('ファイルを選択してください。');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // TODO: 実際のアップロード処理を実装
      // モックのプログレス表示
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      alert('アップロードが完了しました。');
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">音声ファイルアップロード</h2>
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="block w-full text-gray-900
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
            disabled={uploading}
          />
          {selectedFile && (
            <div className="mt-2 text-sm text-gray-900">
              選択されたファイル: {selectedFile.name}
            </div>
          )}
        </div>

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <button
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 transition-colors'
            }`}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'アップロード中...' : 'アップロード開始'}
        </button>

        <p className="text-sm text-gray-900">
          ※ 音声ファイル（.mp3, .wav, .m4a など）をアップロードしてください。
        </p>
      </div>
    </div>
  );
};
