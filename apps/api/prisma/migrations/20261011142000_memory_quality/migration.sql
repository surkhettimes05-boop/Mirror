CREATE TYPE "MemoryRecordKind" AS ENUM ('DECISION','COMMITMENT','PREDICTION');
CREATE TYPE "MemoryRecordStatus" AS ENUM ('ACTIVE','SUPERSEDED');
CREATE TABLE "MemoryRecord" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "sourceEntryId" TEXT NOT NULL,
 "kind" "MemoryRecordKind" NOT NULL,
 "entityId" TEXT NOT NULL,
 "canonicalText" TEXT NOT NULL,
 "status" "MemoryRecordStatus" NOT NULL DEFAULT 'ACTIVE',
 "supersededById" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MemoryRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MemoryRecord_userId_kind_status_idx" ON "MemoryRecord"("userId","kind","status");
CREATE INDEX "MemoryRecord_sourceEntryId_idx" ON "MemoryRecord"("sourceEntryId");
ALTER TABLE "MemoryRecord" ADD CONSTRAINT "MemoryRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryRecord" ADD CONSTRAINT "MemoryRecord_sourceEntryId_fkey" FOREIGN KEY ("sourceEntryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
