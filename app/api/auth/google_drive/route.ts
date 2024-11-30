import { auth } from "../../../../auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";

// Google Drive APIのセットアップ
const setupGoogleDrive = async () => {
  const session = await auth();
  if (!session?.user) {
    throw new Error("認証が必要です");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  // アクセストークンをセット
  if (!session.user.accessToken) {
    throw new Error("アクセストークンが見つかりません");
  }

  oauth2Client.setCredentials({
    access_token: session.user.accessToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
};

// フォルダ一覧を取得
export async function GET() {
  try {
    const drive = await setupGoogleDrive();
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: "files(id, name)",
      spaces: "drive",
    });

    return NextResponse.json(response.data.files);
  } catch (error) {
    console.error("Google Driveフォルダ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "フォルダ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 特定のフォルダ内の動画ファイル一覧を取得
export async function POST(request: Request) {
  try {
    const { folderId } = await request.json();
    const drive = await setupGoogleDrive();
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'video/')`,
      fields: "files(id, name, webViewLink, thumbnailLink)",
      spaces: "drive",
    });

    return NextResponse.json(response.data.files);
  } catch (error) {
    console.error("Google Drive動画ファイル一覧取得エラー:", error);
    return NextResponse.json(
      { error: "動画ファイル一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
