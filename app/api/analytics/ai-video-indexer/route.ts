import { NextResponse } from 'next/server';

// Video Indexer APIの設定
const LOCATION = 'trial'; // または特定のAzureリージョン
const ACCOUNT_ID = process.env.VIDEO_INDEXER_ACCOUNT_ID;
const API_KEY = process.env.VIDEO_INDEXER_API_KEY;
const API_BASE = 'https://api.videoindexer.ai';

// アクセストークンを取得する関数
async function getAccessToken() {
  const response = await fetch(
    `${API_BASE}/auth/${LOCATION}/Accounts/${ACCOUNT_ID}/AccessToken`,
    {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': API_KEY!
      }
    }
  );
  
  return response.text();
}

// ビデオをアップロードして分析する関数
async function uploadAndIndexVideo(accessToken: string, videoUrl: string, videoName: string) {
  const params = new URLSearchParams({
    'name': videoName,
    'privacy': 'Private',
    'videoUrl': videoUrl,
    'language': 'ja-JP'
  });

  const response = await fetch(
    `${API_BASE}/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return response.json();
}

// ビデオの分析状態を取得する関数
async function getVideoIndex(accessToken: string, videoId: string) {
  const response = await fetch(
    `${API_BASE}/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos/${videoId}/Index`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return response.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl, videoName } = body;

    if (!videoUrl || !videoName) {
      return NextResponse.json(
        { error: 'videoUrl and videoName are required' },
        { status: 400 }
      );
    }

    // アクセストークンを取得
    const accessToken = await getAccessToken();

    // ビデオをアップロードして分析を開始
    const uploadResult = await uploadAndIndexVideo(accessToken, videoUrl, videoName);

    // 分析結果を取得
    const indexResult = await getVideoIndex(accessToken, uploadResult.id);

    return NextResponse.json({
      message: 'Video analysis started successfully',
      videoId: uploadResult.id,
      indexResult
    });

  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // アクセストークンを取得
    const accessToken = await getAccessToken();

    // 分析結果を取得
    const indexResult = await getVideoIndex(accessToken, videoId);

    return NextResponse.json({
      indexResult
    });

  } catch (error) {
    console.error('Error getting video index:', error);
    return NextResponse.json(
      { error: 'Failed to get video index' },
      { status: 500 }
    );
  }
}
