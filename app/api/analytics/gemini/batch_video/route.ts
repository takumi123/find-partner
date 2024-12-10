import { NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { VertexAI } from '@google-cloud/vertexai';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { items } from '@/public/evaluation/items.json';

// Vertex AIの初期化
const vertexAI = new VertexAI({
  project: 'find-partner-443223',
  location: 'asia-northeast1'
});

// OpenAI クライアントの初期化
const openai = new OpenAI();

// 評価項目の型定義
type EvaluationItem = {
  item: string;
  type: 'number' | 'string';
};

// 動画をダウンロードしてbase64エンコードする関数
async function downloadAndEncodeVideo(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

export async function GET() {
  try {
    // 評価項目の取得
    const evaluationItems = items as EvaluationItem[];
    
    // 動画ファイルを取得
    const videos = await db.videoFile.findMany({
      include: {
        analyses: true
      },
      take: 2
    });

    console.log('データベース内の動画ファイル:', {
      videos: videos.map(v => ({
        id: v.id,
        name: v.fileName,
        analysisCount: v.analyses.length
      }))
    });

    if (videos.length === 0) {
      return NextResponse.json({
        message: '処理対象の動画ファイルがありません',
        success: true,
        analysisCount: 0,
        debug: {
          totalVideos: videos.length
        }
      });
    }

    // Geminiモデルの初期化
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: 'gemini-1.5-pro-002',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1,
        topP: 0.95,
      },
    });

    // プロンプトファイルを読み込む
    const videoPromptPath = path.join(process.cwd(), 'public', 'evaluation', 'video_prompt.txt');
    const videoPrompt = await fs.readFile(videoPromptPath, 'utf-8');

    const analysisResults = [];

    // 動画の分析
    for (const videoFile of videos) {
      try {
        console.log('動画分析開始:', {
          id: videoFile.id,
          fileName: videoFile.fileName,
          fileUrl: videoFile.fileUrl
        });

        // 動画をダウンロードしてbase64エンコード
        console.log('動画のダウンロードとエンコード開始');
        const base64Video = await downloadAndEncodeVideo(videoFile.fileUrl);
        console.log('動画のダウンロードとエンコード完了');

        // 動画ファイルのURIを使用してGeminiで分析
        const request = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: videoPrompt
                },
                {
                  inlineData: {
                    mimeType: videoFile.mimeType,
                    data: base64Video
                  }
                }
              ]
            }
          ]
        };

        const streamingResponse = await generativeModel.generateContentStream(request);
        let geminiResponse = '';

        for await (const chunk of streamingResponse.stream) {
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
            geminiResponse += chunk.candidates[0].content.parts[0].text;
          }
        }

        if (!geminiResponse) {
          console.error('Geminiからの応答が空です:', {
            videoId: videoFile.id,
            fileName: videoFile.fileName
          });
          continue;
        }

        // 評価項目の構造化
        const evaluationSchema = {
          type: "object",
          properties: {} as Record<string, {
            type: string;
            description: string;
          }>,
          required: [] as string[]
        };

        // 評価項目からJSONスキーマを動的に生成
        evaluationItems.forEach(item => {
          evaluationSchema.properties[item.item] = {
            type: item.type === 'number' ? 'number' : 'string',
            description: `${item.item}の評価結果`
          };
          evaluationSchema.required.push(item.item);
        });

        // ChatGPTによる構造化
        const chatGptResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "動画分析結果を構造化データとして出力してください。"
            },
            {
              role: "user", 
              content: geminiResponse
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "analyze_video",
              description: "動画分析結果を構造化データとして出力",
              parameters: evaluationSchema
            }
          }],
          tool_choice: {
            type: "function",
            function: { name: "analyze_video" }
          }
        });

        const structuredResponse = chatGptResponse.choices[0]?.message?.content;
        if (!structuredResponse) {
          throw new Error('ChatGPTからの応答が空です');
        }

        console.log('構造化されたデータ:', structuredResponse);

        const analysis = await db.$transaction(async (prisma) => {
          const result = await prisma.analysis.create({
            data: {
              userId: videoFile.userId,
              status: 'completed',
              aiResponses: geminiResponse,
              analysisResults: structuredResponse,
              videoFileId: videoFile.id
            },
            include: {
              videoFile: true
            }
          });

          console.log('分析結果作成確認:', {
            analysisId: result.id,
            videoFileId: result.videoFileId
          });

          return result;
        });

        analysisResults.push(analysis);
      } catch (error) {
        console.error(`動画ID ${videoFile.id} の分析中にエラー:`, {
          error: error instanceof Error ? error.message : String(error),
          videoFile: {
            id: videoFile.id,
            fileName: videoFile.fileName,
            mimeType: videoFile.mimeType
          }
        });
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: '動画の一括分析が完了しまし���',
      analysisCount: analysisResults.length,
      analyses: analysisResults,
      debug: {
        totalVideos: videos.length,
        analyzedVideos: analysisResults.length
      }
    });

  } catch (error) {
    console.error('動画一括分析エラー:', error);
    return NextResponse.json(
      { 
        error: '動画の一括分析に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
