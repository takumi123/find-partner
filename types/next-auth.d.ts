import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: 'user' | 'admin'
      accessToken?: string
    } & DefaultSession["user"]
  }

  interface Account {
    access_token?: string
    refresh_token?: string
    token_type?: string
    expires_at?: number
    scope?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string
    accessToken?: string
  }
}
