-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN "batchId" TEXT;

-- CreateIndex
CREATE INDEX "Analysis_batchId_idx" ON "Analysis"("batchId");
