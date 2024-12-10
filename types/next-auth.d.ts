import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      accessToken: string
      role?: 'USER' | 'ADMIN'
      googleDriveConnected?: boolean
      googleDriveFolderId?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role?: 'USER' | 'ADMIN'
    googleDriveConnected?: boolean
    googleDriveFolderId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    accessToken?: string
    role?: 'USER' | 'ADMIN'
    googleDriveConnected?: boolean
    googleDriveFolderId?: string
  }
}
