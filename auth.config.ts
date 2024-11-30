import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { Session, Account } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { NextURL } from "next/dist/server/web/next-url"

interface AuthorizedParams {
  auth: { user: Session["user"] } | null
  request: { nextUrl: NextURL }
}

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly",
          access_type: "offline",
          prompt: "consent",
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: AuthorizedParams) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.accessToken = token.accessToken
        const adminEmails = ['admin@example.com']
        session.user.role = adminEmails.includes(session.user.email ?? '') ? 'admin' : 'user'
      }
      return session
    },
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
