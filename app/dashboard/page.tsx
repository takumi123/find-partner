import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GoogleDriveConnect } from "../components/dashboard/GoogleDriveConnect";
import { AnalysisResults } from "../components/dashboard/AnalysisResults";
import { LoveScoreTable } from "../components/dashboard/LoveScoreTable";
import { AudioUploader } from "../components/dashboard/AudioUploader";
import { EvaluationManager } from "../components/dashboard/EvaluationManager";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const isAdmin = session.user?.role === 'admin';

  return (
    <DashboardLayout 
      userName={session.user?.name}
      userRole={session.user?.role}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GoogleDriveConnect />
          <AnalysisResults />
        </div>

        <LoveScoreTable />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AudioUploader />
          {isAdmin && <EvaluationManager />}
        </div>
      </div>
    </DashboardLayout>
  );
}
