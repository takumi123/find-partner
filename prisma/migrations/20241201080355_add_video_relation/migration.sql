-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "videoFileId" TEXT;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_videoFileId_fkey" FOREIGN KEY ("videoFileId") REFERENCES "VideoFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
