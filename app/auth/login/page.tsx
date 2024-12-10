import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { handleGoogleSignIn } from "@/app/actions/auth"

export default async function LoginPage() {
  const session = await auth()
  
  // すでにログインしている場合はダッシュボードにリダイレクト
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            アカウントにログイン
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <form className="space-y-6" action={handleGoogleSignIn}>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Googleでログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
