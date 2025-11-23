-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "nonce" TEXT NOT NULL,
    "commitHex" TEXT NOT NULL,
    "serverSeed" TEXT,
    "clientSeed" TEXT NOT NULL DEFAULT '',
    "combinedSeed" TEXT NOT NULL DEFAULT '',
    "pegMapHash" TEXT NOT NULL DEFAULT '',
    "rows" INTEGER NOT NULL DEFAULT 12,
    "dropColumn" INTEGER NOT NULL DEFAULT 0,
    "binIndex" INTEGER NOT NULL DEFAULT 0,
    "payoutMultiplier" REAL NOT NULL DEFAULT 1.0,
    "betCents" INTEGER NOT NULL DEFAULT 0,
    "pathJson" TEXT NOT NULL DEFAULT '[]',
    "revealedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Round_createdAt_idx" ON "Round"("createdAt");

-- CreateIndex
CREATE INDEX "Round_status_idx" ON "Round"("status");
