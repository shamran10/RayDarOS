import {
  apiSuccess,
  handleProjectBrainError,
  parseMutation
} from "@/lib/project-brain/api-response";
import { communityRuleUpdateSchema } from "@/lib/project-brain/contracts";
import {
  deleteCommunityRule,
  getCommunityRule,
  updateCommunityRule
} from "@/lib/project-brain/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string; ruleId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await getCommunityRule(params.projectId, params.ruleId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, communityRuleUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await updateCommunityRule(params.projectId, params.ruleId, parsed.data));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await deleteCommunityRule(params.projectId, params.ruleId));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
