import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { VertexAI } from '@google-cloud/vertexai';

// Geminiの設定
const vertex_ai = new VertexAI({
  project: 'find-partner-443223',
  location: 'asia-northeast1'
});

const model = 'gemini-1.5-pro-002';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { videoFileId } = await request.json();

    // 動画ファイルの情報を取得
    const videoFile = await db.videoFile.findUnique({
      where: {
        id: videoFileId,
        userId: session.user.id,
      },
    });

    if (!videoFile) {
      return NextResponse.json(
        { error: '動画ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // Geminiモデルのインスタンス化
    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
      },
    });

    // 環境変数からプロンプトを取得
    const prompt = process.env.GEMINI_PROMPT || '動画の内容を分析して、重要なポイントを抽出してください。';

    // Geminiへのリクエストを構築
    const req = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: videoFile.mimeType,
                data: videoFile.fileUrl
              }
            }
          ]
        }
      ],
    };

    // Geminiで分析を実行
    const streamingResp = await generativeModel.generateContentStream(req);
    let fullResponse = '';

    for await (const chunk of streamingResp.stream) {
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
        fullResponse += chunk.candidates[0].content.parts[0].text;
      }
    }

    // 分析結果をデータベースに保存
    const analysis = await db.analysis.create({
      data: {
        title: `${videoFile.fileName}の分析`,
        content: fullResponse,
        userId: session.user.id,
        status: 'completed',
        aiResponses: fullResponse,
        analysisResults: { geminiAnalysis: fullResponse },
      }
    });

    return NextResponse.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('Gemini分析エラー:', error);
    return NextResponse.json(
      { error: '分析に失敗しました' },
      { status: 500 }
    );
  }
}
