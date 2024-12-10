import { auth } from "../../../../auth"
import { NextResponse } from "next/server"
import { google } from "googleapis"
import { db } from "../../../../lib/db"
import { put } from '@vercel/blob'
import { Readable } from 'stream'
import axios from "axios"

interface GoogleDriveFile {
  id: string;
  name: string;
  status?: 'processed' | 'error' | 'existing';
  localUrl?: string;
  error?: string;
}

interface GoogleDriveResponse {
  files: {
    id: string;
    name: string;
    mimeType?: string;
    size?: string;
  }[]
}

interface ErrorResponse {
  error: string;
  code?: string;
  success: false;
}

interface SuccessResponse {
  success: true;
  files?: GoogleDriveFile[];
  savedFolderId?: string;
}

// 型定義を追加
interface AxiosErrorResponse {
  response?: {
    status: number;
  };
}

// エラーレスポンスを生成する関数
const createErrorResponse = (message: string, code: string, status: number = 500): Response => {
  const errorResponse: ErrorResponse = {
    error: message,
    code: code,
    success: false
  }
  return NextResponse.json(errorResponse, { status })
}

// ユーザー情報を取得する関数
const getUser = async (email: string) => {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      googleDriveConnected: true,
      googleDriveFolderId: true
    }
  })
  if (!user) {
    throw new Error("ユーザーが見つかりません")
  }
  return user
}

// Google Drive APIのセットアップ
const setupGoogleDrive = async () => {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error("認証が必要です")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
    process.env.NEXTAUTH_URL
  )

  if (!session.user.accessToken) {
    throw new Error("アクセストークンが見つかりません")
  }

  try {
    oauth2Client.setCredentials({
      access_token: session.user.accessToken
    })

    // アクセストークンの有効性を確認
    const tokenInfo = await oauth2Client.getTokenInfo(session.user.accessToken)
    if (!tokenInfo || tokenInfo.expiry_date < Date.now()) {
      throw new Error("アクセストークンの有効期限が切れています")
    }

    const user = await getUser(session.user.email)

    return {
      drive: google.drive({ version: "v3", auth: oauth2Client }),
      userId: user.id,
      googleDriveConnected: user.googleDriveConnected,
      googleDriveFolderId: user.googleDriveFolderId
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("invalid_token")) {
      throw new Error("アクセストークンが無効です。再認証が必要です。")
    }
    throw error
  }
}

// フォルダ一覧を取得
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return createErrorResponse("認証が必要です", "AUTH_REQUIRED", 401)
    }

    const accessToken = session.user.accessToken
    if (!accessToken) {
      return createErrorResponse("Google Drive のアクセストークンが見つかりません", "TOKEN_MISSING", 401)
    }

    try {
      // ユーザー情報を取得
      const user = await getUser(session.user.email)

      const response = await axios.get<GoogleDriveResponse>(
        'https://www.googleapis.com/drive/v3/files',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: "mimeType='application/vnd.google-apps.folder'",
            fields: 'files(id, name)',
          },
        }
      )

      const successResponse: SuccessResponse = {
        success: true,
        files: response.data.files.map(file => ({
          id: file.id || '',
          name: file.name || ''
        })),
        savedFolderId: user.googleDriveConnected ? user.googleDriveFolderId || undefined : undefined
      }
      return NextResponse.json(successResponse)

    } catch (error) {
      if (
        error instanceof Error && 
        'response' in error && 
        (error as Error & AxiosErrorResponse).response?.status === 401
      ) {
        return createErrorResponse(
          "アクセストークンの有効期限が切れています。再認証が必要です。",
          "TOKEN_EXPIRED",
          401
        )
      }
      throw error
    }
  } catch (error) {
    console.error("Google Driveフォルダ一覧取得エラー:", error instanceof Error ? error.message : 'Unknown error')
    return createErrorResponse("フォルダ一覧の取得に失敗しました", "FETCH_ERROR")
  }
}

// フォルダ内の動画ファイル一覧を取得し、新しいファイルを処理
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.folderId) {
      return createErrorResponse("無効なリクエストです", "INVALID_REQUEST", 400)
    }

    const { folderId, action } = body

    try {
      const { drive, userId } = await setupGoogleDrive()

      // フォルダIDを保存
      if (action === 'setWatchFolder') {
        await db.user.update({
          where: { id: userId },
          data: { 
            googleDriveConnected: true,
            googleDriveFolderId: folderId 
          }
        })

        return NextResponse.json({ success: true } as SuccessResponse)
      }

      // フォルダ内の動画ファイル一覧を取得
      const response = await drive.files.list({
        q: `'${folderId}' in parents and (mimeType contains 'video/' or mimeType contains 'audio/')`,
        fields: "files(id, name, mimeType, size)",
        spaces: "drive",
        pageSize: 100
      })

      const files = response.data.files || []
      const processedFiles: GoogleDriveFile[] = []

      // 既存のファイルIDを取得
      const existingFiles = await db.videoFile.findMany({
        where: { userId },
        select: { googleDriveFileId: true }
      })
      const existingFileIds = new Set(existingFiles.map(f => f.googleDriveFileId))

      // 新しいファイルを処理
      for (const file of files) {
        try {
          if (!existingFileIds.has(file.id || '') && file.id) {
            // ファイルをダウンロード
            const fileResponse = await drive.files.get(
              { 
                fileId: file.id, 
                alt: 'media' 
              },
              { responseType: 'stream' }
            )

            const stream = fileResponse.data as Readable

            // Vercel BLOBにアップロード
            const blob = await put(file.name || '', stream, {
              access: 'public',
              contentType: file.mimeType || 'video/mp4'
            })

            // データベースに保存
            await db.videoFile.create({
              data: {
                fileName: file.name || '',
                fileUrl: blob.url,
                fileSize: parseInt(file.size || '0'),
                mimeType: file.mimeType || 'video/mp4',
                user: {
                  connect: {
                    id: userId
                  }
                },
                googleDriveFileId: file.id
              }
            })

            processedFiles.push({
              id: file.id || '',
              name: file.name || '',
              status: 'processed',
              localUrl: blob.url
            })
          } else {
            processedFiles.push({
              id: file.id || '',
              name: file.name || '',
              status: 'existing'
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`ファイル処理エラー: ${file.name || 'Unknown file'}:`, errorMessage)
          processedFiles.push({
            id: file.id || '',
            name: file.name || '',
            status: 'error',
            error: errorMessage
          })
        }
      }

      const successResponse: SuccessResponse = {
        success: true,
        files: processedFiles
      }
      return NextResponse.json(successResponse)

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("アクセストークン")) {
          return createErrorResponse(error.message, "TOKEN_ERROR", 401)
        }
        if (error.message.includes("ユーザーが見つかりません")) {
          return createErrorResponse(error.message, "USER_NOT_FOUND", 404)
        }
      }
      throw error
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error("Google Drive処理エラー:", errorMessage)
    return createErrorResponse("処理に失敗しました", "PROCESS_ERROR")
  }
}
