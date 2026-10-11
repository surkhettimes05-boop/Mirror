CREATE TYPE "DebriefTargetKind" AS ENUM ('COMMITMENT','PREDICTION','DECISION');
CREATE TYPE "DebriefResult" AS ENUM ('SUCCEEDED','PARTIAL','FAILED','INVALIDATED','UNKNOWN');
CREATE TABLE "Debrief" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "sourceEntryId" TEXT NOT NULL,
 "targetKind" "DebriefTargetKind" NOT NULL,
 "targetId" TEXT NOT NULL,
 "result" "DebriefResult" NOT NULL,
 "actualOutcome" TEXT NOT NULL,
 "lesson" TEXT,
 "evidence" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Debrief_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Debrief_userId_targetKind_targetId_idx" ON "Debrief"("userId","targetKind","targetId");
CREATE INDEX "Debrief_userId_createdAt_idx" ON "Debrief"("userId","createdAt");
ALTER TABLE "Debrief" ADD CONSTRAINT "Debrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Debrief" ADD CONSTRAINT "Debrief_sourceEntryId_fkey" FOREIGN KEY ("sourceEntryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
