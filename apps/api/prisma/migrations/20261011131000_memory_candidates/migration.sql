CREATE TYPE "MemoryCandidateKind" AS ENUM ('DECISION', 'COMMITMENT', 'PREDICTION');
CREATE TYPE "MemoryCandidateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "MemoryCandidate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "kind" "MemoryCandidateKind" NOT NULL,
  "payload" JSONB NOT NULL,
  "rationale" TEXT,
  "status" "MemoryCandidateStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "MemoryCandidate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemoryCandidate_userId_status_createdAt_idx" ON "MemoryCandidate"("userId", "status", "createdAt");
ALTER TABLE "MemoryCandidate" ADD CONSTRAINT "MemoryCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryCandidate" ADD CONSTRAINT "MemoryCandidate_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
