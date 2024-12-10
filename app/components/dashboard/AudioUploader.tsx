"use client";

import React, { useState } from 'react';

interface UploadResponse {
  url: string;
  fileId: string;
  success: boolean;
}

interface AudioUploaderProps {
  onUploadComplete?: (fileId: string, url: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setAudioUrl(null); // 新しいファイルが選択されたら前のURLをリセット
      setFileId(null); // 新しいファイルが選択されたら前のファイルIDをリセット
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
      const formData = new FormData();
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });

      const response = await new Promise<UploadResponse>((resolve, reject) => {
        xhr.open('POST', '/api/upload');
        xhr.onload = () => resolve(JSON.parse(xhr.response));
        xhr.onerror = () => reject(new Error('アップロードに失敗しました'));
        xhr.send(formData);
      });

      if (response.success) {
        setAudioUrl(response.url);
        setFileId(response.fileId);
        onUploadComplete?.(response.fileId, response.url);
        alert('アップロードが完了しました。');
        setSelectedFile(null);
      } else {
        throw new Error('アップロードに失敗しました');
      }
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました。');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h2 className="text-lg font-medium text-gray-900 mb-4">音声ファイルアップロード</h2>
      <div className="space-y-4 w-full">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full">
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

        {audioUrl && (
          <div className="mt-4 space-y-2 w-full">
            <audio controls className="w-full">
              <source src={audioUrl} type={selectedFile?.type} />
              お使いのブラウザは音声再生をサポートしていません。
            </audio>
            {fileId && (
              <div className="text-sm text-gray-600">
                ファイルID: {fileId}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-900">
          ※ 音声ファイル（.mp3, .wav, .m4a など）をアップロードしてください。
        </p>
      </div>
    </div>
  );
};
