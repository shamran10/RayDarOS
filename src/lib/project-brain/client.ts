import type {
  ApiResult,
  CommunityRuleCreateInput,
  CommunityRuleUpdateInput,
  KnowledgeCreateInput,
  KnowledgeUpdateInput,
  ProjectBrainSnapshot,
  ProjectCreateInput,
  ProjectUpdateInput
} from "@/lib/project-brain/contracts";
import type { CommunityRule, KnowledgeItem, Project } from "@/lib/types";

export class ProjectBrainRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
  }
}

async function requestProjectBrain<T>(url: string, init?: RequestInit): Promise<T> {
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
    throw new ProjectBrainRequestError("Could not reach the Project Brain service.", 0, "NETWORK_ERROR");
  }

  const payload = (await response.json().catch(() => undefined)) as ApiResult<T> | undefined;
  if (!response.ok || !payload?.ok) {
    const error = payload && !payload.ok ? payload.error : undefined;
    throw new ProjectBrainRequestError(
      error?.message ?? "Project Brain could not complete the request.",
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.fieldErrors
    );
  }

  return payload.data;
}

const jsonBody = (value: unknown) => JSON.stringify(value);

export const loadProjectBrain = () => requestProjectBrain<ProjectBrainSnapshot>("/api/project-brain");

export const createProjectRecord = (input: ProjectCreateInput) =>
  requestProjectBrain<Project>("/api/project-brain/projects", {
    method: "POST",
    body: jsonBody(input)
  });

export const updateProjectRecord = (projectId: string, input: ProjectUpdateInput) =>
  requestProjectBrain<Project>(`/api/project-brain/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: jsonBody(input)
  });

export const createKnowledgeRecord = (
  kind: "product" | "market",
  projectId: string,
  input: KnowledgeCreateInput
) =>
  requestProjectBrain<KnowledgeItem>(
    `/api/project-brain/projects/${encodeURIComponent(projectId)}/${kind}-knowledge`,
    {
      method: "POST",
      body: jsonBody(input)
    }
  );

export const updateKnowledgeRecord = (
  kind: "product" | "market",
  projectId: string,
  itemId: string,
  input: KnowledgeUpdateInput
) =>
  requestProjectBrain<KnowledgeItem>(
    `/api/project-brain/projects/${encodeURIComponent(projectId)}/${kind}-knowledge/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: jsonBody(input)
    }
  );

export const createCommunityRuleRecord = (projectId: string, input: CommunityRuleCreateInput) =>
  requestProjectBrain<CommunityRule>(
    `/api/project-brain/projects/${encodeURIComponent(projectId)}/community-rules`,
    {
      method: "POST",
      body: jsonBody(input)
    }
  );

export const updateCommunityRuleRecord = (
  projectId: string,
  ruleId: string,
  input: CommunityRuleUpdateInput
) =>
  requestProjectBrain<CommunityRule>(
    `/api/project-brain/projects/${encodeURIComponent(projectId)}/community-rules/${encodeURIComponent(ruleId)}`,
    {
      method: "PATCH",
      body: jsonBody(input)
    }
  );
