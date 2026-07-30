"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createAutonomousActionLog } from "@/lib/autonomy/autonomous-action-service";
import { runCandidateDeliberation } from "@/lib/deliberation/deliberation-service";
import { createMemoryInsightFromOutcome } from "@/lib/memory/memory-service";
import {
  createCommunityRuleRecord,
  createKnowledgeRecord,
  createProjectRecord,
  loadProjectBrain,
  updateCommunityRuleRecord,
  updateKnowledgeRecord,
  updateProjectRecord
} from "@/lib/project-brain/client";
import type {
  CommunityRuleCreateInput,
  CommunityRuleUpdateInput,
  KnowledgeCreateInput,
  KnowledgeUpdateInput,
  ProjectCreateInput,
  ProjectUpdateInput
} from "@/lib/project-brain/contracts";
import { initialState } from "@/lib/seed-data";
import type {
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
  ResponseDraft
} from "@/lib/types";

const STORAGE_KEY = "reydaros.mvp.state.v1";
const EMPTY_PROJECT: Project = {
  id: "",
  name: "No project configured",
  productType: "",
  productDescription: "",
  primaryObjective: "",
  engagementGoal: "",
  brandAccountName: "",
  websiteUrl: "",
  targetAudience: "",
  defaultTone: "",
  productMentionPolicy: "",
  riskTolerance: "low",
  status: "paused",
  connectedAccount: "Not connected",
  createdAt: "",
  updatedAt: ""
};

type ProjectBrainStatus = "loading" | "ready" | "error";

