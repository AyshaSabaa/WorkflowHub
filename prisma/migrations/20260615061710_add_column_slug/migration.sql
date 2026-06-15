-- AlterTable
ALTER TABLE "Column" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE INDEX "Column_boardId_slug_idx" ON "Column"("boardId", "slug");
