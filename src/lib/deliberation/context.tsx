"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  loadProjectOpportunities,
  rerunOpportunityDeliberation,
  startCandidateDeliberation
} from "@/lib/deliberation/client";
import type {
  DeliberationStartResult,
  OpportunitySummary
} from "@/lib/deliberation/contracts";
import { useReydar } from "@/lib/store";

export type DeliberationDataStatus = "loading" | "ready" | "error";

interface DeliberationContextValue {
  opportunities: OpportunitySummary[];
  status: DeliberationDataStatus;
  error?: string;
  retry: () => Promise<void>;
  startCandidate: (candidateId: string) => Promise<DeliberationStartResult>;
  rerunOpportunity: (opportunityId: string) => Promise<DeliberationStartResult>;
}

const DeliberationContext = createContext<DeliberationContextValue | null>(null);

function summaryFromResult(result: DeliberationStartResult): OpportunitySummary {
  return {
    opportunity: result.opportunity.opportunity,
    candidate: result.opportunity.candidate,
    ...(result.opportunity.latestRun
      ? { latestRun: result.opportunity.latestRun }
      : {})
  };
}

export function DeliberationProvider({ children }: { children: React.ReactNode }) {
  const { activeProject, projectBrainStatus } = useReydar();
  const [opportunities, setOpportunities] = useState<OpportunitySummary[]>([]);
  const [status, setStatus] = useState<DeliberationDataStatus>("loading");
  const [error, setError] = useState<string>();
  const inFlight = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!activeProject.id) {
      setOpportunities([]);
      setStatus("ready");
      setError(undefined);
      return;
    }

    setStatus("loading");
    setError(undefined);
    try {
      setOpportunities(await loadProjectOpportunities(activeProject.id));
      setStatus("ready");
    } catch (loadError) {
      setOpportunities([]);
      setStatus("error");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Opportunity data could not be loaded."
      );
    }
  }, [activeProject.id]);

  useEffect(() => {
    if (projectBrainStatus === "ready") {
      void load();
      return;
    }
    if (projectBrainStatus === "error") {
      setOpportunities([]);
      setStatus("error");
      setError("Project Brain must load before deliberation.");
    }
  }, [load, projectBrainStatus]);

  const mergeResult = useCallback((result: DeliberationStartResult) => {
    const summary = summaryFromResult(result);
    setOpportunities((current) => [
      summary,
      ...current.filter(
        (item) => item.opportunity.id !== summary.opportunity.id
      )
    ]);
  }, []);

  const startCandidate = useCallback(
    async (candidateId: string) => {
      const key = `candidate:${candidateId}`;
      if (inFlight.current.has(key)) {
        throw new Error("Deliberation is already starting for this candidate.");
      }
      inFlight.current.add(key);
      try {
        const result = await startCandidateDeliberation(
          activeProject.id,
          candidateId,
          { requestId: crypto.randomUUID() }
        );
        mergeResult(result);
        return result;
      } finally {
        inFlight.current.delete(key);
      }
    },
    [activeProject.id, mergeResult]
  );

  const rerunOpportunity = useCallback(
    async (opportunityId: string) => {
      const key = `opportunity:${opportunityId}`;
      if (inFlight.current.has(key)) {
        throw new Error("A deliberation is already running for this opportunity.");
      }
      inFlight.current.add(key);
      try {
        const result = await rerunOpportunityDeliberation(
          activeProject.id,
          opportunityId,
          { requestId: crypto.randomUUID() }
        );
        mergeResult(result);
        return result;
      } finally {
        inFlight.current.delete(key);
      }
    },
    [activeProject.id, mergeResult]
  );

  const value = useMemo<DeliberationContextValue>(
    () => ({
      opportunities,
      status,
      error,
      retry: load,
      startCandidate,
      rerunOpportunity
    }),
    [error, load, opportunities, rerunOpportunity, startCandidate, status]
  );

  return (
    <DeliberationContext.Provider value={value}>
      {children}
    </DeliberationContext.Provider>
  );
}

export function useDeliberation() {
  const context = useContext(DeliberationContext);
  if (!context) {
    throw new Error("useDeliberation must be used within DeliberationProvider");
  }
  return context;
}
