import type {
  ApiResult,
  DiscoveryOperationResult,
  DiscoverySnapshot,
  ManualDiscoveryInput,
  SignalSourceCreateInput,
  SignalSourceUpdateInput
} from "@/lib/discovery/contracts";
import type { SignalSource } from "@/lib/types";

export class DiscoveryRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
  }
}

async function requestDiscovery<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers
      }
    });
  } catch {
    throw new DiscoveryRequestError("Could not reach the discovery service.", 0, "NETWORK_ERROR");
  }

  const payload = (await response.json().catch(() => undefined)) as ApiResult<T> | undefined;
  if (!response.ok || !payload?.ok) {
    const error = payload && !payload.ok ? payload.error : undefined;
    throw new DiscoveryRequestError(
      error?.message ?? "Discovery could not complete the request.",
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.fieldErrors
    );
  }

  return payload.data;
}

const jsonBody = (value: unknown) => JSON.stringify(value);
const projectPath = (projectId: string) =>
  `/api/discovery/projects/${encodeURIComponent(projectId)}`;

export const loadDiscoverySnapshot = () => requestDiscovery<DiscoverySnapshot>("/api/discovery");

export const createSignalSourceRecord = (
  projectId: string,
  input: SignalSourceCreateInput
) =>
  requestDiscovery<SignalSource>(`${projectPath(projectId)}/sources`, {
    method: "POST",
    body: jsonBody(input)
  });

export const updateSignalSourceRecord = (
  projectId: string,
  sourceId: string,
  input: SignalSourceUpdateInput
) =>
  requestDiscovery<SignalSource>(
    `${projectPath(projectId)}/sources/${encodeURIComponent(sourceId)}`,
    {
      method: "PATCH",
      body: jsonBody(input)
    }
  );

export const deleteSignalSourceRecord = (projectId: string, sourceId: string) =>
  requestDiscovery<{ deleted: true }>(
    `${projectPath(projectId)}/sources/${encodeURIComponent(sourceId)}`,
    { method: "DELETE" }
  );

export const runSignalSourceRecord = (projectId: string, sourceId: string) =>
  requestDiscovery<DiscoveryOperationResult>(
    `${projectPath(projectId)}/sources/${encodeURIComponent(sourceId)}/runs`,
    {
      method: "POST",
      body: jsonBody({})
    }
  );

export const runManualDiscoveryRecord = (projectId: string, input: ManualDiscoveryInput) =>
  requestDiscovery<DiscoveryOperationResult>(`${projectPath(projectId)}/manual`, {
    method: "POST",
    body: jsonBody(input)
  });
