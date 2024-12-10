import { auth } from "./auth"

export default auth(() => {
  // your middleware logic here
})

// APIルートも含めて認証を必要とする
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/videos/:path*',
    '/api/analytics/:path*',
    '/api/upload/:path*',
    '/api/analyses/:path*'
  ]
}
