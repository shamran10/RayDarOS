import {
  apiSuccess,
  handleProjectBrainError,
  parseMutation
} from "@/lib/project-brain/api-response";
import { organizationUpdateSchema } from "@/lib/project-brain/contracts";
import {
  deleteWorkspaceOrganizationIfEmpty,
  getWorkspaceOrganization,
  updateWorkspaceOrganization
} from "@/lib/project-brain/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return apiSuccess(await getWorkspaceOrganization());
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function PATCH(request: Request) {
  const parsed = await parseMutation(request, organizationUpdateSchema);
  if (!parsed.success) return parsed.response;

  try {
    return apiSuccess(await updateWorkspaceOrganization(parsed.data));
  } catch (error) {
    return handleProjectBrainError(error);
  }
}

export async function DELETE() {
  try {
    return apiSuccess(await deleteWorkspaceOrganizationIfEmpty());
  } catch (error) {
    return handleProjectBrainError(error);
  }
}
