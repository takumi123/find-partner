import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーの動画ファイルを取得
    const videos = await db.videoFile.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        analyses: true, // 関連する分析結果も取得
      }
    });

    return NextResponse.json({
      success: true,
      videos: videos,
    });

  } catch (error) {
    console.error('動画ファイル取得エラー:', error);
    return NextResponse.json(
      { error: '動画ファイルの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 特定の動画ファイルをGeminiで分析
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { videoId } = await request.json();

    // 動画ファイルの存在確認
    const video = await db.videoFile.findUnique({
      where: {
        id: videoId,
        userId: session.user.id,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: '動画ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // 既存の分析結果を確認
    const existingAnalysis = await db.analysis.findFirst({
      where: {
        videoFileId: video.id,
      },
    });

    if (existingAnalysis) {
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis,
      });
    }

    // Gemini分析を実行
    const response = await fetch('http://localhost:3000/api/analytics/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        videoFileId: video.id,
        googleDriveFileId: video.googleDriveFileId 
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini分析に失敗しました');
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
    });

  } catch (error) {
    console.error('Gemini分析エラー:', error);
    return NextResponse.json(
      { error: '分析に失敗しました' },
      { status: 500 }
    );
  }
}
