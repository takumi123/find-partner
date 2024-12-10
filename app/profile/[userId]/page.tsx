import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function UserProfile({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // 自分のプロファイルか管理者でない場合はダッシュボードにリダイレクト
  if (currentUser?.role !== "ADMIN" && currentUser?.id !== userId) {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      audioFiles: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      videoFiles: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          analyses: true,
          audioFiles: true,
          videoFiles: true,
        }
      }
    }
  });

  if (!user) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">ユーザープロファイル</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">名前</p>
              <p className="font-medium">{user.name || '未設定'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">メールアドレス</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">権限</p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
              }`}>
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">登録日</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">分析履歴</h2>
          <p className="text-sm text-gray-500 mb-2">総数: {user._count.analyses}</p>
          <div className="space-y-2">
            {user.analyses.map((analysis) => (
              <div key={analysis.id} className="border-b pb-2">
                <p className="text-sm">
                  {new Date(analysis.createdAt).toLocaleDateString('ja-JP')}
                </p>
                <p className="text-xs text-gray-500">
                  スコア: {analysis.totalScore || '未評価'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">音声ファイル</h2>
          <p className="text-sm text-gray-500 mb-2">総数: {user._count.audioFiles}</p>
          <div className="space-y-2">
            {user.audioFiles.map((file) => (
              <div key={file.id} className="border-b pb-2">
                <p className="text-sm truncate">{file.fileName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">動画ファイル</h2>
          <p className="text-sm text-gray-500 mb-2">総数: {user._count.videoFiles}</p>
          <div className="space-y-2">
            {user.videoFiles.map((file) => (
              <div key={file.id} className="border-b pb-2">
                <p className="text-sm truncate">{file.fileName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
