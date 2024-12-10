import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    // ファイル名をユニークにするために現在のタイムスタンプを追加
    const timestamp = new Date().getTime();
    const filename = `${timestamp}-${file.name}`;

    // blobストレージにアップロード
    const blob = await put(filename, file, {
      access: 'public',
    });

    // DBに保存
    const audioFile = await db.audioFile.create({
      data: {
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      url: blob.url,
      fileId: audioFile.id,
      success: true
    });
  } catch (error) {
    console.error('アップロードエラー:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
