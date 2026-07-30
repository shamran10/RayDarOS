-- AlterTable
ALTER TABLE "DiscoveryRun"
ADD COLUMN "providerType" "SourceType" NOT NULL DEFAULT 'MOCK';

-- CreateIndex
CREATE INDEX "SignalSource_projectId_isActive_idx"
ON "SignalSource"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "DiscoveryRun_projectId_startedAt_idx"
ON "DiscoveryRun"("projectId", "startedAt");

-- CreateIndex
CREATE INDEX "DiscoveryRun_signalSourceId_startedAt_idx"
ON "DiscoveryRun"("signalSourceId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveredItem_projectId_platform_sourceType_externalId_key"
ON "DiscoveredItem"("projectId", "platform", "sourceType", "externalId");

-- CreateIndex
CREATE INDEX "DiscoveredItem_projectId_discoveryRunId_idx"
ON "DiscoveredItem"("projectId", "discoveryRunId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationCandidate_projectId_discoveredItemId_candidateType_key"
ON "ConversationCandidate"("projectId", "discoveredItemId", "candidateType");

-- CreateIndex
CREATE INDEX "ConversationCandidate_projectId_status_idx"
ON "ConversationCandidate"("projectId", "status");
