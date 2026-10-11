-- Mirror initial evidence-first schema
CREATE TYPE "EntrySource" AS ENUM ('TEXT','VOICE','IMPORT','SYSTEM');
CREATE TYPE "CommitmentStatus" AS ENUM ('OPEN','COMPLETED','ABANDONED','SUPERSEDED');
CREATE TYPE "PredictionStatus" AS ENUM ('OPEN','RESOLVED','CANCELLED');
CREATE TYPE "EvidenceKind" AS ENUM ('FACT','USER_REPORT','INFERENCE','EXTERNAL');
CREATE TYPE "PatternStatus" AS ENUM ('PROPOSED','ACTIVE','REJECTED','SUPERSEDED');
CREATE TYPE "EvidencePolarity" AS ENUM ('SUPPORTS','COUNTERS');

CREATE TABLE "User" ("id" TEXT NOT NULL,"email" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Entry" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"rawText" TEXT NOT NULL,"source" "EntrySource" NOT NULL DEFAULT 'TEXT',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Entry_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Goal" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Goal_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Decision" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"title" TEXT NOT NULL,"reasoning" TEXT,"alternatives" JSONB,"expectedOutcome" TEXT,"confidence" INTEGER,"killCondition" TEXT,"reviewAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Decision_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Prediction" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"decisionId" TEXT,"statement" TEXT NOT NULL,"probability" INTEGER,"dueAt" TIMESTAMP(3),"status" "PredictionStatus" NOT NULL DEFAULT 'OPEN',"actualOutcome" TEXT,"resolvedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Commitment" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"statement" TEXT NOT NULL,"dueAt" TIMESTAMP(3),"status" "CommitmentStatus" NOT NULL DEFAULT 'OPEN',"completedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Evidence" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"entryId" TEXT,"kind" "EvidenceKind" NOT NULL,"claim" TEXT NOT NULL,"observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Pattern" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"name" TEXT NOT NULL,"hypothesis" TEXT NOT NULL,"status" "PatternStatus" NOT NULL DEFAULT 'PROPOSED',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PatternEvidence" ("patternId" TEXT NOT NULL,"evidenceId" TEXT NOT NULL,"polarity" "EvidencePolarity" NOT NULL,CONSTRAINT "PatternEvidence_pkey" PRIMARY KEY ("patternId","evidenceId"));
CREATE TABLE "AuditEvent" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"action" TEXT NOT NULL,"entityType" TEXT NOT NULL,"entityId" TEXT,"metadata" JSONB,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Entry_userId_createdAt_idx" ON "Entry"("userId","createdAt");
CREATE INDEX "Goal_userId_active_idx" ON "Goal"("userId","active");
CREATE INDEX "Prediction_userId_status_dueAt_idx" ON "Prediction"("userId","status","dueAt");
CREATE INDEX "Commitment_userId_status_dueAt_idx" ON "Commitment"("userId","status","dueAt");
CREATE INDEX "Evidence_userId_observedAt_idx" ON "Evidence"("userId","observedAt");
CREATE INDEX "Pattern_userId_status_idx" ON "Pattern"("userId","status");
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId","createdAt");

ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatternEvidence" ADD CONSTRAINT "PatternEvidence_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatternEvidence" ADD CONSTRAINT "PatternEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
