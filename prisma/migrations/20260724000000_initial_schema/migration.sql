-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'REVIEWER', 'ANALYST');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BLOCKED');

-- CreateEnum
CREATE TYPE "KnowledgeHealth" AS ENUM ('STRONG', 'NEEDS_REVIEW', 'SPARSE', 'MISSING', 'OUTDATED');

-- CreateEnum
CREATE TYPE "KnowledgeItemStatus" AS ENUM ('DRAFT', 'APPROVED', 'RESTRICTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'ANALYZED', 'DRAFT_READY', 'AWAITING_REVIEW', 'APPROVED', 'POSTED_MANUALLY', 'REJECTED', 'SAVED_AS_INSIGHT', 'DO_NOT_REPLY');

-- CreateEnum
CREATE TYPE "IntentLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RecommendedAction" AS ENUM ('HELPFUL_ANSWER_ONLY', 'CLARIFYING_QUESTION', 'HELPFUL_WITH_SOFT_DISCLOSURE', 'PRODUCT_RECOMMENDATION_WITH_DISCLOSURE', 'SAVE_AS_MARKET_INSIGHT', 'MONITOR_FOR_FOLLOW_UP', 'DO_NOT_REPLY');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('HELPFUL_ONLY', 'FOUNDER_STYLE', 'SHORT_CASUAL', 'DETAILED_PRACTICAL', 'CLARIFYING_QUESTION', 'SOFT_PRODUCT_MENTION', 'PRODUCT_RECOMMENDATION_WITH_DISCLOSURE');

-- CreateEnum
CREATE TYPE "ProductMentionLevel" AS ENUM ('LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MOCK', 'MANUAL', 'REDDIT');

-- CreateEnum
CREATE TYPE "DiscoveryRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CandidateType" AS ENUM ('ORIGINAL_POST', 'TOP_COMMENT', 'RECENT_COMMENT', 'NESTED_REPLY', 'UNANSWERED_QUESTION', 'COMPETITOR_MENTION', 'TOOL_REQUEST', 'PAIN_POINT', 'IMPLEMENTATION_QUESTION', 'BUYING_INTENT', 'NEGATIVE_SENTIMENT', 'MARKET_INSIGHT_ONLY');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'MAPPED', 'DELIBERATING', 'DELIBERATED', 'QUEUED_FOR_APPROVAL', 'SAFE_TO_AUTO_ENGAGE', 'AUTO_ENGAGED', 'SAVED_AS_INSIGHT', 'MONITOR_ONLY', 'BLOCKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliberationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "FinalDecisionAction" AS ENUM ('REPLY', 'HELPFUL_ONLY_REPLY', 'CLARIFYING_QUESTION', 'SOFT_PRODUCT_MENTION', 'PRODUCT_RECOMMENDATION_WITH_DISCLOSURE', 'SAVE_AS_MARKET_INSIGHT', 'MONITOR_ONLY', 'DO_NOT_ENGAGE');

-- CreateEnum
CREATE TYPE "AutonomyStatus" AS ENUM ('SAFE_TO_AUTO_ENGAGE', 'NEEDS_HUMAN_APPROVAL', 'MONITOR_ONLY', 'SAVE_AS_INSIGHT_ONLY', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AutonomousActionType" AS ENUM ('AUTO_REPLY', 'QUEUE_FOR_APPROVAL', 'SAVE_AS_INSIGHT', 'MONITOR', 'BLOCK');

-- CreateEnum
CREATE TYPE "AutonomousActionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'BLOCKED', 'SIMULATED');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'COPIED', 'POSTED_MANUALLY');

-- CreateEnum
CREATE TYPE "GuardrailAction" AS ENUM ('WARN', 'REQUIRE_EDIT', 'BLOCK_RESPONSE', 'RECOMMEND_HELPFUL_ONLY', 'RECOMMEND_SAVE_AS_INSIGHT', 'REQUIRE_DISCLOSURE', 'REMOVE_LINK', 'LOWER_PRODUCT_MENTION_LEVEL');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('POSTED_MANUALLY', 'REJECTED', 'SAVED_AS_INSIGHT', 'MONITORING', 'POSITIVE_REPLY', 'NEGATIVE_REPLY', 'REMOVED', 'REMOVED_COMMENT', 'MODERATOR_WARNING', 'MANUAL_REJECTION', 'USER_APPROVED_EDIT', 'AUTO_ENGAGEMENT_SUCCESS', 'AUTO_ENGAGEMENT_BLOCKED', 'AUTO_ENGAGEMENT_FAILURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "primaryObjective" TEXT NOT NULL,
    "engagementGoal" TEXT NOT NULL,
    "brandAccountName" TEXT,
    "websiteUrl" TEXT,
    "targetAudience" TEXT NOT NULL,
    "defaultTone" TEXT NOT NULL,
    "productMentionPolicy" TEXT NOT NULL,
    "riskTolerance" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductKnowledgeItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "status" "KnowledgeItemStatus" NOT NULL DEFAULT 'DRAFT',
    "health" "KnowledgeHealth" NOT NULL DEFAULT 'SPARSE',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductKnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketKnowledgeItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "status" "KnowledgeItemStatus" NOT NULL DEFAULT 'DRAFT',
    "health" "KnowledgeHealth" NOT NULL DEFAULT 'SPARSE',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketKnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "communityName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "allowedContentTypes" TEXT NOT NULL,
    "selfPromotionPolicy" TEXT NOT NULL,
    "linkPolicy" TEXT NOT NULL,
    "vendorParticipationRules" TEXT NOT NULL,
    "disclosureExpectations" TEXT NOT NULL,
    "tonePreference" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "moderatorSensitivity" TEXT NOT NULL,
    "productMentionTolerance" TEXT NOT NULL,
    "previousSuccessfulComments" TEXT,
    "previousRemovals" TEXT,
    "previousNegativeReactions" TEXT,
    "recommendedReplyStyle" TEXT NOT NULL,
    "minimumAccountAgeOrKarma" TEXT,
    "engagementFrequencyHistory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'MOCK',
    "communityName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "keywords" TEXT[],
    "competitorTerms" TEXT[],
    "painPointTerms" TEXT[],
    "excludedTerms" TEXT[],
    "scanFrequency" TEXT NOT NULL,
    "riskTolerance" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "signalSourceId" TEXT NOT NULL,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "candidatesCreated" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "discoveryRunId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'MOCK',
    "externalId" TEXT NOT NULL,
    "parentExternalId" TEXT,
    "authorHandle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "score" INTEGER,
    "replyCount" INTEGER,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveredItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "threadTitle" TEXT NOT NULL,
    "threadUrl" TEXT,
    "sourceText" TEXT NOT NULL,
    "conversationSummary" TEXT NOT NULL,
    "userProblem" TEXT NOT NULL,
    "painPoint" TEXT NOT NULL,
    "audienceMatch" TEXT NOT NULL,
    "productFitExplanation" TEXT NOT NULL,
    "intentLevel" "IntentLevel" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "recommendedAction" "RecommendedAction" NOT NULL,
    "responseType" "ResponseType" NOT NULL,
    "productMentionLevel" "ProductMentionLevel" NOT NULL DEFAULT 'LEVEL_0',
    "reasoning" TEXT NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationCandidate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "discoveredItemId" TEXT,
    "platform" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'MOCK',
    "externalId" TEXT NOT NULL,
    "parentExternalId" TEXT,
    "authorHandle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "candidateType" "CandidateType" NOT NULL,
    "detectedIntent" TEXT NOT NULL,
    "detectedPainPoint" TEXT NOT NULL,
    "competitorMentioned" TEXT,
    "productCategoryMentioned" TEXT,
    "candidateSummary" TEXT NOT NULL,
    "initialRelevanceScore" INTEGER NOT NULL,
    "initialIntentScore" INTEGER NOT NULL,
    "initialRiskScore" INTEGER NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "whyWorthAnalyzing" TEXT NOT NULL,
    "recommendedNextStep" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityScore" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "intentScore" INTEGER NOT NULL,
    "productFitScore" INTEGER NOT NULL,
    "engagementValueScore" INTEGER NOT NULL,
    "promotionRiskScore" INTEGER NOT NULL,
    "communityRiskScore" INTEGER NOT NULL,
    "accountSafetyScore" INTEGER NOT NULL,
    "responseConfidenceScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseDraft" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "candidateId" TEXT,
    "deliberationRunId" TEXT,
    "finalDecisionId" TEXT,
    "responseText" TEXT NOT NULL,
    "responseType" "ResponseType" NOT NULL,
    "productMentionLevel" "ProductMentionLevel" NOT NULL DEFAULT 'LEVEL_0',
    "disclosureIncluded" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "reasoning" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "editedByUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponseDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardrailCheck" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "responseDraftId" TEXT,
    "checkType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "action" "GuardrailAction" NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardrailCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketInsight" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "candidateId" TEXT,
    "deliberationRunId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementOutcome" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "responseDraftId" TEXT,
    "candidateId" TEXT,
    "autonomousActionLogId" TEXT,
    "outcomeType" "OutcomeType" NOT NULL,
    "notes" TEXT,
    "postedUrl" TEXT,
    "sentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliberationRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "DeliberationStatus" NOT NULL DEFAULT 'PENDING',
    "finalDecision" "FinalDecisionAction" NOT NULL DEFAULT 'DO_NOT_ENGAGE',
    "finalConfidence" INTEGER NOT NULL,
    "autonomyStatus" "AutonomyStatus" NOT NULL DEFAULT 'NEEDS_HUMAN_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliberationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliberationAgentResult" (
    "id" TEXT NOT NULL,
    "deliberationRunId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "argumentFor" TEXT NOT NULL,
    "argumentAgainst" TEXT NOT NULL,
    "riskFlags" TEXT[],
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliberationAgentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateScore" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "deliberationRunId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "intentScore" INTEGER NOT NULL,
    "productFitScore" INTEGER NOT NULL,
    "engagementValueScore" INTEGER NOT NULL,
    "promotionRiskScore" INTEGER NOT NULL,
    "communityRiskScore" INTEGER NOT NULL,
    "accountSafetyScore" INTEGER NOT NULL,
    "responseConfidenceScore" INTEGER NOT NULL,
    "skepticObjectionStrength" INTEGER NOT NULL,
    "marketInsightValueScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalDecision" (
    "id" TEXT NOT NULL,
    "deliberationRunId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "selectedAction" "FinalDecisionAction" NOT NULL,
    "selectedResponseType" "ResponseType" NOT NULL,
    "productMentionLevel" "ProductMentionLevel" NOT NULL DEFAULT 'LEVEL_0',
    "requiresDisclosure" BOOLEAN NOT NULL DEFAULT false,
    "autoEngageAllowed" BOOLEAN NOT NULL DEFAULT false,
    "humanApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
    "finalReasoning" TEXT NOT NULL,
    "approvedDraft" TEXT NOT NULL,
    "blockedReason" TEXT,
    "policyResult" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomyPolicy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "communityRuleId" TEXT,
    "name" TEXT NOT NULL,
    "allowAutoEngage" BOOLEAN NOT NULL DEFAULT false,
    "maxCommentsPerDay" INTEGER NOT NULL DEFAULT 3,
    "maxCommentsPerCommunityPerDay" INTEGER NOT NULL DEFAULT 1,
    "maxProductMentionsPerWeek" INTEGER NOT NULL DEFAULT 1,
    "allowedProductMentionLevels" "ProductMentionLevel"[],
    "allowLinks" BOOLEAN NOT NULL DEFAULT false,
    "requireDisclosure" BOOLEAN NOT NULL DEFAULT true,
    "minRelevanceScore" INTEGER NOT NULL DEFAULT 85,
    "minIntentScore" INTEGER NOT NULL DEFAULT 75,
    "minProductFitScore" INTEGER NOT NULL DEFAULT 75,
    "minEngagementValueScore" INTEGER NOT NULL DEFAULT 70,
    "maxPromotionRiskScore" INTEGER NOT NULL DEFAULT 30,
    "maxCommunityRiskScore" INTEGER NOT NULL DEFAULT 35,
    "minAccountSafetyScore" INTEGER NOT NULL DEFAULT 80,
    "maxSkepticObjectionStrength" INTEGER NOT NULL DEFAULT 40,
    "allowedCandidateTypes" "CandidateType"[],
    "blockedCandidateTypes" "CandidateType"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutonomousActionLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "deliberationRunId" TEXT NOT NULL,
    "finalDecisionId" TEXT NOT NULL,
    "actionType" "AutonomousActionType" NOT NULL,
    "actionStatus" "AutonomousActionStatus" NOT NULL DEFAULT 'PENDING',
    "platform" TEXT NOT NULL,
    "community" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "postedUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomousActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEmbedding" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "productKnowledgeItemId" TEXT,
    "marketKnowledgeItemId" TEXT,
    "communityRuleId" TEXT,
    "uploadedDocumentId" TEXT,
    "contentHash" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityScore_opportunityId_key" ON "OpportunityScore"("opportunityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductKnowledgeItem" ADD CONSTRAINT "ProductKnowledgeItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketKnowledgeItem" ADD CONSTRAINT "MarketKnowledgeItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRule" ADD CONSTRAINT "CommunityRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalSource" ADD CONSTRAINT "SignalSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryRun" ADD CONSTRAINT "DiscoveryRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryRun" ADD CONSTRAINT "DiscoveryRun_signalSourceId_fkey" FOREIGN KEY ("signalSourceId") REFERENCES "SignalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredItem" ADD CONSTRAINT "DiscoveredItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredItem" ADD CONSTRAINT "DiscoveredItem_discoveryRunId_fkey" FOREIGN KEY ("discoveryRunId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationCandidate" ADD CONSTRAINT "ConversationCandidate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationCandidate" ADD CONSTRAINT "ConversationCandidate_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationCandidate" ADD CONSTRAINT "ConversationCandidate_discoveredItemId_fkey" FOREIGN KEY ("discoveredItemId") REFERENCES "DiscoveredItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityScore" ADD CONSTRAINT "OpportunityScore_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseDraft" ADD CONSTRAINT "ResponseDraft_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseDraft" ADD CONSTRAINT "ResponseDraft_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseDraft" ADD CONSTRAINT "ResponseDraft_deliberationRunId_fkey" FOREIGN KEY ("deliberationRunId") REFERENCES "DeliberationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseDraft" ADD CONSTRAINT "ResponseDraft_finalDecisionId_fkey" FOREIGN KEY ("finalDecisionId") REFERENCES "FinalDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardrailCheck" ADD CONSTRAINT "GuardrailCheck_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardrailCheck" ADD CONSTRAINT "GuardrailCheck_responseDraftId_fkey" FOREIGN KEY ("responseDraftId") REFERENCES "ResponseDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketInsight" ADD CONSTRAINT "MarketInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketInsight" ADD CONSTRAINT "MarketInsight_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketInsight" ADD CONSTRAINT "MarketInsight_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketInsight" ADD CONSTRAINT "MarketInsight_deliberationRunId_fkey" FOREIGN KEY ("deliberationRunId") REFERENCES "DeliberationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementOutcome" ADD CONSTRAINT "EngagementOutcome_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementOutcome" ADD CONSTRAINT "EngagementOutcome_responseDraftId_fkey" FOREIGN KEY ("responseDraftId") REFERENCES "ResponseDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationRun" ADD CONSTRAINT "DeliberationRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationRun" ADD CONSTRAINT "DeliberationRun_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliberationAgentResult" ADD CONSTRAINT "DeliberationAgentResult_deliberationRunId_fkey" FOREIGN KEY ("deliberationRunId") REFERENCES "DeliberationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateScore" ADD CONSTRAINT "CandidateScore_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateScore" ADD CONSTRAINT "CandidateScore_deliberationRunId_fkey" FOREIGN KEY ("deliberationRunId") REFERENCES "DeliberationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateScore" ADD CONSTRAINT "CandidateScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalDecision" ADD CONSTRAINT "FinalDecision_deliberationRunId_fkey" FOREIGN KEY ("deliberationRunId") REFERENCES "DeliberationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalDecision" ADD CONSTRAINT "FinalDecision_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalDecision" ADD CONSTRAINT "FinalDecision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomyPolicy" ADD CONSTRAINT "AutonomyPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomyPolicy" ADD CONSTRAINT "AutonomyPolicy_communityRuleId_fkey" FOREIGN KEY ("communityRuleId") REFERENCES "CommunityRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousActionLog" ADD CONSTRAINT "AutonomousActionLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousActionLog" ADD CONSTRAINT "AutonomousActionLog_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ConversationCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousActionLog" ADD CONSTRAINT "AutonomousActionLog_deliberationRunId_fkey" FOREIGN KEY ("deliberationRunId") REFERENCES "DeliberationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutonomousActionLog" ADD CONSTRAINT "AutonomousActionLog_finalDecisionId_fkey" FOREIGN KEY ("finalDecisionId") REFERENCES "FinalDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedDocument" ADD CONSTRAINT "UploadedDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_productKnowledgeItemId_fkey" FOREIGN KEY ("productKnowledgeItemId") REFERENCES "ProductKnowledgeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_marketKnowledgeItemId_fkey" FOREIGN KEY ("marketKnowledgeItemId") REFERENCES "MarketKnowledgeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_communityRuleId_fkey" FOREIGN KEY ("communityRuleId") REFERENCES "CommunityRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEmbedding" ADD CONSTRAINT "KnowledgeEmbedding_uploadedDocumentId_fkey" FOREIGN KEY ("uploadedDocumentId") REFERENCES "UploadedDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
