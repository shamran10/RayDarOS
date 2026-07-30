-- Phase 3 is intentionally migration-first. The development database was
-- verified to contain no Opportunity or Deliberation records before this
-- migration was created.

-- AlterTable
ALTER TABLE "DeliberationRun"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "errors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "opportunityId" TEXT NOT NULL,
ADD COLUMN "requestId" TEXT NOT NULL,
ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "finalConfidence" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Opportunity"
ADD COLUMN "candidateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CandidateScore_deliberationRunId_candidateId_key"
ON "CandidateScore"("deliberationRunId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliberationAgentResult_deliberationRunId_agentName_key"
ON "DeliberationAgentResult"("deliberationRunId", "agentName");

-- CreateIndex
CREATE UNIQUE INDEX "DeliberationRun_requestId_key"
ON "DeliberationRun"("requestId");

-- CreateIndex
CREATE INDEX "DeliberationRun_projectId_createdAt_idx"
ON "DeliberationRun"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "DeliberationRun_candidateId_createdAt_idx"
ON "DeliberationRun"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "DeliberationRun_opportunityId_status_idx"
ON "DeliberationRun"("opportunityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeliberationRun_opportunityId_revision_key"
ON "DeliberationRun"("opportunityId", "revision");

-- Prevent parallel active runs while preserving immutable completed history.
CREATE UNIQUE INDEX "DeliberationRun_one_active_per_opportunity_key"
ON "DeliberationRun"("opportunityId")
WHERE "status" IN ('PENDING', 'RUNNING');

-- CreateIndex
CREATE UNIQUE INDEX "FinalDecision_deliberationRunId_key"
ON "FinalDecision"("deliberationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_candidateId_key"
ON "Opportunity"("candidateId");

-- CreateIndex
CREATE INDEX "Opportunity_projectId_updatedAt_idx"
ON "Opportunity"("projectId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationRun"
ADD CONSTRAINT "DeliberationRun_opportunityId_fkey"
FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
