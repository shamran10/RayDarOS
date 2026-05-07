"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createAutonomousActionLog } from "@/lib/autonomy/autonomous-action-service";
import { mapDiscoveredItemToCandidates, mapOpportunityToCandidate } from "@/lib/candidates/candidate-mapping-service";
import { runHeuristicDarmAnalysis } from "@/lib/darm";
import { runCandidateDeliberation } from "@/lib/deliberation/deliberation-service";
import { runDiscoverySource } from "@/lib/discovery/discovery-service";
import { createManualDiscoveredItem } from "@/lib/discovery/providers/manual-provider";
import { createMemoryInsightFromOutcome } from "@/lib/memory/memory-service";
import { initialState } from "@/lib/seed-data";
import type {
  AnalysisInput,
  AutonomyPolicy,
  CandidateStatus,
  CommunityRule,
  ConversationCandidate,
  DraftStatus,
  EngagementOutcome,
  FinalDecision,
  KnowledgeItem,
  MarketInsight,
  Opportunity,
  OpportunityStatus,
  Project,
  ReydarState,
  ResponseDraft,
  SignalSource
} from "@/lib/types";

const STORAGE_KEY = "reydaros.mvp.state.v1";

interface StoreContextValue {
  state: ReydarState;
  activeProject: Project;
  setActiveProjectId: (projectId: string) => void;
  createProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt" | "status" | "connectedAccount">) => void;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  archiveProject: (projectId: string) => void;
  addProductKnowledge: (item: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">) => void;
  addMarketKnowledge: (item: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">) => void;
  updateKnowledge: (kind: "product" | "market", itemId: string, patch: Partial<KnowledgeItem>) => void;
  addCommunityRule: (rule: Omit<CommunityRule, "id" | "createdAt" | "updatedAt">) => void;
  updateCommunityRule: (ruleId: string, patch: Partial<CommunityRule>) => void;
  createSignalSource: (source: Omit<SignalSource, "id" | "createdAt" | "updatedAt" | "lastScannedAt">) => void;
  updateSignalSource: (sourceId: string, patch: Partial<SignalSource>) => void;
  runSignalDiscovery: (sourceId: string) => Promise<void>;
  analyzeConversation: (input: Omit<AnalysisInput, "project" | "productKnowledge" | "marketKnowledge" | "communityRules">) => Promise<string>;
  runDeliberationForCandidate: (candidateId: string) => Promise<string | undefined>;
  updateCandidateStatus: (candidateId: string, status: CandidateStatus) => void;
  updateAutonomyPolicy: (policyId: string, patch: Partial<AutonomyPolicy>) => void;
  updateOpportunityStatus: (opportunityId: string, status: OpportunityStatus) => void;
  updateDraft: (draftId: string, responseText: string) => void;
  setDraftStatus: (draftId: string, status: DraftStatus) => void;
  saveInsight: (insight: MarketInsight) => void;
  approveInsight: (insightId: string) => void;
  logOutcome: (outcome: Omit<EngagementOutcome, "id" | "createdAt">) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function riskFromScores(score: { promotionRiskScore: number; communityRiskScore: number }): Opportunity["riskLevel"] {
  if (score.promotionRiskScore >= 75 || score.communityRiskScore >= 75) return "high";
  if (score.promotionRiskScore >= 42 || score.communityRiskScore >= 42) return "medium";
  return "low";
}

function recommendedActionFromDecision(decision: FinalDecision): Opportunity["recommendedAction"] {
  if (decision.selectedAction === "clarifying_question") return "clarifying_question";
  if (decision.selectedAction === "soft_product_mention") return "helpful_with_soft_disclosure";
  if (decision.selectedAction === "product_recommendation_with_disclosure") return "product_recommendation_with_disclosure";
  if (decision.selectedAction === "save_as_market_insight") return "save_as_market_insight";
  if (decision.selectedAction === "monitor_only") return "monitor_for_follow_up";
  if (decision.selectedAction === "do_not_engage") return "do_not_reply";
  return "helpful_answer_only";
}

function statusFromAutonomy(decision: FinalDecision, status: string): OpportunityStatus {
  if (status === "blocked" || decision.selectedAction === "do_not_engage") return "do_not_reply";
  if (status === "save_as_insight_only" || decision.selectedAction === "save_as_market_insight") return "saved_as_insight";
  if (status === "monitor_only") return "analyzed";
  return "awaiting_review";
}

function createOpportunityFromCandidate(
  candidate: ConversationCandidate,
  decision: FinalDecision,
  score: ReturnType<typeof runCandidateDeliberation>["score"]
): Opportunity {
  return {
    id: makeId("opp-auto"),
    projectId: candidate.projectId,
    platform: candidate.platform,
    community: candidate.community,
    threadTitle: candidate.title,
    threadUrl: candidate.url,
    sourceText: candidate.body,
    conversationSummary: candidate.candidateSummary,
    userProblem: `The candidate signals ${candidate.detectedPainPoint.toLowerCase()} and ${candidate.detectedIntent.toLowerCase()}.`,
    painPoint: candidate.detectedPainPoint,
    audienceMatch: "Audience fit is inferred from project discovery configuration and market knowledge.",
    productFitExplanation:
      decision.productMentionLevel === 0
        ? "Product fit exists only at the category/problem level, so the safer route is helpful-only engagement."
        : "Product fit is plausible, but any affiliation must be disclosed and policy-gated.",
    intentLevel: score.intentScore >= 75 ? "high" : score.intentScore >= 55 ? "medium" : "low",
    riskLevel: riskFromScores(score),
    recommendedAction: recommendedActionFromDecision(decision),
    responseType: decision.selectedResponseType,
    productMentionLevel: decision.productMentionLevel,
    reasoning: decision.finalReasoning,
    status: statusFromAutonomy(decision, decision.autoEngageAllowed ? "safe_to_auto_engage" : "needs_human_approval"),
    scores: {
      relevanceScore: score.relevanceScore,
      intentScore: score.intentScore,
      productFitScore: score.productFitScore,
      engagementValueScore: score.engagementValueScore,
      promotionRiskScore: score.promotionRiskScore,
      communityRiskScore: score.communityRiskScore,
      accountSafetyScore: score.accountSafetyScore,
      responseConfidenceScore: score.responseConfidenceScore
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createDraftFromFinalDecision(
  opportunityId: string,
  candidate: ConversationCandidate,
  runId: string,
  decision: FinalDecision
): ResponseDraft | undefined {
  if (!decision.approvedDraft.trim()) return undefined;

  return {
    id: makeId("draft-auto"),
    opportunityId,
    candidateId: candidate.id,
    deliberationRunId: runId,
    finalDecisionId: decision.id,
    responseText: decision.approvedDraft,
    responseType: decision.selectedResponseType,
    productMentionLevel: decision.productMentionLevel,
    disclosureIncluded: decision.requiresDisclosure,
    riskLevel: decision.blockedReason ? "high" : decision.productMentionLevel >= 2 ? "medium" : "low",
    reasoning: decision.finalReasoning,
    status: "draft",
    editedByUser: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function loadState() {
  if (typeof window === "undefined") return initialState;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored) as Partial<ReydarState>;
    return {
      ...initialState,
      ...parsed,
      signalSources: parsed.signalSources ?? initialState.signalSources,
      discoveryRuns: parsed.discoveryRuns ?? initialState.discoveryRuns,
      discoveredItems: parsed.discoveredItems ?? initialState.discoveredItems,
      conversationCandidates: parsed.conversationCandidates ?? initialState.conversationCandidates,
      deliberationRuns: parsed.deliberationRuns ?? initialState.deliberationRuns,
      deliberationAgentResults: parsed.deliberationAgentResults ?? initialState.deliberationAgentResults,
      candidateScores: parsed.candidateScores ?? initialState.candidateScores,
      finalDecisions: parsed.finalDecisions ?? initialState.finalDecisions,
      autonomyPolicies: parsed.autonomyPolicies ?? initialState.autonomyPolicies,
      autonomousActionLogs: parsed.autonomousActionLogs ?? initialState.autonomousActionLogs
    } as ReydarState;
  } catch {
    return initialState;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReydarState>(initialState);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeProject = useMemo(
    () => state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0],
    [state.activeProjectId, state.projects]
  );

  const appendActivity = useCallback((message: string, projectId?: string, entityType = "System", entityId?: string) => {
    setState((current) => ({
      ...current,
      activityLogs: [
        {
          id: makeId("activity"),
          projectId,
          entityType,
          entityId,
          action: "user.action",
          message,
          createdAt: new Date().toISOString()
        },
        ...current.activityLogs
      ].slice(0, 40)
    }));
  }, []);

  const setActiveProjectId = useCallback((projectId: string) => {
    setState((current) => ({ ...current, activeProjectId: projectId }));
  }, []);

  const createProject = useCallback<StoreContextValue["createProject"]>(
    (project) => {
      const created: Project = {
        ...project,
        id: makeId("project"),
        connectedAccount: project.brandAccountName ? `u/${project.brandAccountName}` : "Not connected",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState((current) => ({
        ...current,
        activeProjectId: created.id,
        projects: [created, ...current.projects]
      }));
      appendActivity(`Created project ${created.name}.`, created.id, "Project", created.id);
    },
    [appendActivity]
  );

  const updateProject = useCallback<StoreContextValue["updateProject"]>((projectId, patch) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project
      )
    }));
  }, []);

  const archiveProject = useCallback<StoreContextValue["archiveProject"]>(
    (projectId) => {
      updateProject(projectId, { status: "archived" });
      appendActivity("Archived project.", projectId, "Project", projectId);
    },
    [appendActivity, updateProject]
  );

  const addProductKnowledge = useCallback<StoreContextValue["addProductKnowledge"]>(
    (item) => {
      const created: KnowledgeItem = {
        ...item,
        id: makeId("pk"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState((current) => ({ ...current, productKnowledge: [created, ...current.productKnowledge] }));
      appendActivity(`Added product knowledge: ${created.title}.`, created.projectId, "ProductKnowledgeItem", created.id);
    },
    [appendActivity]
  );

  const addMarketKnowledge = useCallback<StoreContextValue["addMarketKnowledge"]>(
    (item) => {
      const created: KnowledgeItem = {
        ...item,
        id: makeId("mk"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState((current) => ({ ...current, marketKnowledge: [created, ...current.marketKnowledge] }));
      appendActivity(`Added market knowledge: ${created.title}.`, created.projectId, "MarketKnowledgeItem", created.id);
    },
    [appendActivity]
  );

  const updateKnowledge = useCallback<StoreContextValue["updateKnowledge"]>((kind, itemId, patch) => {
    const key = kind === "product" ? "productKnowledge" : "marketKnowledge";
    setState((current) => ({
      ...current,
      [key]: current[key].map((item) =>
        item.id === itemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    }));
  }, []);

  const addCommunityRule = useCallback<StoreContextValue["addCommunityRule"]>(
    (rule) => {
      const created: CommunityRule = {
        ...rule,
        id: makeId("cr"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState((current) => ({ ...current, communityRules: [created, ...current.communityRules] }));
      appendActivity(`Added community rule for ${created.communityName}.`, created.projectId, "CommunityRule", created.id);
    },
    [appendActivity]
  );

  const updateCommunityRule = useCallback<StoreContextValue["updateCommunityRule"]>((ruleId, patch) => {
    setState((current) => ({
      ...current,
      communityRules: current.communityRules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch, updatedAt: new Date().toISOString() } : rule
      )
    }));
  }, []);

  const createSignalSource = useCallback<StoreContextValue["createSignalSource"]>(
    (source) => {
      const created: SignalSource = {
        ...source,
        id: makeId("source"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState((current) => ({ ...current, signalSources: [created, ...current.signalSources] }));
      appendActivity(`Created signal source for ${created.communityName}.`, created.projectId, "SignalSource", created.id);
    },
    [appendActivity]
  );

  const updateSignalSource = useCallback<StoreContextValue["updateSignalSource"]>((sourceId, patch) => {
    setState((current) => ({
      ...current,
      signalSources: current.signalSources.map((source) =>
        source.id === sourceId ? { ...source, ...patch, updatedAt: new Date().toISOString() } : source
      )
    }));
  }, []);

  const runDeliberationForCandidate = useCallback<StoreContextValue["runDeliberationForCandidate"]>(
    async (candidateId) => {
      const candidate = state.conversationCandidates.find((item) => item.id === candidateId);
      if (!candidate) return undefined;
      const project = state.projects.find((item) => item.id === candidate.projectId) ?? state.projects[0];
      const result = runCandidateDeliberation({
        candidate,
        project,
        productKnowledge: state.productKnowledge.filter((item) => item.projectId === project.id),
        marketKnowledge: state.marketKnowledge.filter((item) => item.projectId === project.id),
        communityRules: state.communityRules.filter((item) => item.projectId === project.id),
        autonomyPolicies: state.autonomyPolicies.filter((item) => item.projectId === project.id)
      });
      const nextCandidateStatus: CandidateStatus =
        result.run.autonomyStatus === "safe_to_auto_engage"
          ? "safe_to_auto_engage"
          : result.run.autonomyStatus === "blocked"
            ? "blocked"
            : result.run.autonomyStatus === "monitor_only"
              ? "monitor_only"
              : result.run.autonomyStatus === "save_as_insight_only"
                ? "saved_as_insight"
                : "queued_for_approval";
      const opportunity =
        candidate.opportunityId && state.opportunities.some((item) => item.id === candidate.opportunityId)
          ? undefined
          : createOpportunityFromCandidate(candidate, result.finalDecision, result.score);
      const opportunityId = candidate.opportunityId ?? opportunity?.id;
      const draft = opportunityId
        ? createDraftFromFinalDecision(opportunityId, candidate, result.run.id, result.finalDecision)
        : undefined;
      const actionLog = createAutonomousActionLog({
        project,
        candidate,
        run: result.run,
        finalDecision: result.finalDecision,
        policies: state.autonomyPolicies,
        communityRules: state.communityRules
      });

      setState((current) => ({
        ...current,
        conversationCandidates: current.conversationCandidates.map((item) =>
          item.id === candidate.id
            ? { ...item, status: nextCandidateStatus, opportunityId, updatedAt: new Date().toISOString() }
            : item
        ),
        opportunities: opportunity ? [opportunity, ...current.opportunities] : current.opportunities,
        responseDrafts: draft ? [draft, ...current.responseDrafts] : current.responseDrafts,
        deliberationRuns: [result.run, ...current.deliberationRuns.filter((item) => item.candidateId !== candidate.id)],
        deliberationAgentResults: [
          ...result.agentResults,
          ...current.deliberationAgentResults.filter(
            (item) => !current.deliberationRuns.some((run) => run.candidateId === candidate.id && run.id === item.deliberationRunId)
          )
        ],
        candidateScores: [result.score, ...current.candidateScores.filter((item) => item.candidateId !== candidate.id)],
        finalDecisions: [result.finalDecision, ...current.finalDecisions.filter((item) => item.candidateId !== candidate.id)],
        autonomousActionLogs: [actionLog, ...current.autonomousActionLogs],
        activityLogs: [
          {
            id: makeId("activity"),
            projectId: project.id,
            entityType: "DeliberationRun",
            entityId: result.run.id,
            action: "deliberation.completed",
            message: `Deliberation completed for ${candidate.title}.`,
            createdAt: new Date().toISOString()
          },
          ...current.activityLogs
        ]
      }));

      return result.run.id;
    },
    [
      state.autonomyPolicies,
      state.communityRules,
      state.conversationCandidates,
      state.marketKnowledge,
      state.opportunities,
      state.productKnowledge,
      state.projects
    ]
  );

  const runSignalDiscovery = useCallback<StoreContextValue["runSignalDiscovery"]>(
    async (sourceId) => {
      const source = state.signalSources.find((item) => item.id === sourceId);
      if (!source) return;
      const project = state.projects.find((item) => item.id === source.projectId) ?? state.projects[0];
      const discovery = await runDiscoverySource({ project, source });
      const context = {
        project,
        productKnowledge: state.productKnowledge.filter((item) => item.projectId === project.id),
        marketKnowledge: state.marketKnowledge.filter((item) => item.projectId === project.id),
        communityRules: state.communityRules.filter((item) => item.projectId === project.id)
      };
      const candidates = discovery.items.flatMap((item) => mapDiscoveredItemToCandidates({ item, ...context }));
      const deliberated = candidates.map((candidate) => {
        const result = runCandidateDeliberation({
          candidate,
          project,
          productKnowledge: context.productKnowledge,
          marketKnowledge: context.marketKnowledge,
          communityRules: context.communityRules,
          autonomyPolicies: state.autonomyPolicies.filter((item) => item.projectId === project.id)
        });
        const opportunity = createOpportunityFromCandidate(candidate, result.finalDecision, result.score);
        const draft = createDraftFromFinalDecision(opportunity.id, candidate, result.run.id, result.finalDecision);
        const actionLog = createAutonomousActionLog({
          project,
          candidate,
          run: result.run,
          finalDecision: result.finalDecision,
          policies: state.autonomyPolicies,
          communityRules: context.communityRules
        });
        const status: CandidateStatus =
          result.run.autonomyStatus === "safe_to_auto_engage"
            ? "safe_to_auto_engage"
            : result.run.autonomyStatus === "blocked"
              ? "blocked"
              : result.run.autonomyStatus === "monitor_only"
                ? "monitor_only"
                : result.run.autonomyStatus === "save_as_insight_only"
                  ? "saved_as_insight"
                  : "queued_for_approval";
        return {
          candidate: { ...candidate, opportunityId: opportunity.id, status, updatedAt: new Date().toISOString() },
          result,
          opportunity,
          draft,
          actionLog
        };
      });

      setState((current) => ({
        ...current,
        signalSources: current.signalSources.map((item) =>
          item.id === source.id ? { ...item, lastScannedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item
        ),
        discoveryRuns: [
          { ...discovery.run, candidatesCreated: candidates.length, updatedAt: new Date().toISOString() },
          ...current.discoveryRuns
        ],
        discoveredItems: [...discovery.items, ...current.discoveredItems],
        conversationCandidates: [...deliberated.map((item) => item.candidate), ...current.conversationCandidates],
        opportunities: [...deliberated.map((item) => item.opportunity), ...current.opportunities],
        responseDrafts: [
          ...deliberated.flatMap((item) => (item.draft ? [item.draft] : [])),
          ...current.responseDrafts
        ],
        deliberationRuns: [...deliberated.map((item) => item.result.run), ...current.deliberationRuns],
        deliberationAgentResults: [
          ...deliberated.flatMap((item) => item.result.agentResults),
          ...current.deliberationAgentResults
        ],
        candidateScores: [...deliberated.map((item) => item.result.score), ...current.candidateScores],
        finalDecisions: [...deliberated.map((item) => item.result.finalDecision), ...current.finalDecisions],
        autonomousActionLogs: [...deliberated.map((item) => item.actionLog), ...current.autonomousActionLogs],
        activityLogs: [
          {
            id: makeId("activity"),
            projectId: project.id,
            entityType: "DiscoveryRun",
            entityId: discovery.run.id,
            action: "discovery.completed",
            message: `Mock discovery found ${discovery.items.length} item${discovery.items.length === 1 ? "" : "s"} and mapped ${candidates.length} candidate${candidates.length === 1 ? "" : "s"}.`,
            createdAt: new Date().toISOString()
          },
          ...current.activityLogs
        ]
      }));
    },
    [state.autonomyPolicies, state.communityRules, state.marketKnowledge, state.productKnowledge, state.projects, state.signalSources]
  );

  const analyzeConversation = useCallback<StoreContextValue["analyzeConversation"]>(
    async (input) => {
      const project = state.projects.find((item) => item.id === state.activeProjectId) ?? state.projects[0];
      const result = runHeuristicDarmAnalysis({
        ...input,
        project,
        productKnowledge: state.productKnowledge.filter((item) => item.projectId === project.id),
        marketKnowledge: state.marketKnowledge.filter((item) => item.projectId === project.id),
        communityRules: state.communityRules.filter((item) => item.projectId === project.id)
      });
      const manualRunId = makeId("manual-run");
      const manualDiscoveryRun = {
        id: manualRunId,
        projectId: project.id,
        signalSourceId: "manual-intake",
        status: "completed" as const,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        itemsFound: 1,
        candidatesCreated: 1,
        errors: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const manualItem = createManualDiscoveredItem({
        project,
        discoveryRunId: manualRunId,
        platform: input.platform,
        community: input.community || "Unknown community",
        title: input.threadTitle || "Fallback conversation analysis",
        body: input.sourceText,
        url: input.threadUrl || "",
        now: new Date().toISOString()
      });
      const candidate = {
        ...mapOpportunityToCandidate(result.opportunity),
        discoveredItemId: manualItem.id
      };
      const deliberation = runCandidateDeliberation({
        candidate,
        project,
        productKnowledge: state.productKnowledge.filter((item) => item.projectId === project.id),
        marketKnowledge: state.marketKnowledge.filter((item) => item.projectId === project.id),
        communityRules: state.communityRules.filter((item) => item.projectId === project.id),
        autonomyPolicies: state.autonomyPolicies.filter((item) => item.projectId === project.id)
      });
      const candidateStatus: CandidateStatus =
        deliberation.run.autonomyStatus === "safe_to_auto_engage"
          ? "safe_to_auto_engage"
          : deliberation.run.autonomyStatus === "blocked"
            ? "blocked"
            : deliberation.run.autonomyStatus === "monitor_only"
              ? "monitor_only"
              : deliberation.run.autonomyStatus === "save_as_insight_only"
                ? "saved_as_insight"
                : "queued_for_approval";
      const finalDraft = createDraftFromFinalDecision(
        result.opportunity.id,
        candidate,
        deliberation.run.id,
        deliberation.finalDecision
      );
      const actionLog = createAutonomousActionLog({
        project,
        candidate,
        run: deliberation.run,
        finalDecision: deliberation.finalDecision,
        policies: state.autonomyPolicies,
        communityRules: state.communityRules
      });

      setState((current) => ({
        ...current,
        discoveryRuns: [manualDiscoveryRun, ...current.discoveryRuns],
        discoveredItems: [manualItem, ...current.discoveredItems],
        conversationCandidates: [{ ...candidate, status: candidateStatus, updatedAt: new Date().toISOString() }, ...current.conversationCandidates],
        deliberationRuns: [deliberation.run, ...current.deliberationRuns],
        deliberationAgentResults: [...deliberation.agentResults, ...current.deliberationAgentResults],
        candidateScores: [deliberation.score, ...current.candidateScores],
        finalDecisions: [deliberation.finalDecision, ...current.finalDecisions],
        autonomousActionLogs: [actionLog, ...current.autonomousActionLogs],
        opportunities: [result.opportunity, ...current.opportunities],
        responseDrafts: [...(finalDraft ? [finalDraft] : []), ...result.responseDrafts, ...current.responseDrafts],
        guardrailChecks: [...result.guardrailChecks, ...current.guardrailChecks],
        marketInsights: [...result.insightCandidates, ...current.marketInsights],
        activityLogs: [
          {
            id: makeId("activity"),
            projectId: project.id,
            entityType: "Opportunity",
            entityId: result.opportunity.id,
            action: "darm.analysis.created",
            message: `DARM analyzed ${result.opportunity.threadTitle}.`,
            createdAt: new Date().toISOString()
          },
          ...current.activityLogs
        ]
      }));

      return result.opportunity.id;
    },
    [state.activeProjectId, state.autonomyPolicies, state.communityRules, state.marketKnowledge, state.productKnowledge, state.projects]
  );

  const updateOpportunityStatus = useCallback<StoreContextValue["updateOpportunityStatus"]>((opportunityId, status) => {
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.map((opportunity) =>
        opportunity.id === opportunityId ? { ...opportunity, status, updatedAt: new Date().toISOString() } : opportunity
      )
    }));
  }, []);

  const updateCandidateStatus = useCallback<StoreContextValue["updateCandidateStatus"]>((candidateId, status) => {
    setState((current) => ({
      ...current,
      conversationCandidates: current.conversationCandidates.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, status, updatedAt: new Date().toISOString() } : candidate
      )
    }));
  }, []);

  const updateAutonomyPolicy = useCallback<StoreContextValue["updateAutonomyPolicy"]>((policyId, patch) => {
    setState((current) => ({
      ...current,
      autonomyPolicies: current.autonomyPolicies.map((policy) =>
        policy.id === policyId ? { ...policy, ...patch, updatedAt: new Date().toISOString() } : policy
      )
    }));
  }, []);

  const updateDraft = useCallback<StoreContextValue["updateDraft"]>((draftId, responseText) => {
    setState((current) => ({
      ...current,
      responseDrafts: current.responseDrafts.map((draft) =>
        draft.id === draftId
          ? { ...draft, responseText, editedByUser: true, updatedAt: new Date().toISOString() }
          : draft
      )
    }));
  }, []);

  const setDraftStatus = useCallback<StoreContextValue["setDraftStatus"]>((draftId, status) => {
    setState((current) => ({
      ...current,
      responseDrafts: current.responseDrafts.map((draft) =>
        draft.id === draftId ? { ...draft, status, updatedAt: new Date().toISOString() } : draft
      )
    }));
  }, []);

  const saveInsight = useCallback<StoreContextValue["saveInsight"]>(
    (insight) => {
      setState((current) => ({
        ...current,
        marketInsights: current.marketInsights.some((item) => item.id === insight.id)
          ? current.marketInsights.map((item) => (item.id === insight.id ? insight : item))
          : [insight, ...current.marketInsights]
      }));
      appendActivity(`Saved insight: ${insight.title}.`, insight.projectId, "MarketInsight", insight.id);
    },
    [appendActivity]
  );

  const approveInsight = useCallback<StoreContextValue["approveInsight"]>((insightId) => {
    setState((current) => ({
      ...current,
      marketInsights: current.marketInsights.map((insight) =>
        insight.id === insightId ? { ...insight, approved: true, updatedAt: new Date().toISOString() } : insight
      )
    }));
  }, []);

  const logOutcome = useCallback<StoreContextValue["logOutcome"]>(
    (outcome) => {
      const created: EngagementOutcome = {
        ...outcome,
        id: makeId("outcome"),
        createdAt: new Date().toISOString()
      };
      const opportunity = state.opportunities.find((item) => item.id === outcome.opportunityId);
      const project = state.projects.find((item) => item.id === opportunity?.projectId);
      const candidate = state.conversationCandidates.find(
        (item) => item.id === outcome.candidateId || item.opportunityId === outcome.opportunityId
      );
      const run = candidate ? state.deliberationRuns.find((item) => item.candidateId === candidate.id) : undefined;
      const memoryInsight =
        project && opportunity
          ? createMemoryInsightFromOutcome({
              project,
              outcome: created,
              source: opportunity.threadUrl || opportunity.community,
              candidateId: candidate?.id,
              deliberationRunId: run?.id
            })
          : undefined;
      setState((current) => ({
        ...current,
        engagementOutcomes: [created, ...current.engagementOutcomes],
        marketInsights: memoryInsight ? [memoryInsight, ...current.marketInsights] : current.marketInsights
      }));
      if (outcome.outcomeType === "posted_manually") {
        updateOpportunityStatus(outcome.opportunityId, "posted_manually");
      }
      appendActivity("Logged engagement outcome.", undefined, "EngagementOutcome", created.id);
    },
    [appendActivity, state.conversationCandidates, state.deliberationRuns, state.opportunities, state.projects, updateOpportunityStatus]
  );

  const resetDemoData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      activeProject,
      setActiveProjectId,
      createProject,
      updateProject,
      archiveProject,
      addProductKnowledge,
      addMarketKnowledge,
      updateKnowledge,
      addCommunityRule,
      updateCommunityRule,
      createSignalSource,
      updateSignalSource,
      runSignalDiscovery,
      analyzeConversation,
      runDeliberationForCandidate,
      updateCandidateStatus,
      updateAutonomyPolicy,
      updateOpportunityStatus,
      updateDraft,
      setDraftStatus,
      saveInsight,
      approveInsight,
      logOutcome,
      resetDemoData
    }),
    [
      activeProject,
      addCommunityRule,
      addMarketKnowledge,
      addProductKnowledge,
      analyzeConversation,
      approveInsight,
      archiveProject,
      createSignalSource,
      createProject,
      logOutcome,
      resetDemoData,
      runDeliberationForCandidate,
      runSignalDiscovery,
      saveInsight,
      setActiveProjectId,
      setDraftStatus,
      updateAutonomyPolicy,
      updateCandidateStatus,
      state,
      updateCommunityRule,
      updateDraft,
      updateKnowledge,
      updateOpportunityStatus,
      updateProject,
      updateSignalSource
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useReydar() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useReydar must be used within StoreProvider");
  }
  return context;
}
