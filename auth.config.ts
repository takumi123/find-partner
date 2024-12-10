import { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"
import { db } from "@/lib/db"

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
            "https://www.googleapis.com/auth/drive.file"
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        // ユーザーを取得または作成
        const dbUser = await db.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            name: user.name,
            role: 'USER',
          },
        });

        // ユーザーIDを更新
        user.id = dbUser.id;
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (user?.id) {
        token.id = user.id;
      }
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.accessToken = token.accessToken as string;
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      const isOnAuthPage = nextUrl.pathname.startsWith('/auth')
      const isApiRoute = nextUrl.pathname.startsWith('/api')
      const isPublicApiRoute = nextUrl.pathname.startsWith('/api/auth')

      // 認証関連のAPIルートは常に許可
      if (isPublicApiRoute) {
        return true
      }

      // その他のAPIルートは認証が必要
      if (isApiRoute) {
        return isLoggedIn
      }

      if (isOnAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl))
        }
        return true
      }

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return Response.redirect(new URL('/auth/login', nextUrl))
      }

      return true
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
