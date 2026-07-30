import type {
  ApiResult,
  DeliberationRunDetail,
  DeliberationStartResult,
  OpportunityDetail,
  OpportunitySummary,
  StartDeliberationInput
} from "@/lib/deliberation/contracts";

export class DeliberationRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
  }
}

async function requestDeliberation<T>(url: string, init?: RequestInit): Promise<T> {
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
    throw new DeliberationRequestError(
      "Could not reach the deliberation service.",
      0,
      "NETWORK_ERROR"
    );
  }

  const payload = (await response.json().catch(() => undefined)) as ApiResult<T> | undefined;
  if (!response.ok || !payload?.ok) {
    const error = payload && !payload.ok ? payload.error : undefined;
    throw new DeliberationRequestError(
      error?.message ?? "Deliberation could not complete the request.",
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.fieldErrors
    );
  }

  return payload.data;
}

const projectPath = (projectId: string) =>
  `/api/deliberation/projects/${encodeURIComponent(projectId)}`;
const jsonBody = (value: unknown) => JSON.stringify(value);

export const loadProjectOpportunities = (projectId: string) =>
  requestDeliberation<OpportunitySummary[]>(`${projectPath(projectId)}/opportunities`);

export const loadOpportunityDetail = (projectId: string, opportunityId: string) =>
  requestDeliberation<OpportunityDetail>(
    `${projectPath(projectId)}/opportunities/${encodeURIComponent(opportunityId)}`
  );

export const loadOpportunityRuns = (projectId: string, opportunityId: string) =>
  requestDeliberation<DeliberationRunDetail[]>(
    `${projectPath(projectId)}/opportunities/${encodeURIComponent(opportunityId)}/runs`
  );

export const startCandidateDeliberation = (
  projectId: string,
  candidateId: string,
  input: StartDeliberationInput
) =>
  requestDeliberation<DeliberationStartResult>(
    `${projectPath(projectId)}/candidates/${encodeURIComponent(candidateId)}/start`,
    { method: "POST", body: jsonBody(input) }
  );

export const rerunOpportunityDeliberation = (
  projectId: string,
  opportunityId: string,
  input: StartDeliberationInput
) =>
  requestDeliberation<DeliberationStartResult>(
    `${projectPath(projectId)}/opportunities/${encodeURIComponent(opportunityId)}/rerun`,
    { method: "POST", body: jsonBody(input) }
  );
