import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AnalysisResults } from '../components/dashboard/AnalysisResults';

export default async function AnalysisPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <DashboardLayout
      userName={session.user?.name}
      userRole={session.user?.role}
    >
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">分析結果一覧</h1>
        <div className="grid gap-6">
          <AnalysisResults />
        </div>
      </div>
    </DashboardLayout>
  );
}
