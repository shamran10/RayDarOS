import {
  apiSuccess,
  handleProjectBrainError,
  parseMutation
} from "@/lib/project-brain/api-response";
import { knowledgeCreateSchema } from "@/lib/project-brain/contracts";
import { createKnowledge, listKnowledge } from "@/lib/project-brain/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await listKnowledge("market", params.projectId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, knowledgeCreateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await createKnowledge("market", params.projectId, parsed.data), 201);
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
