-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "analysisId" TEXT,
    "reviewerStatus" TEXT NOT NULL DEFAULT 'pending',
    "measurement" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Analysis" ("createdAt", "id", "imageUrl", "resultJson", "userId") SELECT "createdAt", "id", "imageUrl", "resultJson", "userId" FROM "Analysis";
DROP TABLE "Analysis";
ALTER TABLE "new_Analysis" RENAME TO "Analysis";
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
