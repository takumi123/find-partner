import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    return NextResponse.json({ session })
  } catch (error) {
    console.error("認証エラー:", error)
    return NextResponse.json(
      { error: "認証に失敗しました" },
      { status: 500 }
    )
  }
}
