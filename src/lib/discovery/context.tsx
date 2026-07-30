"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createSignalSourceRecord,
  deleteSignalSourceRecord,
  loadDiscoverySnapshot,
  runManualDiscoveryRecord,
  runSignalSourceRecord,
  updateSignalSourceRecord
} from "@/lib/discovery/client";
import type {
  DiscoveryOperationResult,
  DiscoverySnapshot,
  ManualDiscoveryInput,
  SignalSourceCreateInput,
  SignalSourceUpdateInput
} from "@/lib/discovery/contracts";
import { useReydar } from "@/lib/store";
import type { SignalSource } from "@/lib/types";

export type DiscoveryDataStatus = "loading" | "ready" | "error";

const EMPTY_SNAPSHOT: DiscoverySnapshot = {
  signalSources: [],
  discoveryRuns: [],
  discoveredItems: [],
  conversationCandidates: []
};

interface DiscoveryContextValue {
  snapshot: DiscoverySnapshot;
  status: DiscoveryDataStatus;
  error?: string;
  retry: () => Promise<void>;
  createSource: (projectId: string, input: SignalSourceCreateInput) => Promise<SignalSource>;
  updateSource: (
    projectId: string,
    sourceId: string,
    input: SignalSourceUpdateInput
  ) => Promise<SignalSource>;
  deleteSource: (projectId: string, sourceId: string) => Promise<void>;
  runSource: (projectId: string, sourceId: string) => Promise<DiscoveryOperationResult>;
  runManual: (
    projectId: string,
    input: ManualDiscoveryInput
  ) => Promise<DiscoveryOperationResult>;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const { projectBrainStatus, projectBrainError, retryProjectBrain } = useReydar();
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot>(EMPTY_SNAPSHOT);
  const [status, setStatus] = useState<DiscoveryDataStatus>("loading");
  const [error, setError] = useState<string>();

  const loadSnapshot = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    try {
      setSnapshot(await loadDiscoverySnapshot());
      setStatus("ready");
    } catch (loadError) {
      setSnapshot(EMPTY_SNAPSHOT);
      setStatus("error");
      setError(
        loadError instanceof Error ? loadError.message : "Discovery data could not be loaded."
      );
    }
  }, []);

  const retry = useCallback(async () => {
    if (projectBrainStatus !== "ready") {
      await retryProjectBrain();
    }
    await loadSnapshot();
  }, [loadSnapshot, projectBrainStatus, retryProjectBrain]);

  useEffect(() => {
    if (projectBrainStatus === "ready") {
      void loadSnapshot();
      return;
    }
    if (projectBrainStatus === "error") {
      setSnapshot(EMPTY_SNAPSHOT);
      setStatus("error");
      setError(
        projectBrainError
          ? `Project Brain must load before discovery: ${projectBrainError}`
          : "Project Brain must load before discovery."
      );
    }
  }, [loadSnapshot, projectBrainError, projectBrainStatus]);

  const createSource = useCallback(async (projectId: string, input: SignalSourceCreateInput) => {
    const created = await createSignalSourceRecord(projectId, input);
    setSnapshot((current) => ({
      ...current,
      signalSources: [created, ...current.signalSources]
    }));
    return created;
  }, []);

  const updateSource = useCallback(
    async (projectId: string, sourceId: string, input: SignalSourceUpdateInput) => {
      const updated = await updateSignalSourceRecord(projectId, sourceId, input);
      setSnapshot((current) => ({
        ...current,
        signalSources: current.signalSources.map((source) =>
          source.id === sourceId ? updated : source
        )
      }));
      return updated;
    },
    []
  );

  const deleteSource = useCallback(async (projectId: string, sourceId: string) => {
    await deleteSignalSourceRecord(projectId, sourceId);
    setSnapshot((current) => ({
      ...current,
      signalSources: current.signalSources.filter((source) => source.id !== sourceId)
    }));
  }, []);

  const runSource = useCallback(
    async (projectId: string, sourceId: string) => {
      const result = await runSignalSourceRecord(projectId, sourceId);
      await retry();
      return result;
    },
    [retry]
  );

  const runManual = useCallback(
    async (projectId: string, input: ManualDiscoveryInput) => {
      const result = await runManualDiscoveryRecord(projectId, input);
      await retry();
      return result;
    },
    [retry]
  );

  const value = useMemo<DiscoveryContextValue>(
    () => ({
      snapshot,
      status,
      error,
      retry,
      createSource,
      updateSource,
      deleteSource,
      runSource,
      runManual
    }),
    [
      createSource,
      deleteSource,
      error,
      retry,
      runManual,
      runSource,
      snapshot,
      status,
      updateSource
    ]
  );

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery() {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error("useDiscovery must be used within DiscoveryProvider");
  }
  return context;
}
