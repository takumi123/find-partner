/*
  Warnings:

  - You are about to drop the column `content` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the `AnalysisMetadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvaluationCriteria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvaluationScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoveScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnalysisMetadata" DROP CONSTRAINT "AnalysisMetadata_analysisId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationScore" DROP CONSTRAINT "EvaluationScore_analysisId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationScore" DROP CONSTRAINT "EvaluationScore_criteriaId_fkey";

-- DropForeignKey
ALTER TABLE "LoveScore" DROP CONSTRAINT "LoveScore_userId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "content",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT;

-- DropTable
DROP TABLE "AnalysisMetadata";

-- DropTable
DROP TABLE "EvaluationCriteria";

-- DropTable
DROP TABLE "EvaluationScore";

-- DropTable
DROP TABLE "LoveScore";

-- DropTable
DROP TABLE "Profile";