interface StoreContextValue {
  state: ReydarState;
  activeProject: Project;
  projectBrainStatus: ProjectBrainStatus;
  projectBrainError?: string;
  retryProjectBrain: () => Promise<void>;
  setActiveProjectId: (projectId: string) => void;
  createProject: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt" | "status" | "connectedAccount">
  ) => Promise<Project>;
  updateProject: (projectId: string, patch: Partial<Project>) => Promise<Project>;
  archiveProject: (projectId: string) => Promise<Project>;
  addProductKnowledge: (
    item: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<KnowledgeItem>;
  addMarketKnowledge: (
    item: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<KnowledgeItem>;
  updateKnowledge: (
    kind: "product" | "market",
    itemId: string,
    patch: Partial<KnowledgeItem>
  ) => Promise<KnowledgeItem>;
  addCommunityRule: (
    rule: Omit<CommunityRule, "id" | "createdAt" | "updatedAt">
  ) => Promise<CommunityRule>;
  updateCommunityRule: (ruleId: string, patch: Partial<CommunityRule>) => Promise<CommunityRule>;
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

function projectCreateInput(
  project: Omit<Project, "id" | "createdAt" | "updatedAt" | "status" | "connectedAccount">
): ProjectCreateInput {
  if (project.riskTolerance === "blocked") {
    throw new Error("Blocked is not a valid project risk tolerance.");
  }
  return { ...project, riskTolerance: project.riskTolerance };
}

function projectUpdateInput(patch: Partial<Project>): ProjectUpdateInput {
  const input: ProjectUpdateInput = {};
  if (patch.name !== undefined) input.name = patch.name;
  if (patch.productType !== undefined) input.productType = patch.productType;
  if (patch.productDescription !== undefined) input.productDescription = patch.productDescription;
  if (patch.primaryObjective !== undefined) input.primaryObjective = patch.primaryObjective;
  if (patch.engagementGoal !== undefined) input.engagementGoal = patch.engagementGoal;
  if (patch.brandAccountName !== undefined) input.brandAccountName = patch.brandAccountName;
  if (patch.websiteUrl !== undefined) input.websiteUrl = patch.websiteUrl;
  if (patch.targetAudience !== undefined) input.targetAudience = patch.targetAudience;
  if (patch.defaultTone !== undefined) input.defaultTone = patch.defaultTone;
  if (patch.productMentionPolicy !== undefined) input.productMentionPolicy = patch.productMentionPolicy;
  if (patch.riskTolerance !== undefined && patch.riskTolerance !== "blocked") {
    input.riskTolerance = patch.riskTolerance;
  }
  if (patch.status !== undefined) input.status = patch.status;
  return input;
}

function knowledgeCreateInput(
  item: Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">
): KnowledgeCreateInput {
  return {
    category: item.category,
    title: item.title,
    content: item.content,
    source: item.source,
    status: item.status,
    health: item.health,
    confidence: item.confidence
  };
}

function knowledgeUpdateInput(patch: Partial<KnowledgeItem>): KnowledgeUpdateInput {
  const input: KnowledgeUpdateInput = {};
  if (patch.category !== undefined) input.category = patch.category;
  if (patch.title !== undefined) input.title = patch.title;
  if (patch.content !== undefined) input.content = patch.content;
  if (patch.source !== undefined) input.source = patch.source;
  if (patch.status !== undefined) input.status = patch.status;
  if (patch.health !== undefined) input.health = patch.health;
  if (patch.confidence !== undefined) input.confidence = patch.confidence;
  return input;
}

function communityRuleCreateInput(
  rule: Omit<CommunityRule, "id" | "createdAt" | "updatedAt">
): CommunityRuleCreateInput {
  const {
    projectId: _projectId,
    ...input
  } = rule;
  void _projectId;
  return input;
}

function communityRuleUpdateInput(patch: Partial<CommunityRule>): CommunityRuleUpdateInput {
  const input: CommunityRuleUpdateInput = {};
  if (patch.communityName !== undefined) input.communityName = patch.communityName;
  if (patch.platform !== undefined) input.platform = patch.platform;
  if (patch.topic !== undefined) input.topic = patch.topic;
  if (patch.allowedContentTypes !== undefined) input.allowedContentTypes = patch.allowedContentTypes;
  if (patch.selfPromotionPolicy !== undefined) input.selfPromotionPolicy = patch.selfPromotionPolicy;
  if (patch.linkPolicy !== undefined) input.linkPolicy = patch.linkPolicy;
  if (patch.vendorParticipationRules !== undefined) input.vendorParticipationRules = patch.vendorParticipationRules;
  if (patch.disclosureExpectations !== undefined) input.disclosureExpectations = patch.disclosureExpectations;
  if (patch.tonePreference !== undefined) input.tonePreference = patch.tonePreference;
  if (patch.riskLevel !== undefined) input.riskLevel = patch.riskLevel;
  if (patch.moderatorSensitivity !== undefined) input.moderatorSensitivity = patch.moderatorSensitivity;
  if (patch.productMentionTolerance !== undefined) {
    input.productMentionTolerance = patch.productMentionTolerance;
  }
  if (patch.previousSuccessfulComments !== undefined) {
    input.previousSuccessfulComments = patch.previousSuccessfulComments;
  }
  if (patch.previousRemovals !== undefined) input.previousRemovals = patch.previousRemovals;
  if (patch.previousNegativeReactions !== undefined) {
    input.previousNegativeReactions = patch.previousNegativeReactions;
  }
  if (patch.recommendedReplyStyle !== undefined) input.recommendedReplyStyle = patch.recommendedReplyStyle;
  if (patch.minimumAccountAgeOrKarma !== undefined) {
    input.minimumAccountAgeOrKarma = patch.minimumAccountAgeOrKarma;
  }
  if (patch.engagementFrequencyHistory !== undefined) {
    input.engagementFrequencyHistory = patch.engagementFrequencyHistory;
  }
  return input;
}

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

function withoutServerPersistedData(state: ReydarState): ReydarState {
  return {
    ...state,
    projects: [],
    productKnowledge: [],
    marketKnowledge: [],
    communityRules: [],
    signalSources: [],
    discoveryRuns: [],
    discoveredItems: [],
    conversationCandidates: []
  };
}

function loadState() {
  if (typeof window === "undefined") return withoutServerPersistedData(initialState);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return withoutServerPersistedData(initialState);
    const parsed = JSON.parse(stored) as Partial<ReydarState>;
    return {
      ...initialState,
      ...parsed,
      projects: [],
      productKnowledge: [],
      marketKnowledge: [],
      communityRules: [],
      signalSources: [],
      discoveryRuns: [],
      discoveredItems: [],
      conversationCandidates: [],
      deliberationRuns: parsed.deliberationRuns ?? initialState.deliberationRuns,
      deliberationAgentResults: parsed.deliberationAgentResults ?? initialState.deliberationAgentResults,
      candidateScores: parsed.candidateScores ?? initialState.candidateScores,
      finalDecisions: parsed.finalDecisions ?? initialState.finalDecisions,
      autonomyPolicies: parsed.autonomyPolicies ?? initialState.autonomyPolicies,
      autonomousActionLogs: parsed.autonomousActionLogs ?? initialState.autonomousActionLogs
    } as ReydarState;
  } catch {
    return withoutServerPersistedData(initialState);
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReydarState>(() => withoutServerPersistedData(initialState));
  const [localStateLoaded, setLocalStateLoaded] = useState(false);
  const [projectBrainStatus, setProjectBrainStatus] = useState<ProjectBrainStatus>("loading");
  const [projectBrainError, setProjectBrainError] = useState<string>();

  useEffect(() => {
    setState(loadState());
    setLocalStateLoaded(true);
  }, []);

  useEffect(() => {
    if (!localStateLoaded) return;
    const localState: Partial<ReydarState> = { ...state };
    delete localState.projects;
    delete localState.productKnowledge;
    delete localState.marketKnowledge;
    delete localState.communityRules;
    delete localState.signalSources;
    delete localState.discoveryRuns;
    delete localState.discoveredItems;
    delete localState.conversationCandidates;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
  }, [localStateLoaded, state]);

  const retryProjectBrain = useCallback(async () => {
    setProjectBrainStatus("loading");
    setProjectBrainError(undefined);

    try {
      const snapshot = await loadProjectBrain();
      setState((current) => {
        const activeProjectId = snapshot.projects.some((project) => project.id === current.activeProjectId)
          ? current.activeProjectId
          : (snapshot.projects[0]?.id ?? "");
        return {
          ...current,
          activeProjectId,
          projects: snapshot.projects,
          productKnowledge: snapshot.productKnowledge,
          marketKnowledge: snapshot.marketKnowledge,
          communityRules: snapshot.communityRules
        };
      });
      setProjectBrainStatus("ready");
    } catch (error) {
      setState((current) => ({
        ...current,
        projects: [],
        productKnowledge: [],
        marketKnowledge: [],
        communityRules: []
      }));
      setProjectBrainStatus("error");
      setProjectBrainError(error instanceof Error ? error.message : "Project Brain could not be loaded.");
    }
  }, []);

  useEffect(() => {
    if (localStateLoaded) void retryProjectBrain();
  }, [localStateLoaded, retryProjectBrain]);

  const activeProject = useMemo(
    () => state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0] ?? EMPTY_PROJECT,
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
    async (project) => {
      const created = await createProjectRecord(projectCreateInput(project));
      setState((current) => ({
        ...current,
        activeProjectId: created.id,
        projects: [created, ...current.projects]
      }));
      appendActivity(`Created project ${created.name}.`, created.id, "Project", created.id);
      return created;
    },
    [appendActivity]
  );

  const updateProject = useCallback<StoreContextValue["updateProject"]>(async (projectId, patch) => {
    const updated = await updateProjectRecord(projectId, projectUpdateInput(patch));
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === projectId ? updated : project))
    }));
    return updated;
  }, []);

  const archiveProject = useCallback<StoreContextValue["archiveProject"]>(
    async (projectId) => {
      const updated = await updateProject(projectId, { status: "archived" });
      appendActivity("Archived project.", projectId, "Project", projectId);
      return updated;
    },
    [appendActivity, updateProject]
  );

  const addProductKnowledge = useCallback<StoreContextValue["addProductKnowledge"]>(
    async (item) => {
      const created = await createKnowledgeRecord("product", item.projectId, knowledgeCreateInput(item));
      setState((current) => ({ ...current, productKnowledge: [created, ...current.productKnowledge] }));
      appendActivity(`Added product knowledge: ${created.title}.`, created.projectId, "ProductKnowledgeItem", created.id);
      return created;
    },
    [appendActivity]
  );

  const addMarketKnowledge = useCallback<StoreContextValue["addMarketKnowledge"]>(
    async (item) => {
      const created = await createKnowledgeRecord("market", item.projectId, knowledgeCreateInput(item));
      setState((current) => ({ ...current, marketKnowledge: [created, ...current.marketKnowledge] }));
      appendActivity(`Added market knowledge: ${created.title}.`, created.projectId, "MarketKnowledgeItem", created.id);
      return created;
    },
    [appendActivity]
  );

  const updateKnowledge = useCallback<StoreContextValue["updateKnowledge"]>(
    async (kind, itemId, patch) => {
      const projectId =
        (kind === "product" ? state.productKnowledge : state.marketKnowledge).find(
          (item) => item.id === itemId
        )?.projectId ?? "";
      if (!projectId) throw new Error("The knowledge item is not available in the active workspace.");

      const updated = await updateKnowledgeRecord(kind, projectId, itemId, knowledgeUpdateInput(patch));
      const key = kind === "product" ? "productKnowledge" : "marketKnowledge";
      setState((current) => ({
        ...current,
        [key]: current[key].map((item) => (item.id === itemId ? updated : item))
      }));
      return updated;
    },
    [state.marketKnowledge, state.productKnowledge]
  );

  const addCommunityRule = useCallback<StoreContextValue["addCommunityRule"]>(
    async (rule) => {
      const created = await createCommunityRuleRecord(rule.projectId, communityRuleCreateInput(rule));
      setState((current) => ({ ...current, communityRules: [created, ...current.communityRules] }));
      appendActivity(`Added community rule for ${created.communityName}.`, created.projectId, "CommunityRule", created.id);
      return created;
    },
    [appendActivity]
  );

  const updateCommunityRule = useCallback<StoreContextValue["updateCommunityRule"]>(
    async (ruleId, patch) => {
      const projectId = state.communityRules.find((rule) => rule.id === ruleId)?.projectId ?? "";
      if (!projectId) throw new Error("The community rule is not available in the active workspace.");

      const updated = await updateCommunityRuleRecord(
        projectId,
        ruleId,
        communityRuleUpdateInput(patch)
      );
      setState((current) => ({
        ...current,
        communityRules: current.communityRules.map((rule) => (rule.id === ruleId ? updated : rule))
      }));
      return updated;
    },
    [state.communityRules]
  );

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
    setState((current) => ({
      ...initialState,
      activeProjectId: current.activeProjectId,
      projects: current.projects,
      productKnowledge: current.productKnowledge,
      marketKnowledge: current.marketKnowledge,
      communityRules: current.communityRules,
      signalSources: [],
      discoveryRuns: [],
      discoveredItems: [],
      conversationCandidates: []
    }));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      activeProject,
      projectBrainStatus,
      projectBrainError,
      retryProjectBrain,
      setActiveProjectId,
      createProject,
      updateProject,
      archiveProject,
      addProductKnowledge,
      addMarketKnowledge,
      updateKnowledge,
      addCommunityRule,
      updateCommunityRule,
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
      approveInsight,
      archiveProject,
      createProject,
      logOutcome,
      resetDemoData,
      retryProjectBrain,
      runDeliberationForCandidate,
      saveInsight,
      setActiveProjectId,
      setDraftStatus,
      updateAutonomyPolicy,
      updateCandidateStatus,
      state,
      projectBrainError,
      projectBrainStatus,
      updateCommunityRule,
      updateDraft,
      updateKnowledge,
      updateOpportunityStatus,
      updateProject
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
