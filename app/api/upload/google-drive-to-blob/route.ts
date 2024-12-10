import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { fileId } = await request.json();

    // ユーザーのGoogle Drive認証情報を取得
    const account = await db.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: 'Google Drive認証情報が見つかりません' },
        { status: 401 }
      );
    }

    // Google Drive APIクライアントの設定
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: account.access_token,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // ファイル情報の取得
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name,mimeType,size',
    });

    // ファイルのダウンロード
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    // ストリームをBufferに変換
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.data) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Vercel Blobにアップロード
    const timestamp = new Date().getTime();
    const filename = `${timestamp}-${fileMetadata.data.name}`;
    
    const blob = await put(filename, buffer, {
      access: 'public',
    });

    // データベースに保存
    const videoFile = await db.videoFile.create({
      data: {
        fileName: fileMetadata.data.name || '',
        fileUrl: blob.url,
        fileSize: parseInt(fileMetadata.data.size || '0'),
        mimeType: fileMetadata.data.mimeType || 'video/mp4',
        userId: session.user.id,
        googleDriveFileId: fileId,
      },
    });

    return NextResponse.json({
      success: true,
      videoFile: videoFile,
    });

  } catch (error) {
    console.error('アップロードエラー:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
