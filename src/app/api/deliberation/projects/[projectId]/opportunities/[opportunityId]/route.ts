import {
  apiSuccess,
  handleDeliberationError
} from "@/lib/deliberation/api-response";
import { getOpportunityDetail } from "@/lib/deliberation/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { projectId: string; opportunityId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(
      await getOpportunityDetail(params.projectId, params.opportunityId)
    );
  } catch (error) {
    return handleDeliberationError(error);
  }
}
