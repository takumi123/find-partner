import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // VideoFileの確認
  const videoFiles = await prisma.videoFile.findMany()
  console.log('VideoFiles:', videoFiles)

  // AudioFileの確認
  const audioFiles = await prisma.audioFile.findMany()
  console.log('AudioFiles:', audioFiles)

  // Analysisの確認
  const analyses = await prisma.analysis.findMany()
  console.log('Analyses:', analyses)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
