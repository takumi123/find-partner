import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    console.log('Session in /api/analyses:', session);

    if (!session?.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      console.log('No user ID in session:', session);
      return NextResponse.json(
        { error: "ユーザーIDが見つかりません" },
        { status: 401 }
      );
    }

    console.log('Fetching analyses for user:', userId);

    try {
      const analyses = await db.analysis.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          videoFile: {
            select: {
              fileName: true,
              fileUrl: true,
              googleDriveFileId: true,
            },
          },
          audioFile: {
            select: {
              fileName: true,
              fileUrl: true,
            },
          },
        },
      });

      console.log('Found analyses:', analyses.length);

      if (!analyses) {
        return NextResponse.json({
          success: true,
          analyses: [],
        });
      }

      const response = {
        success: true,
        analyses: analyses.map(analysis => ({
          id: analysis.id,
          analysisResults: analysis.analysisResults,
          aiResponses: analysis.aiResponses,
          totalScore: analysis.totalScore,
          status: analysis.status,
          videoFile: analysis.videoFile,
          audioFile: analysis.audioFile,
          createdAt: analysis.createdAt.toISOString(),
          updatedAt: analysis.updatedAt.toISOString(),
        })),
      };

      console.log('Sending response with analyses count:', response.analyses.length);

      return NextResponse.json(response);

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: "データベースエラーが発生しました" 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("分析結果の取得エラー:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "分析結果の取得に失敗しました" 
      },
      { status: 500 }
    );
  }
}
